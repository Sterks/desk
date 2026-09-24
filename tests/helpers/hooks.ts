import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from 'vitest';
import { runCli, type CliIo } from '../../src/cli/run.js';
import { loadBoard } from '../../src/core/board-loader.js';
import { loadAll, readableTasks } from '../../src/core/task-store.js';
import type { Task } from '../../src/core/types.js';

export type TestIo = CliIo & { outLines: string[]; errLines: string[] };

export function hookIo(cwd: string, stdin = '', opts: { env?: NodeJS.ProcessEnv; now?: string } = {}): TestIo {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    cwd,
    env: opts.env ?? {},
    out: (line) => outLines.push(line),
    err: (line) => errLines.push(line),
    readStdin: async () => stdin,
    ...(opts.now === undefined ? {} : { clock: () => new Date(opts.now as string) }),
    outLines,
    errLines,
  };
}

export const runsFile = (root: string): string => join(root, '.desk', '.agent-runs.json');

type Json = Record<string, unknown>;

export function preToolUse(cwd: string, overrides: Json = {}, toolInput: Json = {}): string {
  return JSON.stringify({
    session_id: 's1',
    transcript_path: '/tmp/t.jsonl',
    cwd,
    hook_event_name: 'PreToolUse',
    tool_name: 'Agent',
    tool_input: { description: 'Найти эндпоинты', prompt: 'Найди все API эндпоинты в src/', subagent_type: 'Explore', ...toolInput },
    tool_use_id: 'toolu_1',
    ...overrides,
  });
}

export function postToolUse(cwd: string, response: unknown, overrides: Json = {}): string {
  return JSON.stringify({
    session_id: 's1',
    cwd,
    hook_event_name: 'PostToolUse',
    tool_name: 'Agent',
    tool_input: { description: 'Найти эндпоинты', prompt: 'x', subagent_type: 'Explore' },
    tool_response: response,
    tool_use_id: 'toolu_1',
    ...overrides,
  });
}

export function subagentStart(cwd: string, agentId: string, agentType: string | undefined = 'Explore', overrides: Json = {}): string {
  return JSON.stringify({ session_id: 's1', cwd, hook_event_name: 'SubagentStart', agent_id: agentId, agent_type: agentType, ...overrides });
}

export function subagentStop(cwd: string, agentId: string, message = 'Готово'): string {
  return JSON.stringify({
    session_id: 's1',
    cwd,
    hook_event_name: 'SubagentStop',
    agent_id: agentId,
    agent_type: 'Explore',
    last_assistant_message: message,
  });
}

export async function tasks(root: string): Promise<Task[]> {
  return readableTasks(await loadAll(root, await loadBoard(root)));
}

export async function taskFiles(root: string): Promise<string[]> {
  return (await readdir(join(root, '.desk', 'tasks'))).filter((name) => name.endsWith('.md'));
}

export interface RunJson {
  task: string;
  created_at: string;
  session_id?: string;
  subagent_type: string;
  assignee: string;
  agent_id?: string;
}

export async function runs(root: string): Promise<Record<string, RunJson>> {
  return JSON.parse(await readFile(runsFile(root), 'utf8'));
}

export async function hook(name: string, root: string, stdin: string, now?: string): Promise<TestIo> {
  const x = hookIo(root, stdin, now === undefined ? {} : { now });
  expect(await runCli(['hook', name], x)).toBe(0);
  return x;
}
