import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileAtomic } from '../core/fs-atomic.js';
import { withLock } from '../core/lock.js';
import { DESK_DIR } from '../core/paths.js';
import { isObject } from './agent-hooks.js';

/**
 * Запуск сабагента, ключ — tool_use_id вызова Agent. agent_id появляется на SubagentStart
 * (или, запасным путём, из PostToolUse со status "async_launched").
 */
export interface AgentRun {
  task: string;
  created_at: string;
  session_id?: string;
  subagent_type: string;
  assignee: string;
  agent_id?: string;
}

export type AgentRuns = Readonly<Record<string, AgentRun>>;
export type Warn = (message: string) => void;

export const MAX_RUNS = 500;

export const runsPath = (root: string): string => join(root, DESK_DIR, '.agent-runs.json');

const optionalString = (value: unknown): boolean => value === undefined || typeof value === 'string';

const isRun = (value: unknown): value is AgentRun =>
  isObject(value) &&
  typeof value.task === 'string' &&
  typeof value.created_at === 'string' &&
  typeof value.subagent_type === 'string' &&
  typeof value.assignee === 'string' &&
  optionalString(value.session_id) &&
  optionalString(value.agent_id);

/** Битый файл не блокирует хуки: предупреждаем и начинаем с пустой карты (файл перезапишется). */
export async function readRuns(root: string, warn: Warn = () => {}): Promise<AgentRuns> {
  let text: string;
  try {
    text = await readFile(runsPath(root), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw e;
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    value = null;
  }
  if (!isObject(value)) {
    warn(`${runsPath(root)}: не JSON-объект, файл будет перезаписан`);
    return {};
  }
  return Object.fromEntries(Object.entries(value).filter(([, run]) => isRun(run))) as AgentRuns;
}

/**
 * Read-modify-write карты под общим lock `.desk/.lock`. fn возвращает новую карту и результат;
 * пишется, только если карта изменилась. Хранит не больше MAX_RUNS последних записей.
 */
export async function transactRuns<T>(root: string, fn: (runs: AgentRuns) => readonly [AgentRuns, T], warn?: Warn): Promise<T> {
  return withLock(root, async () => {
    const current = await readRuns(root, warn);
    const [next, result] = fn(current);
    if (next !== current) {
      const kept = Object.fromEntries(Object.entries(next).slice(-MAX_RUNS));
      await writeFileAtomic(runsPath(root), `${JSON.stringify(kept, null, 2)}\n`);
    }
    return result;
  });
}

export const updateRuns = (root: string, fn: (runs: AgentRuns) => AgentRuns, warn?: Warn): Promise<void> =>
  transactRuns(root, (runs) => [fn(runs), undefined] as const, warn);

/** Добавляет (или переставляет в конец) запись. */
export const withRun = (runs: AgentRuns, key: string, run: AgentRun): AgentRuns => {
  const { [key]: _old, ...rest } = runs;
  return { ...rest, [key]: run };
};

/** Меняет запись, сохраняя её место (порядок = порядок создания). */
export const replaceRun = (runs: AgentRuns, key: string, run: AgentRun): AgentRuns =>
  key in runs ? { ...runs, [key]: run } : runs;

export const withoutRuns = (runs: AgentRuns, keys: readonly string[]): AgentRuns => {
  const drop = new Set(keys);
  if (!Object.keys(runs).some((key) => drop.has(key))) return runs;
  return Object.fromEntries(Object.entries(runs).filter(([key]) => !drop.has(key)));
};

const normalizeAgentId = (id: string): string => id.replace(/^agent-/, '');

/** Запуск по agent_id (id в Claude Code встречается с префиксом `agent-` и без). */
export function findByAgentId(runs: AgentRuns, agentId: string): [string, AgentRun] | null {
  const wanted = normalizeAgentId(agentId);
  return Object.entries(runs).find(([, run]) => run.agent_id !== undefined && normalizeAgentId(run.agent_id) === wanted) ?? null;
}

/** Старейший запуск той же сессии и того же типа, ещё не получивший agent_id. */
export function findPending(runs: AgentRuns, sessionId: string | null, subagentType: string): [string, AgentRun] | null {
  const candidates = Object.entries(runs).filter(
    ([, run]) => run.agent_id === undefined && (run.session_id ?? null) === sessionId && run.subagent_type === subagentType,
  );
  const oldest = [...candidates].sort(([, a], [, b]) => Date.parse(a.created_at) - Date.parse(b.created_at))[0];
  return oldest ?? null;
}

/** Запуски без agent_id старше maxAgeMs — Claude Code так и не подтвердил их (вызов отклонён или прерван). */
export function staleRuns(runs: AgentRuns, now: Date, maxAgeMs: number): [string, AgentRun][] {
  return Object.entries(runs).filter(([, run]) => run.agent_id === undefined && now.getTime() - Date.parse(run.created_at) > maxAgeMs);
}
