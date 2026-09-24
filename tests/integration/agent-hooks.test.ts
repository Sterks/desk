import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cardText } from '../../src/cli/agent-hooks.js';
import { runCli } from '../../src/cli/run.js';
import { BOARD_TEMPLATE } from '../../src/cli/templates.js';
import { loadBoard } from '../../src/core/board-loader.js';
import { createTask, moveTask } from '../../src/core/task-store.js';
import {
  hook,
  hookIo,
  postToolUse,
  preToolUse,
  runs,
  runsFile,
  subagentStart,
  subagentStop,
  taskFiles,
  tasks,
} from '../helpers/hooks.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

const start = (root: string, stdin = preToolUse(root), now?: string) => hook('agent-start', root, stdin, now);
const attach = (root: string, stdin: string) => hook('agent-attach', root, stdin);
const end = (root: string, stdin: string) => hook('agent-end', root, stdin);

describe('desk hook agent-start', () => {
  it('creates a card in in_progress, records the run and prints nothing', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = await start(root, preToolUse(root), '2026-09-24T10:00:00Z');
    const [task] = await tasks(root);
    expect(task).toMatchObject({ id: 'T-001', title: 'Найти эндпоинты', column: 'in_progress', assignee: 'Explore', agent: 'Explore', createdBy: 'claude-code' });
    expect(task?.description).toBe('**Сабагент:** Explore\n\nНайди все API эндпоинты в src/');
    expect((await runs(root)).toolu_1).toEqual({
      task: 'T-001',
      created_at: '2026-09-24T10:00:00Z',
      session_id: 's1',
      subagent_type: 'Explore',
      assignee: 'Explore',
    });
    expect(x.outLines).toEqual([]);
    expect(x.errLines).toEqual([]);
  });

  it('uses tool_input.name as assignee and keeps the full type in agent', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, {}, { subagent_type: 'ecc:code-reviewer', name: 'reviewer-1' }));
    expect((await tasks(root))[0]).toMatchObject({ assignee: 'reviewer-1', agent: 'ecc:code-reviewer' });
  });

  it('without name the assignee is the sanitized type and agent the full type', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, {}, { subagent_type: 'ecc:code-reviewer' }));
    expect((await tasks(root))[0]).toMatchObject({ assignee: 'ecc code-reviewer', agent: 'ecc:code-reviewer' });
  });

  it('accepts the legacy Task tool name and defaults the type to general-purpose', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, { tool_name: 'Task' }, { subagent_type: undefined }));
    expect((await tasks(root))[0]).toMatchObject({ assignee: 'general-purpose', agent: 'general-purpose' });
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
    const x = await start(dir, preToolUse(dir));
    expect(x.outLines).toEqual([]);
    expect(existsSync(join(dir, '.desk'))).toBe(false);
  });

  it('resolves the project from the payload cwd, not the process cwd', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = hookIo(await makeEmptyDir(), preToolUse(root));
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

  it('skips the move on a one-column board and uses the second column without in_progress', async () => {
    const one = await makeProject('version: 1\ncolumns:\n  - id: todo\n    title: Todo\n');
    await start(one);
    expect((await tasks(one))[0]).toMatchObject({ column: 'todo', notes: [] });
    const three = await makeProject('version: 1\ncolumns:\n  - id: todo\n  - id: doing\n  - id: finished\n');
    await start(three);
    expect((await tasks(three))[0]?.column).toBe('doing');
  });

  it('derives the title from the prompt and truncates long prompts', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, {}, { description: '  ', prompt: `\n\nПроверь миграции\n${'x'.repeat(3000)}` }));
    const [task] = await tasks(root);
    expect(task?.title).toBe('Проверь миграции');
    const body = task?.description.split('\n\n').slice(1).join('\n\n') ?? '';
    expect(body.length).toBeLessThanOrEqual(1500);
    expect(body.endsWith('…')).toBe(true);
  });

  it('keeps at most 500 run entries', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const entry = { task: 'T-999', created_at: '2026-09-24T09:00:00Z', subagent_type: 'x', assignee: 'x', agent_id: 'a' };
    await writeFile(runsFile(root), JSON.stringify(Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`old_${i}`, entry]))));
    await start(root, preToolUse(root), '2026-09-24T10:00:00Z');
    const map = await runs(root);
    expect(Object.keys(map)).toHaveLength(500);
    expect(map.old_0).toBeUndefined();
    expect(map.toolu_1?.task).toBe('T-001');
  });

  it('sweeps unconfirmed runs older than 6 hours', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, { tool_use_id: 'attached' }), '2026-09-24T00:00:00Z');
    await attach(root, subagentStart(root, 'agent-x'));
    await start(root, preToolUse(root, { tool_use_id: 'old' }), '2026-09-24T00:00:00Z');
    await start(root, preToolUse(root, { tool_use_id: 'recent' }), '2026-09-24T02:00:00Z');
    await start(root, preToolUse(root, { tool_use_id: 'new' }), '2026-09-24T07:00:00Z');
    expect(Object.keys(await runs(root))).toEqual(['attached', 'recent', 'new']);
    const byId = new Map((await tasks(root)).map((t) => [t.id, t]));
    expect(byId.get('T-001')?.notes.map((n) => n.text)).toEqual(['hook: сабагент запущен (agent-x)']);
    expect(byId.get('T-002')?.notes.map((n) => n.text)).toEqual(['hook: запуск не подтверждён']);
    expect(byId.get('T-002')?.column).toBe('backlog');
    expect(byId.get('T-003')?.notes).toEqual([]);
    expect(byId.get('T-003')?.column).toBe('in_progress');
  });

  it('a stale card that cannot go back gets a "move manually" note', async () => {
    const root = await makeProject('version: 1\ncolumns:\n  - id: todo\n  - id: doing\n  - id: done\ntransitions:\n  - from: todo\n    to: doing\n  - from: doing\n    to: done\n');
    await start(root, preToolUse(root, { tool_use_id: 'old' }), '2026-09-24T00:00:00Z');
    await start(root, preToolUse(root, { tool_use_id: 'new' }), '2026-09-24T07:00:00Z');
    const [stale] = await tasks(root);
    expect(stale?.column).toBe('doing');
    expect(stale?.notes.map((n) => n.text)).toEqual([
      'hook: запуск не подтверждён',
      expect.stringMatching(/^hook: перенеси вручную — Переход doing → todo запрещён/),
    ]);
    expect(Object.keys(await runs(root))).toEqual(['new']);
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

describe('desk hook agent-attach (SubagentStart)', () => {
  it('attaches the agent, notes the start and prints the card line as additionalContext', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    const x = await attach(root, subagentStart(root, 'agent-abc'));
    expect(x.outLines.map((line) => JSON.parse(line))).toEqual([
      { hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: cardText('T-001', 'Explore') } },
    ]);
    expect((await runs(root)).toolu_1?.agent_id).toBe('agent-abc');
    expect((await tasks(root))[0]?.notes.map((n) => n.text)).toEqual(['hook: сабагент запущен (agent-abc)']);
  });

  it('uses the assignee from tool_input.name in the card line', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, {}, { subagent_type: 'ecc:code-reviewer', name: 'rev' }));
    const x = await attach(root, subagentStart(root, 'a1', 'ecc:code-reviewer'));
    expect(JSON.parse(x.outLines[0] ?? '').hookSpecificOutput.additionalContext).toBe(cardText('T-001', 'rev'));
  });

  it('picks the oldest pending run of the same session and type', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, { tool_use_id: 'u1' }));
    await start(root, preToolUse(root, { tool_use_id: 'u2' }));
    await start(root, preToolUse(root, { tool_use_id: 'u3' }, { subagent_type: 'Plan' }));
    await attach(root, subagentStart(root, 'first'));
    await attach(root, subagentStart(root, 'second'));
    await attach(root, subagentStart(root, 'plan', 'Plan'));
    const map = await runs(root);
    expect([map.u1?.agent_id, map.u2?.agent_id, map.u3?.agent_id]).toEqual(['first', 'second', 'plan']);
  });

  it('normalizes a missing type to general-purpose', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root, preToolUse(root, {}, { subagent_type: undefined }));
    await attach(root, subagentStart(root, 'gp', ''));
    expect((await runs(root)).toolu_1?.agent_id).toBe('gp');
  });

  it.each([
    ['another session', (root: string) => subagentStart(root, 'z', 'Explore', { session_id: 's2' })],
    ['another type', (root: string) => subagentStart(root, 'z', 'Plan')],
    ['no agent_id', (root: string) => JSON.stringify({ session_id: 's1', cwd: root, hook_event_name: 'SubagentStart', agent_type: 'Explore' })],
    ['invalid JSON', () => 'nope'],
  ])('prints nothing for %s', async (_name, payload) => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    const x = await attach(root, payload(root));
    expect(x.outLines).toEqual([]);
    expect((await runs(root)).toolu_1?.agent_id).toBeUndefined();
  });

  it('does not re-attach an already attached run', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await attach(root, subagentStart(root, 'one'));
    const x = await attach(root, subagentStart(root, 'two'));
    expect(x.outLines).toEqual([]);
    expect((await runs(root)).toolu_1?.agent_id).toBe('one');
  });

  it('does nothing without .desk', async () => {
    const dir = await makeEmptyDir();
    expect((await attach(dir, subagentStart(dir, 'a'))).outLines).toEqual([]);
  });
});

describe('desk hook agent-end', () => {
  it('adds a note and moves the card to done when the board allows it', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    const x = await end(root, postToolUse(root, 'Нашёл 12 эндпоинтов\nподробности'));
    const [task] = await tasks(root);
    expect(task?.column).toBe('done');
    expect(task?.notes.map((n) => [n.by, n.text])).toEqual([['claude-code', 'hook: сабагент завершил работу — Нашёл 12 эндпоинтов']]);
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

  it('SubagentStart → SubagentStop without PostToolUse closes the card', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await attach(root, subagentStart(root, 'agent-abc'));
    await end(root, subagentStop(root, 'agent-abc', 'Фон готов'));
    const [task] = await tasks(root);
    expect(task?.column).toBe('done');
    expect(task?.notes.at(-1)?.text).toBe('hook: сабагент завершил работу — Фон готов');
    expect((await runs(root)).toolu_1).toBeUndefined();
  });

  it('PostToolUse(async_launched) after SubagentStart changes nothing; SubagentStop still closes', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await attach(root, subagentStart(root, 'agent-abc'));
    await end(root, postToolUse(root, { status: 'async_launched', agentId: 'abc', description: 'd', prompt: 'p' }));
    const [launched] = await tasks(root);
    expect(launched?.column).toBe('in_progress');
    expect(launched?.notes.map((n) => n.text)).toEqual(['hook: сабагент запущен (agent-abc)']);
    expect((await runs(root)).toolu_1?.agent_id).toBe('agent-abc');
    await end(root, subagentStop(root, 'agent-abc'));
    expect((await tasks(root))[0]?.column).toBe('done');
  });

  it('async_launched without SubagentStart records agentId as a fallback', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, postToolUse(root, { status: 'async_launched', agentId: 'abc123' }));
    expect((await runs(root)).toolu_1?.agent_id).toBe('abc123');
    await end(root, subagentStop(root, 'agent-abc123'));
    expect((await tasks(root))[0]?.column).toBe('done');
  });

  it('a late PostToolUse after SubagentStop closed the run does nothing', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await attach(root, subagentStart(root, 'a'));
    await end(root, subagentStop(root, 'a'));
    await end(root, postToolUse(root, 'late'));
    expect((await tasks(root))[0]?.notes).toHaveLength(2);
  });

  it('SubagentStop for a foreground run without agent_id does nothing', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, subagentStop(root, 'agent-unknown'));
    const [task] = await tasks(root);
    expect(task).toMatchObject({ column: 'in_progress', notes: [] });
    expect((await runs(root)).toolu_1).toBeDefined();
  });

  it.each([
    ['PostToolUseFailure', { error: 'Agent crashed\nstack' }, 'hook: вызов не выполнен — Agent crashed'],
    ['PermissionDenied', { reason: '[Data Exfiltration]' }, 'hook: вызов не выполнен — [Data Exfiltration]'],
    ['PermissionDenied', {}, 'hook: вызов не выполнен — причина не указана'],
  ])('%s moves the card back to the first column', async (event, extra, note) => {
    const root = await makeProject(BOARD_TEMPLATE);
    await start(root);
    await end(root, postToolUse(root, undefined, { hook_event_name: event, ...extra }));
    const [task] = await tasks(root);
    expect(task?.column).toBe('backlog');
    expect(task?.notes.map((n) => n.text)).toEqual([note]);
    expect((await runs(root)).toolu_1).toBeUndefined();
  });

  it('a failure on a board without the way back leaves a "move manually" note', async () => {
    const root = await makeProject('version: 1\ncolumns:\n  - id: todo\n  - id: doing\n  - id: done\ntransitions:\n  - from: todo\n    to: doing\n  - from: doing\n    to: done\n');
    await start(root);
    await end(root, postToolUse(root, undefined, { hook_event_name: 'PostToolUseFailure', error: 'boom' }));
    const [task] = await tasks(root);
    expect(task?.column).toBe('doing');
    expect(task?.notes.map((n) => n.text)).toEqual(['hook: вызов не выполнен — boom', expect.stringMatching(/^hook: перенеси вручную — Переход doing → todo запрещён/)]);
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
    expect((await tasks(root))[0]).toMatchObject({ column: 'in_progress', notes: [] });
  });

  it('does nothing without a mapping file or .desk', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await end(root, postToolUse(root, 'x'));
    expect(await taskFiles(root)).toEqual([]);
    const dir = await makeEmptyDir();
    expect((await end(dir, postToolUse(dir, 'x'))).outLines).toEqual([]);
  });

  it('rejects an unknown hook name without blocking', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = await hook('bogus', root, preToolUse(root));
    expect(x.errLines.join()).toContain('agent-attach');
    expect(await taskFiles(root)).toEqual([]);
  });
});
