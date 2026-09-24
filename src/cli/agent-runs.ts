import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileAtomic } from '../core/fs-atomic.js';
import { withLock } from '../core/lock.js';
import { DESK_DIR } from '../core/paths.js';
import { isObject } from './agent-hooks.js';

/** Связь tool_use_id запуска сабагента → карточка. agent_id известен только для фоновых запусков. */
export interface AgentRun {
  task: string;
  at: string;
  agent_id?: string;
}

export type AgentRuns = Readonly<Record<string, AgentRun>>;

export const MAX_RUNS = 500;

export const runsPath = (root: string): string => join(root, DESK_DIR, '.agent-runs.json');

const isRun = (value: unknown): value is AgentRun =>
  isObject(value) &&
  typeof value.task === 'string' &&
  typeof value.at === 'string' &&
  (value.agent_id === undefined || typeof value.agent_id === 'string');

export type Warn = (message: string) => void;

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

/** Read-modify-write файла запусков под общим lock `.desk/.lock`; хранит не больше MAX_RUNS последних записей. */
export async function updateRuns(root: string, fn: (runs: AgentRuns) => AgentRuns, warn?: Warn): Promise<AgentRuns> {
  return withLock(root, async () => {
    const current = await readRuns(root, warn);
    const next = fn(current);
    if (next === current) return current;
    const kept = Object.fromEntries(Object.entries(next).slice(-MAX_RUNS));
    await writeFileAtomic(runsPath(root), `${JSON.stringify(kept, null, 2)}\n`);
    return kept;
  });
}

export const withRun = (runs: AgentRuns, key: string, run: AgentRun): AgentRuns => {
  const { [key]: _old, ...rest } = runs;
  return { ...rest, [key]: run };
};

export const withoutRun = (runs: AgentRuns, key: string): AgentRuns => {
  if (!(key in runs)) return runs;
  const { [key]: _removed, ...rest } = runs;
  return rest;
};

const normalizeAgentId = (id: string): string => id.replace(/^agent-/, '');

/** Ищет запуск по agent_id из SubagentStop (id в Claude Code встречается с префиксом `agent-` и без). */
export function findByAgentId(runs: AgentRuns, agentId: string): [string, AgentRun] | null {
  const wanted = normalizeAgentId(agentId);
  const found = Object.entries(runs).find(([, run]) => run.agent_id !== undefined && normalizeAgentId(run.agent_id) === wanted);
  return found ?? null;
}
