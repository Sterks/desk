import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cardLine } from '../../src/cli/agent-hooks.js';
import { runCli, type CliIo } from '../../src/cli/run.js';
import { BOARD_TEMPLATE } from '../../src/cli/templates.js';
import { loadBoard } from '../../src/core/board-loader.js';
import { createTask, loadAll, moveTask, readableTasks } from '../../src/core/task-store.js';
import type { Task } from '../../src/core/types.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

type TestIo = CliIo & { outLines: string[]; errLines: string[] };

function io(cwd: string, stdin = '', env: NodeJS.ProcessEnv = {}): TestIo {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    cwd,
    env,
    out: (line) => outLines.push(line),
    err: (line) => errLines.push(line),
    readStdin: async () => stdin,
    outLines,
    errLines,
  };
}

const runsFile = (root: string): string => join(root, '.desk', '.agent-runs.json');

function preToolUse(cwd: string, overrides: Record<string, unknown> = {}, toolInput: Record<string, unknown> = {}): string {
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

function postToolUse(cwd: string, response: unknown, overrides: Record<string, unknown> = {}): string {
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

async function tasks(root: string): Promise<Task[]> {
  return readableTasks(await loadAll(root, await loadBoard(root)));
}

async function taskFiles(root: string): Promise<string[]> {
  return (await readdir(join(root, '.desk', 'tasks'))).filter((name) => name.endsWith('.md'));
}

async function runs(root: string): Promise<Record<string, { task: string; agent_id?: string }>> {
  return JSON.parse(await readFile(runsFile(root), 'utf8'));
}

async function start(root: string, stdin = preToolUse(root)): Promise<TestIo> {
  const x = io(root, stdin);
  expect(await runCli(['hook', 'agent-start'], x)).toBe(0);
  return x;
}

describe('desk hook agent-start', () => {
  it('creates a card in in_progress assigned to the subagent type and records the run', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = await start(root);
    const [task] = await tasks(root);
    expect(task).toMatchObject({ id: 'T-001', title: 'Найти эндпоинты', column: 'in_progress', assignee: 'Explore', createdBy: 'claude-code' });
    expect(task?.description).toBe('**Сабагент:** Explore\n\nНайди все API эндпоинты в src/');
    expect((await runs(root)).toolu_1?.task).toBe('T-001');
    expect(x.errLines).toEqual([]);
  });

  it('prints PreToolUse JSON whose updatedInput.prompt ends with the card line', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = await start(root, preToolUse(root, {}, { run_in_background: true }));
    expect(x.outLines).toHaveLength(1);
    const output = JSON.parse(x.outLines[0] ?? '');
    expect(output.hookSpecificOutput.hookEventName).toBe('PreToolUse');
    expect(output.hookSpecificOutput.permissionDecision).toBe('allow');
    expect(output.hookSpecificOutput.updatedInput).toEqual({
      description: 'Найти эндпоинты',
      subagent_type: 'Explore',
      run_in_background: true,
      prompt: `Найди все API эндпоинты в src/${cardLine('T-001', 'Explore')}`,
    });
  });

  it('accepts the legacy Task tool name and defaults the type to general-purpose', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, { tool_name: 'Task' }, { subagent_type: undefined }));
    const [task] = await tasks(root);
    expect(task?.assignee).toBe('general-purpose');
    expect(task?.description.startsWith('**Сабагент:** general-purpose')).toBe(true);
  });

  it.each([
    ['a non-Agent tool', (root: string) => preToolUse(root, { tool_name: 'Bash' })],
    ['invalid JSON', () => '{not json'],
    ['a non-object payload', () => '[1,2]'],
  ])('ignores %s', async (_name, payload) => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = await start(root, payload(root));
    expect(x.outLines).toEqual([]);
    expect(await taskFiles(root)).toEqual([]);
    expect(existsSync(runsFile(root))).toBe(false);
  });

  it('does nothing when no .desk is found from the payload cwd', async () => {
    const dir = await makeEmptyDir();
    const x = io(dir, preToolUse(dir));
    expect(await runCli(['hook', 'agent-start'], x)).toBe(0);
    expect(x.outLines).toEqual([]);
    expect(existsSync(join(dir, '.desk'))).toBe(false);
  });

  it('resolves the project from the payload cwd, not the process cwd', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const elsewhere = await makeEmptyDir();
    const x = io(elsewhere, preToolUse(join(root)));
    expect(await runCli(['hook', 'agent-start'], x)).toBe(0);
    expect(await tasks(root)).toHaveLength(1);
  });

  it('keeps the card in the first column with a note when the WIP limit is full', async () => {
    const root = await makeProject();
    const board = await loadBoard(root);
    for (const title of ['a', 'b']) {
      const t = await createTask(root, board, { title }, 'tester');
      await moveTask(root, board, t.id, 'in_progress', { assignee: 'tester' }, 'tester');
    }
    await start(root);
    const card = (await tasks(root)).find((t) => t.createdBy === 'claude-code');
    expect(card?.column).toBe('backlog');
    expect(card?.notes[0]?.text).toMatch(/^hook: не удалось взять в работу — В колонке in_progress уже 2 из 2/);
    expect((await runs(root)).toolu_1?.task).toBe(card?.id);
  });

  it('skips the move on a one-column board', async () => {
    const root = await makeProject('version: 1\ncolumns:\n  - id: todo\n    title: Todo\n');
    await start(root);
    const [task] = await tasks(root);
    expect(task?.column).toBe('todo');
    expect(task?.notes).toEqual([]);
  });

  it('uses the second column when there is no in_progress column', async () => {
    const root = await makeProject('version: 1\ncolumns:\n  - id: todo\n    title: Todo\n  - id: doing\n    title: Doing\n  - id: finished\n    title: Finished\n');
    await start(root);
    expect((await tasks(root))[0]?.column).toBe('doing');
  });

  it('derives the title from the prompt and truncates long prompts', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const prompt = `\n\nПроверь миграции\n${'x'.repeat(3000)}`;
    await start(root, preToolUse(root, {}, { description: '  ', prompt }));
    const [task] = await tasks(root);
    expect(task?.title).toBe('Проверь миграции');
    const body = task?.description.split('\n\n').slice(1).join('\n\n') ?? '';
    expect(body.length).toBeLessThanOrEqual(1500);
    expect(body.endsWith('…')).toBe(true);
  });

  it('keeps at most 500 run entries', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const old = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`old_${i}`, { task: 'T-999', at: '2026-01-01T00:00:00Z' }]));
    await writeFile(runsFile(root), JSON.stringify(old));
    await start(root);
    const map = await runs(root);
    expect(Object.keys(map)).toHaveLength(500);
    expect(map.old_0).toBeUndefined();
    expect(map.toolu_1?.task).toBe('T-001');
  });

  it('warns about a corrupt run map and rewrites it', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await writeFile(runsFile(root), '{oops');
    const x = await start(root);
    expect(x.errLines.join('\n')).toContain('.agent-runs.json: не JSON-объект');
    expect((await runs(root)).toolu_1?.task).toBe('T-001');
  });

  it('reports unexpected errors to stderr and still exits 0', async () => {
    const root = await makeProject('version: 1\ncolumns: nope\n');
    const x = await start(root);
    expect(x.outLines).toEqual([]);
    expect(x.errLines.join('\n')).toContain('desk hook agent-start');
  });
});

describe('desk hook agent-end', () => {
  async function end(root: string, stdin: string): Promise<TestIo> {
    const x = io(root, stdin);
    expect(await runCli(['hook', 'agent-end'], x)).toBe(0);
    return x;
  }

  it('adds a note and moves the card to done when the board allows it', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    const x = await end(root, postToolUse(root, 'Нашёл 12 эндпоинтов\nподробности'));
    const [task] = await tasks(root);
    expect(task?.column).toBe('done');
    expect(task?.notes.map((n) => n.text)).toEqual(['hook: сабагент завершил работу — Нашёл 12 эндпоинтов']);
    expect(task?.notes[0]?.by).toBe('claude-code');
    expect((await runs(root)).toolu_1).toBeUndefined();
    expect(x.outLines).toEqual([]);
  });

  it('leaves the card and asks to move it manually when done is not reachable', async () => {
    const root = await makeProject();
    await start(root);
    await end(root, postToolUse(root, 'ok'));
    const [task] = await tasks(root);
    expect(task?.column).toBe('in_progress');
    expect(task?.notes.map((n) => n.text)).toEqual([
      'hook: сабагент завершил работу — ok',
      expect.stringMatching(/^hook: перенеси вручную — Переход in_progress → done запрещён/),
    ]);
    expect((await runs(root)).toolu_1).toBeUndefined();
  });

  it('handles an object tool_response', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, postToolUse(root, { status: 'completed', agentId: 'a1', content: [{ type: 'text', text: 'Готово' }] }));
    expect((await tasks(root))[0]?.notes[0]?.text).toBe('hook: сабагент завершил работу — Готово');
  });

  it('keeps a background run open until SubagentStop arrives', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, postToolUse(root, { status: 'async_launched', agentId: 'abc123', description: 'd', prompt: 'p' }));
    let [task] = await tasks(root);
    expect(task?.column).toBe('in_progress');
    expect(task?.notes.map((n) => n.text)).toEqual(['hook: сабагент запущен в фоне (agent abc123)']);
    expect((await runs(root)).toolu_1?.agent_id).toBe('abc123');

    const stop = JSON.stringify({ cwd: root, hook_event_name: 'SubagentStop', agent_id: 'agent-abc123', agent_type: 'Explore', last_assistant_message: 'Фон готов' });
    await end(root, stop);
    [task] = await tasks(root);
    expect(task?.column).toBe('done');
    expect(task?.notes.at(-1)?.text).toBe('hook: сабагент завершил работу — Фон готов');
    expect((await runs(root)).toolu_1).toBeUndefined();
  });

  it('ignores SubagentStop for unknown agents', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, JSON.stringify({ cwd: root, hook_event_name: 'SubagentStop', agent_id: 'zzz', last_assistant_message: 'x' }));
    expect((await tasks(root))[0]?.column).toBe('in_progress');
  });

  it.each([
    ['unknown tool_use_id', (root: string) => postToolUse(root, 'x', { tool_use_id: 'other' })],
    ['a non-Agent tool', (root: string) => postToolUse(root, 'x', { tool_name: 'Read' })],
    ['invalid JSON', () => 'oops'],
  ])('ignores %s', async (_name, payload) => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    const x = await end(root, payload(root));
    expect(x.outLines).toEqual([]);
    const [task] = await tasks(root);
    expect(task?.notes).toEqual([]);
    expect(task?.column).toBe('in_progress');
  });

  it('does nothing without a mapping file or .desk', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await end(root, postToolUse(root, 'x'));
    expect(await taskFiles(root)).toEqual([]);
    const dir = await makeEmptyDir();
    const x = await end(dir, postToolUse(dir, 'x'));
    expect(x.outLines).toEqual([]);
  });
});

describe('desk hook (usage)', () => {
  it('rejects an unknown hook name without blocking', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = io(root, preToolUse(root));
    expect(await runCli(['hook', 'bogus'], x)).toBe(0);
    expect(x.errLines.join()).toContain('agent-start');
    expect(await taskFiles(root)).toEqual([]);
  });
});

describe('desk hooks install', () => {
  const settingsPath = (root: string): string => join(root, '.claude', 'settings.json');
  const commands = (settings: { hooks: Record<string, { hooks: { command: string }[] }[]> }, event: string): string[] =>
    (settings.hooks[event] ?? []).flatMap((entry) => entry.hooks.map((h) => h.command));

  it('creates .claude/settings.json with the hook entries', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = io(root);
    expect(await runCli(['hooks', 'install'], x)).toBe(0);
    const settings = JSON.parse(await readFile(settingsPath(root), 'utf8'));
    expect(settings.hooks.PreToolUse).toEqual([
      { matcher: 'Agent|Task', hooks: [{ type: 'command', command: 'desk hook agent-start', timeout: 10 }] },
    ]);
    expect(settings.hooks.PostToolUse).toEqual([
      { matcher: 'Agent|Task', hooks: [{ type: 'command', command: 'desk hook agent-end', timeout: 10 }] },
    ]);
    expect(settings.hooks.SubagentStop).toEqual([{ hooks: [{ type: 'command', command: 'desk hook agent-end', timeout: 10 }] }]);
    expect(x.outLines.join('\n')).toContain('PreToolUse');
  });

  it('is idempotent and preserves unrelated settings and hooks', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    const existing = {
      permissions: { allow: ['Bash(ls)'] },
      hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] }], Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }] },
    };
    await writeFile(settingsPath(root), JSON.stringify(existing));
    expect(await runCli(['hooks', 'install'], io(root))).toBe(0);
    const second = io(root);
    expect(await runCli(['hooks', 'install'], second)).toBe(0);
    const settings = JSON.parse(await readFile(settingsPath(root), 'utf8'));
    expect(settings.permissions).toEqual(existing.permissions);
    expect(settings.hooks.Stop).toEqual(existing.hooks.Stop);
    expect(commands(settings, 'PreToolUse')).toEqual(['echo hi', 'desk hook agent-start']);
    expect(commands(settings, 'PostToolUse')).toEqual(['desk hook agent-end']);
    expect(commands(settings, 'SubagentStop')).toEqual(['desk hook agent-end']);
    expect(second.outLines.join('\n')).toContain('уже');
  });

  it('fails on invalid JSON and leaves the file untouched', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    await writeFile(settingsPath(root), '{ broken');
    const x = io(root);
    expect(await runCli(['hooks', 'install'], x)).toBe(1);
    expect(x.errLines.join()).toContain('settings.json');
    expect(await readFile(settingsPath(root), 'utf8')).toBe('{ broken');
  });

  it('fails when hooks has the wrong shape', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    await writeFile(settingsPath(root), '{"hooks":{"PreToolUse":{}}}');
    expect(await runCli(['hooks', 'install'], io(root))).toBe(1);
    expect(await readFile(settingsPath(root), 'utf8')).toBe('{"hooks":{"PreToolUse":{}}}');
  });

  it('rejects unknown subcommands', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = io(root);
    expect(await runCli(['hooks', 'remove'], x)).toBe(1);
    expect(existsSync(settingsPath(root))).toBe(false);
  });

  it('desk init --hooks installs hooks after init', async () => {
    const root = await makeEmptyDir();
    const x = io(root);
    expect(await runCli(['init', '--hooks'], x)).toBe(0);
    const settings = JSON.parse(await readFile(settingsPath(root), 'utf8'));
    expect(commands(settings, 'PreToolUse')).toEqual(['desk hook agent-start']);
  });
});

describe('desk ui', () => {
  let blocker: Server | undefined;
  afterEach(async () => {
    await new Promise<void>((resolve) => (blocker ? blocker.close(() => resolve()) : resolve()));
    blocker = undefined;
  });

  it('prints a one-line error when the port is busy', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const server = createServer();
    blocker = server;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const x = io(root, '', { DESK_ROOT: root });
    expect(await runCli(['ui', '--port', String(port)], x)).toBe(1);
    expect(x.errLines).toEqual([`Порт ${port} занят. Запусти desk ui --port <другой порт>.`]);
  });
});
