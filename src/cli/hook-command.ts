import { loadBoard } from '../core/board-loader.js';
import { isDeskError } from '../core/errors.js';
import { findRoot } from '../core/paths.js';
import { addNote, createTask, isoNow, moveTask } from '../core/task-store.js';
import type { Board } from '../core/types.js';
import {
  AGENT_TOOLS,
  HOOK_ACTOR,
  agentInput,
  deriveTitle,
  describeRun,
  isObject,
  parseHookPayload,
  preToolUseOutput,
  summarizeResponse,
  toAssignee,
  type HookPayload,
} from './agent-hooks.js';
import { findByAgentId, readRuns, updateRuns, withoutRun, withRun, type AgentRun, type Warn } from './agent-runs.js';

/** Подмножество CliIo, которое нужно хукам. */
export interface HookIo {
  cwd: string;
  env: NodeJS.ProcessEnv;
  out(line: string): void;
  err(line: string): void;
  readStdin(): Promise<string>;
}

type Handler = (payload: HookPayload, io: HookIo, warn: Warn) => Promise<void>;

const MAX_ERROR_NOTE = 1500;
const EMPTY_RESPONSE = '(пустой ответ)';

const now = (): string => isoNow(() => new Date());
const stringField = (payload: HookPayload, key: string): string | null =>
  typeof payload[key] === 'string' ? payload[key] : null;
const isAgentTool = (payload: HookPayload): boolean => AGENT_TOOLS.includes(stringField(payload, 'tool_name') ?? '');

/** Корень проекта от cwd из payload (DESK_ROOT важнее); null — проекта desk нет, хук молча пропускает. */
function resolveRoot(payload: HookPayload, io: HookIo): string | null {
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

async function moveOrNote(root: string, board: Board, id: string, to: string, fields: Record<string, unknown>, prefix: string): Promise<void> {
  try {
    await moveTask(root, board, id, to, fields, HOOK_ACTOR);
  } catch (e) {
    if (!isDeskError(e)) throw e;
    await addNote(root, board, id, `${prefix} — ${e.message.slice(0, MAX_ERROR_NOTE)}`, HOOK_ACTOR);
  }
}

const agentStart: Handler = async (payload, io, warn) => {
  if (!isAgentTool(payload)) return;
  const root = resolveRoot(payload, io);
  if (root === null) return;
  const board = await loadBoard(root);
  const toolInput = isObject(payload.tool_input) ? payload.tool_input : {};
  const input = agentInput(toolInput);
  const assignee = toAssignee(input.subagentType);
  const task = await createTask(root, board, { title: deriveTitle(input), description: describeRun(input) }, HOOK_ACTOR);
  const column = inProgressColumn(board);
  if (column !== null) await moveOrNote(root, board, task.id, column, { assignee }, 'hook: не удалось взять в работу');
  const key = stringField(payload, 'tool_use_id');
  if (key !== null) await updateRuns(root, (runs) => withRun(runs, key, { task: task.id, at: now() }), warn);
  const output = preToolUseOutput(toolInput, task.id, assignee);
  if (output !== null) io.out(output);
};

async function finishRun(root: string, key: string, run: AgentRun, response: unknown, warn: Warn): Promise<void> {
  try {
    const board = await loadBoard(root);
    const summary = summarizeResponse(response) || EMPTY_RESPONSE;
    await addNote(root, board, run.task, `hook: сабагент завершил работу — ${summary}`, HOOK_ACTOR);
    const done = board.columns.at(-1)?.id;
    if (done !== undefined) await moveOrNote(root, board, run.task, done, {}, 'hook: перенеси вручную');
  } finally {
    await updateRuns(root, (runs) => withoutRun(runs, key), warn);
  }
}

/** Фоновый запуск: PostToolUse приходит сразу со status "async_launched"; карточку закроет SubagentStop. */
function backgroundAgentId(response: unknown): string | null | undefined {
  if (!isObject(response) || response.status !== 'async_launched') return undefined;
  return typeof response.agentId === 'string' ? response.agentId : null;
}

async function markBackground(root: string, key: string, run: AgentRun, agentId: string | null, warn: Warn): Promise<void> {
  const board = await loadBoard(root);
  await addNote(root, board, run.task, `hook: сабагент запущен в фоне (agent ${agentId ?? '?'})`, HOOK_ACTOR);
  if (agentId !== null) await updateRuns(root, (runs) => (runs[key] ? withRun(runs, key, { ...run, agent_id: agentId }) : runs), warn);
}

async function subagentStop(payload: HookPayload, root: string, warn: Warn): Promise<void> {
  const agentId = stringField(payload, 'agent_id');
  if (agentId === null) return;
  const found = findByAgentId(await readRuns(root, warn), agentId);
  if (found !== null) await finishRun(root, found[0], found[1], payload.last_assistant_message, warn);
}

const agentEnd: Handler = async (payload, io, warn) => {
  const isStop = stringField(payload, 'hook_event_name') === 'SubagentStop';
  const key = stringField(payload, 'tool_use_id');
  if (!isStop && (!isAgentTool(payload) || key === null)) return;
  const root = resolveRoot(payload, io);
  if (root === null) return;
  if (isStop || key === null) return subagentStop(payload, root, warn);
  const run = (await readRuns(root, warn))[key];
  if (run === undefined) return;
  const agentId = backgroundAgentId(payload.tool_response);
  if (agentId !== undefined) return markBackground(root, key, run, agentId, warn);
  await finishRun(root, key, run, payload.tool_response, warn);
};

const HANDLERS: Readonly<Record<string, Handler>> = { 'agent-start': agentStart, 'agent-end': agentEnd };

/** `desk hook <name>`: читает payload хука из stdin. Никогда не блокирует Claude Code — всегда код 0, ошибки в stderr. */
export async function runHook(name: string | undefined, io: HookIo): Promise<number> {
  const handler = name === undefined ? undefined : HANDLERS[name];
  if (handler === undefined) {
    io.err(`desk hook: ожидается agent-start или agent-end, получено ${name ?? 'ничего'}`);
    return 0;
  }
  const warn: Warn = (message) => io.err(`desk hook ${name}: ${message}`);
  try {
    const payload = parseHookPayload(await io.readStdin());
    if (payload !== null) await handler(payload, io, warn);
  } catch (e) {
    warn(e instanceof Error ? e.message : String(e));
  }
  return 0;
}
