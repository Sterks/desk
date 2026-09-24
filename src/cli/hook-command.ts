import { loadBoard } from '../core/board-loader.js';
import { isDeskError } from '../core/errors.js';
import { findRoot } from '../core/paths.js';
import { addNote, createTask, isoNow, moveTask } from '../core/task-store.js';
import type { Board, Clock } from '../core/types.js';
import {
  AGENT_TOOLS,
  HOOK_ACTOR,
  agentInput,
  agentType,
  assigneeFor,
  cardText,
  deriveTitle,
  describeRun,
  firstLine,
  isObject,
  normalizeAgentType,
  parseHookPayload,
  subagentStartOutput,
  summarizeResponse,
  truncate,
  type HookPayload,
} from './agent-hooks.js';
import {
  findByAgentId,
  findPending,
  readRuns,
  replaceRun,
  staleRuns,
  transactRuns,
  updateRuns,
  withoutRuns,
  withRun,
  type AgentRun,
  type Warn,
} from './agent-runs.js';

/** Подмножество CliIo, которое нужно хукам. clock — для детерминированных тестов. */
export interface HookIo {
  cwd: string;
  env: NodeJS.ProcessEnv;
  out(line: string): void;
  err(line: string): void;
  readStdin(): Promise<string>;
  clock?: Clock;
}

interface HookContext {
  payload: HookPayload;
  io: HookIo;
  warn: Warn;
  clock: Clock;
}

type Handler = (ctx: HookContext) => Promise<void>;

const MAX_ERROR_NOTE = 1500;
const MAX_REASON = 300;
const STALE_RUN_MS = 6 * 60 * 60 * 1000;
const EMPTY_RESPONSE = '(пустой ответ)';
const NO_REASON = 'причина не указана';
const FAILURE_EVENTS: readonly string[] = ['PostToolUseFailure', 'PermissionDenied'];

const stringField = (payload: HookPayload, key: string): string | null =>
  typeof payload[key] === 'string' ? payload[key] : null;
const isAgentTool = (payload: HookPayload): boolean => AGENT_TOOLS.includes(stringField(payload, 'tool_name') ?? '');
const eventName = (payload: HookPayload): string => stringField(payload, 'hook_event_name') ?? '';

/** Корень проекта от cwd из payload (DESK_ROOT важнее); null — проекта desk нет, хук молча пропускает. */
function resolveRoot({ payload, io }: HookContext): string | null {
  try {
    return findRoot(stringField(payload, 'cwd') ?? io.cwd, io.env);
  } catch (e) {
    if (isDeskError(e)) return null;
    throw e;
  }
}

/** Колонка «в работе»: in_progress, иначе вторая; на доске из одной колонки — null. */
function inProgressColumn(board: Board): string | null {
  if (board.columns.length < 2) return null;
  return board.columns.find((c) => c.id === 'in_progress')?.id ?? board.columns[1]?.id ?? null;
}

async function note(root: string, board: Board, id: string, text: string, clock: Clock): Promise<void> {
  await addNote(root, board, id, text, HOOK_ACTOR, clock);
}

async function moveOrNote(root: string, board: Board, id: string, to: string, fields: Record<string, unknown>, prefix: string, clock: Clock): Promise<void> {
  try {
    await moveTask(root, board, id, to, fields, HOOK_ACTOR, clock);
  } catch (e) {
    if (!isDeskError(e)) throw e;
    await note(root, board, id, `${prefix} — ${e.message.slice(0, MAX_ERROR_NOTE)}`, clock);
  }
}

/** Убирает неподтверждённые запуски старше 6 часов и отмечает это на их карточках. */
async function sweepStale(root: string, board: Board, { warn, clock }: HookContext): Promise<void> {
  const stale = await transactRuns(root, (runs) => {
    const found = staleRuns(runs, clock(), STALE_RUN_MS);
    return [withoutRuns(runs, found.map(([key]) => key)), found] as const;
  }, warn);
  for (const [, run] of stale) {
    try {
      await note(root, board, run.task, 'hook: запуск не подтверждён', clock);
    } catch (e) {
      warn(`${run.task}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

const agentStart: Handler = async (ctx) => {
  const { payload, warn, clock } = ctx;
  if (!isAgentTool(payload)) return;
  const root = resolveRoot(ctx);
  if (root === null) return;
  const board = await loadBoard(root);
  await sweepStale(root, board, ctx);
  const input = agentInput(payload.tool_input);
  const assignee = assigneeFor(input);
  const subagentType = agentType(input);
  const task = await createTask(root, board, { title: deriveTitle(input), description: describeRun(input), agent: subagentType }, HOOK_ACTOR, clock);
  const key = stringField(payload, 'tool_use_id');
  const sessionId = stringField(payload, 'session_id');
  const run: AgentRun = { task: task.id, created_at: isoNow(clock), ...(sessionId === null ? {} : { session_id: sessionId }), subagent_type: subagentType, assignee };
  if (key !== null) await updateRuns(root, (runs) => withRun(runs, key, run), warn);
  const column = inProgressColumn(board);
  if (column !== null) await moveOrNote(root, board, task.id, column, { assignee }, 'hook: не удалось взять в работу', clock);
};

/** SubagentStart: связывает agent_id со старейшим ожидающим запуском и отдаёт сабагенту строку карточки. */
const agentAttach: Handler = async (ctx) => {
  const { payload, io, warn, clock } = ctx;
  const agentId = stringField(payload, 'agent_id');
  if (agentId === null) return;
  const root = resolveRoot(ctx);
  if (root === null) return;
  const type = normalizeAgentType(stringField(payload, 'agent_type') ?? undefined);
  const attached = await transactRuns(root, (runs) => {
    const found = findPending(runs, stringField(payload, 'session_id'), type);
    if (found === null) return [runs, null] as const;
    const run: AgentRun = { ...found[1], agent_id: agentId };
    return [replaceRun(runs, found[0], run), run] as const;
  }, warn);
  if (attached === null) return;
  io.out(subagentStartOutput(cardText(attached.task, attached.assignee)));
  await note(root, await loadBoard(root), attached.task, `hook: сабагент запущен (${agentId})`, clock);
};

async function closeRun(root: string, key: string, run: AgentRun, text: string, target: 'first' | 'last', { warn, clock }: HookContext): Promise<void> {
  try {
    const board = await loadBoard(root);
    await note(root, board, run.task, text, clock);
    const column = target === 'first' ? board.columns[0]?.id : board.columns.at(-1)?.id;
    if (column !== undefined) await moveOrNote(root, board, run.task, column, {}, 'hook: перенеси вручную', clock);
  } finally {
    await updateRuns(root, (runs) => withoutRuns(runs, [key]), warn);
  }
}

const doneNote = (response: unknown): string => `hook: сабагент завершил работу — ${summarizeResponse(response) || EMPTY_RESPONSE}`;

function failureNote(payload: HookPayload): string {
  const raw = stringField(payload, 'reason') ?? stringField(payload, 'error') ?? '';
  return `hook: вызов не выполнен — ${truncate(firstLine(raw), MAX_REASON) || NO_REASON}`;
}

/** agentId фонового запуска (PostToolUse со status "async_launched"); undefined — это не фоновый запуск. */
function backgroundAgentId(response: unknown): string | null | undefined {
  if (!isObject(response) || response.status !== 'async_launched') return undefined;
  return typeof response.agentId === 'string' ? response.agentId : null;
}

async function subagentStop(ctx: HookContext, root: string): Promise<void> {
  const agentId = stringField(ctx.payload, 'agent_id');
  if (agentId === null) return;
  const found = findByAgentId(await readRuns(root, ctx.warn), agentId);
  if (found !== null) await closeRun(root, found[0], found[1], doneNote(ctx.payload.last_assistant_message), 'last', ctx);
}

/** Фоновый запуск: карточку закроет SubagentStop. agent_id запоминаем, только если SubagentStart его не записал. */
async function rememberBackground(ctx: HookContext, root: string, key: string, agentId: string | null): Promise<void> {
  if (agentId === null) return;
  await updateRuns(root, (runs) => {
    const run = runs[key];
    return run === undefined || run.agent_id !== undefined ? runs : replaceRun(runs, key, { ...run, agent_id: agentId });
  }, ctx.warn);
}

const agentEnd: Handler = async (ctx) => {
  const { payload } = ctx;
  const event = eventName(payload);
  const key = stringField(payload, 'tool_use_id');
  if (event !== 'SubagentStop' && (!isAgentTool(payload) || key === null)) return;
  const root = resolveRoot(ctx);
  if (root === null) return;
  if (event === 'SubagentStop' || key === null) return subagentStop(ctx, root);
  const run = (await readRuns(root, ctx.warn))[key];
  if (run === undefined) return;
  if (FAILURE_EVENTS.includes(event)) return closeRun(root, key, run, failureNote(payload), 'first', ctx);
  const agentId = backgroundAgentId(payload.tool_response);
  if (agentId !== undefined) return rememberBackground(ctx, root, key, agentId);
  await closeRun(root, key, run, doneNote(payload.tool_response), 'last', ctx);
};

const HANDLERS: Readonly<Record<string, Handler>> = { 'agent-start': agentStart, 'agent-attach': agentAttach, 'agent-end': agentEnd };

/** `desk hook <name>`: читает payload хука из stdin. Никогда не блокирует Claude Code — всегда код 0, ошибки в stderr. */
export async function runHook(name: string | undefined, io: HookIo): Promise<number> {
  const handler = name === undefined ? undefined : HANDLERS[name];
  if (handler === undefined) {
    io.err(`desk hook: ожидается ${Object.keys(HANDLERS).join(', ')}, получено ${name ?? 'ничего'}`);
    return 0;
  }
  const warn: Warn = (message) => io.err(`desk hook ${name}: ${message}`);
  try {
    const payload = parseHookPayload(await io.readStdin());
    if (payload !== null) await handler({ payload, io, warn, clock: io.clock ?? (() => new Date()) });
  } catch (e) {
    warn(e instanceof Error ? e.message : String(e));
  }
  return 0;
}
