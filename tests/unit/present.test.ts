import { describe, expect, it } from 'vitest';
import { presentBoard, presentLoaded, presentTaskList } from '../../src/core/present.js';
import { testBoard, testTask } from '../helpers/board.js';

const board = testBoard();

describe('presentBoard', () => {
  it('колонки со счётчиками, поля и переходы в snake_case', () => {
    const json = presentBoard(board, [testTask(), testTask({ id: 'T-002' }), testTask({ id: 'T-003', column: 'done' })]);
    expect(json.guide).toBe('Общие правила.');
    expect(json.columns[0]).toEqual({ id: 'backlog', title: 'Backlog', guide: 'Новые задачи.', wip_limit: null, count: 2 });
    expect(json.columns[1]).toMatchObject({ id: 'in_progress', wip_limit: 2, count: 0 });
    expect(json.fields[0]).toEqual({
      id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'],
      default: 'p2', min: null, max: null, guide: 'p0 — прод лежит.',
    });
    expect(json.transitions?.[0]).toEqual({ from: 'backlog', to: ['in_progress'], requires: ['assignee'] });
  });
});

describe('presentTaskList', () => {
  it('сортирует, считает total до limit, выносит нечитаемые файлы и помечает invalid', () => {
    const loaded = [
      { id: 'T-001', task: testTask({ fields: { priority: 'p3' } }), errors: [] },
      { id: 'T-002', task: testTask({ id: 'T-002', fields: { priority: 'p0' } }), errors: ['Поле x не объявлено'] },
      { id: 'T-003', task: null, errors: ['нет frontmatter'] },
    ];
    const list = presentTaskList(board, loaded, { limit: 1 });
    expect(list.total).toBe(2);
    expect(list.tasks).toHaveLength(1);
    expect(list.tasks[0]).toMatchObject({ id: 'T-002', invalid: true, errors: ['Поле x не объявлено'], assignee: null });
    expect(list.invalid_files).toEqual([{ id: 'T-003', errors: ['нет frontmatter'] }]);
    expect(list.duplicate_ids).toEqual([]);
  });
});

describe('presentLoaded', () => {
  it('полная задача', () => {
    const json = presentLoaded({ id: 'T-001', task: testTask({ description: 'D' }), errors: [] });
    expect(json).toMatchObject({ id: 'T-001', description: 'D', created_by: 'planner', invalid: false, history: [{ to: 'backlog' }] });
  });
  it('нечитаемая задача', () => {
    expect(presentLoaded({ id: 'T-009', task: null, errors: ['e'] })).toEqual({ id: 'T-009', unreadable: true, invalid: true, errors: ['e'] });
  });
});

describe('agent', () => {
  it('list items and full tasks expose agent (null when absent)', () => {
    const withAgent = testTask({ id: 'T-001', assignee: 'reviewer', agent: 'ecc:code-reviewer' });
    const list = presentTaskList(board, [{ id: 'T-001', task: withAgent, errors: [] }, { id: 'T-002', task: testTask({ id: 'T-002' }), errors: [] }], {});
    expect(list.tasks.map((t) => t.agent)).toEqual(['ecc:code-reviewer', null]);
    expect(presentLoaded({ id: 'T-001', task: withAgent, errors: [] })).toMatchObject({ agent: 'ecc:code-reviewer', assignee: 'reviewer' });
  });
});
