import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadBoard } from '../../src/core/board-loader.js';
import { taskPath } from '../../src/core/paths.js';
import { addNote, createTask, getTask, loadAll, moveTask, updateTask } from '../../src/core/task-store.js';
import type { Board } from '../../src/core/types.js';
import { catchErrorAsync } from '../helpers/errors.js';
import { fixedClock, makeProject } from '../helpers/project.js';

let root: string;
let board: Board;
const clock = fixedClock('2026-09-24T10:00:00.123Z');
const later = fixedClock('2026-09-24T11:30:00Z');

beforeEach(async () => {
  root = await makeProject();
  board = await loadBoard(root);
});

describe('createTask', () => {
  it('создаёт T-001 в первой колонке с default и историей', async () => {
    const task = await createTask(root, board, { title: 'Первая' }, 'planner', clock);
    expect(task).toMatchObject({
      id: 'T-001', column: 'backlog', createdBy: 'planner', createdAt: '2026-09-24T10:00:00Z',
      fields: { priority: 'p2' },
      history: [{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'backlog' }],
    });
    expect(existsSync(taskPath(root, 'T-001'))).toBe(true);
  });

  it('следующий ID — T-002', async () => {
    await createTask(root, board, { title: 'A' }, 'planner', clock);
    expect((await createTask(root, board, { title: 'B' }, 'planner', clock)).id).toBe('T-002');
  });

  it('в не первую колонку — по правилам перехода из первой, одна запись history', async () => {
    const task = await createTask(root, board, { title: 'Сразу в работу', column: 'in_progress', fields: { assignee: 'dev' } }, 'planner', clock);
    expect(task.column).toBe('in_progress');
    expect(task.history).toEqual([{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'in_progress' }]);
  });

  it('запрещённая колонка — ошибка и файл не создан', async () => {
    const err = await catchErrorAsync(() => createTask(root, board, { title: 'X', column: 'done' }, 'planner', clock));
    expect(err.code).toBe('TRANSITION_FORBIDDEN');
    expect(await readdir(join(root, '.desk', 'tasks'))).toEqual([]);
  });

  it('WIP первой колонки проверяется при создании', async () => {
    const tight = await makeProject('version: 1\ncolumns:\n  - id: todo\n    wip_limit: 1\n');
    const tightBoard = await loadBoard(tight);
    await createTask(tight, tightBoard, { title: 'A' }, 'p', clock);
    expect((await catchErrorAsync(() => createTask(tight, tightBoard, { title: 'B' }, 'p', clock))).code).toBe('WIP_LIMIT');
  });

  it('ошибки ввода до записи', async () => {
    expect((await catchErrorAsync(() => createTask(root, board, { title: '' }, 'p', clock))).code).toBe('INVALID_VALUE');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X' }, '', clock))).code).toBe('BAD_REQUEST');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', description: 5 }, 'p', clock))).code).toBe('BAD_REQUEST');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', fields: { priority: 'p9' } }, 'p', clock))).code).toBe('INVALID_VALUE');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', fields: { priority: null } }, 'p', clock))).code).toBe('REQUIRED_MISSING');
    expect(await readdir(join(root, '.desk', 'tasks'))).toEqual([]);
  });

  it('task_ref на существующую задачу', async () => {
    await createTask(root, board, { title: 'A' }, 'p', clock);
    const b = await createTask(root, board, { title: 'B', fields: { blocked_by: 'T-001' } }, 'p', clock);
    expect(b.fields.blocked_by).toBe('T-001');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'C', fields: { blocked_by: 'T-099' } }, 'p', clock))).code).toBe('INVALID_VALUE');
  });
});

describe('updateTask, moveTask, addNote', () => {
  beforeEach(async () => {
    await createTask(root, board, { title: 'Задача', description: 'Старое' }, 'planner', clock);
  });

  it('updateTask меняет title, описание, поля и updated_at', async () => {
    const task = await updateTask(root, board, 'T-001', { title: 'Новое имя', description: 'Новое', fields: { estimate: 4 } }, 'dev', later);
    expect(task).toMatchObject({ title: 'Новое имя', description: 'Новое', updatedAt: '2026-09-24T11:30:00Z', fields: { priority: 'p2', estimate: 4 } });
    expect((await getTask(root, board, 'T-001')).task).toEqual(task);
  });

  it('NOT_FOUND для неизвестного ID', async () => {
    expect((await catchErrorAsync(() => updateTask(root, board, 'T-404', { title: 'X' }, 'dev', later))).code).toBe('NOT_FOUND');
    expect((await catchErrorAsync(() => getTask(root, board, 'T-404'))).code).toBe('NOT_FOUND');
  });

  it('moveTask пишет переход в history файла', async () => {
    await moveTask(root, board, 'T-001', 'in_progress', { assignee: 'dev' }, 'dev', later);
    const text = await readFile(taskPath(root, 'T-001'), 'utf8');
    expect(text).toContain('column: in_progress');
    expect(text).toContain('from: backlog');
  });

  it('moveTask в ту же колонку без полей не трогает файл', async () => {
    const before = await readFile(taskPath(root, 'T-001'), 'utf8');
    await moveTask(root, board, 'T-001', 'backlog', {}, 'dev', later);
    expect(await readFile(taskPath(root, 'T-001'), 'utf8')).toBe(before);
  });

  it('addNote схлопывает переносы и пишет автора', async () => {
    const task = await addNote(root, board, 'T-001', 'первая строка\nвторая строка', 'qa', later);
    expect(task.notes).toEqual([{ at: '2026-09-24T11:30:00Z', by: 'qa', text: 'первая строка вторая строка' }]);
    expect((await catchErrorAsync(() => addNote(root, board, 'T-001', '   ', 'qa', later))).code).toBe('BAD_REQUEST');
  });
});

describe('невалидные файлы', () => {
  it('loadAll помечает ошибки схемы, не падая', async () => {
    await createTask(root, board, { title: 'Ok' }, 'p', clock);
    await writeFile(taskPath(root, 'T-002'), '---\nid: T-002\ntitle: X\ncolumn: archived\ncreated_by: p\ncreated_at: x\nupdated_at: x\npriority: p2\nhistory: []\n---\n');
    await writeFile(taskPath(root, 'T-003'), 'мусор');
    await writeFile(join(root, '.desk', 'tasks', 'README.txt'), 'не задача');
    const loaded = await loadAll(root, board);
    expect(loaded.map((l) => l.id)).toEqual(['T-001', 'T-002', 'T-003']);
    expect(loaded[0]?.errors).toEqual([]);
    expect(loaded[1]?.errors.join()).toContain('archived');
    expect(loaded[2]?.task).toBeNull();
  });

  it('мутация нечитаемого файла — BAD_REQUEST', async () => {
    await writeFile(taskPath(root, 'T-001'), 'мусор');
    expect((await catchErrorAsync(() => updateTask(root, board, 'T-001', { title: 'X' }, 'p', later))).code).toBe('BAD_REQUEST');
  });

  it('поле удалили из board.yaml — update с null чистит задачу', async () => {
    await createTask(root, board, { title: 'A', fields: { summary: 'итог' } }, 'p', clock);
    const withoutSummary = { ...board, fields: board.fields.filter((f) => f.id !== 'summary') };
    const blocked = await catchErrorAsync(() => updateTask(root, withoutSummary, 'T-001', { title: 'B' }, 'p', later));
    expect(blocked.code).toBe('UNKNOWN_FIELD');
    const fixed = await updateTask(root, withoutSummary, 'T-001', { fields: { summary: null } }, 'p', later);
    expect(fixed.fields).toEqual({ priority: 'p2' });
  });
});

describe('agent (built-in, hook-only)', () => {
  it('createTask stores agent and it survives reloads and updates', async () => {
    const root = await makeProject();
    const board = await loadBoard(root);
    const task = await createTask(root, board, { title: 'A', agent: 'ecc:code-reviewer' }, 'claude-code', fixedClock());
    expect(task.agent).toBe('ecc:code-reviewer');
    await updateTask(root, board, task.id, { title: 'B' }, 'x', fixedClock());
    expect((await getTask(root, board, task.id)).task?.agent).toBe('ecc:code-reviewer');
  });

  it('rejects multi-line or too long agent values', async () => {
    const root = await makeProject();
    const board = await loadBoard(root);
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'A', agent: 'a\nb' }, 'p'))).code).toBe('INVALID_VALUE');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'A', agent: 'a'.repeat(101) }, 'p'))).code).toBe('INVALID_VALUE');
  });

  it('agent is not settable through fields', async () => {
    const root = await makeProject();
    const board = await loadBoard(root);
    const task = await createTask(root, board, { title: 'A' }, 'p');
    expect((await catchErrorAsync(() => updateTask(root, board, task.id, { fields: { agent: 'x' } }, 'p'))).code).toBe('UNKNOWN_FIELD');
  });
});
