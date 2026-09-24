import { describe, expect, it } from 'vitest';
import { filterTasks, sortTasks } from '../../src/core/query.js';
import { testBoard, testTask } from '../helpers/board.js';

const board = testBoard();
const tasks = [
  testTask({ id: 'T-001', title: 'Низкий', fields: { priority: 'p3' }, createdAt: '2026-09-24T09:00:00Z' }),
  testTask({ id: 'T-002', title: 'Пожар', fields: { priority: 'p0', area: ['backend', 'frontend'] }, createdAt: '2026-09-24T11:00:00Z', assignee: 'a' }),
  testTask({ id: 'T-003', title: 'Обычный', fields: { priority: 'p2' }, column: 'done', description: 'Про Логин' }),
  testTask({ id: 'T-004', title: 'Тоже пожар', fields: { priority: 'p0' }, createdAt: '2026-09-24T08:00:00Z' }),
  testTask({ id: 'T-005', title: 'Без приоритета', fields: {} }),
];

describe('sortTasks', () => {
  it('по priority, затем по created_at, без приоритета в конце', () => {
    expect(sortTasks(board, tasks).map((t) => t.id)).toEqual(['T-004', 'T-002', 'T-003', 'T-001', 'T-005']);
  });
  it('без поля priority — по created_at', () => {
    const plain = testBoard({ fields: [] });
    expect(sortTasks(plain, tasks).map((t) => t.id)[0]).toBe('T-004');
  });
});

describe('filterTasks', () => {
  it('column', () => expect(filterTasks(tasks, { column: 'done' }).map((t) => t.id)).toEqual(['T-003']));
  it('assignee', () => expect(filterTasks(tasks, { assignee: 'a' }).map((t) => t.id)).toEqual(['T-002']));
  it('query без учёта регистра по title и описанию', () => {
    expect(filterTasks(tasks, { query: 'пожар' }).map((t) => t.id)).toEqual(['T-002', 'T-004']);
    expect(filterTasks(tasks, { query: 'логин' }).map((t) => t.id)).toEqual(['T-003']);
  });
  it('where: точное совпадение и вхождение для массива', () => {
    expect(filterTasks(tasks, { where: { priority: 'p0' } }).map((t) => t.id)).toEqual(['T-002', 'T-004']);
    expect(filterTasks(tasks, { where: { area: 'frontend' } }).map((t) => t.id)).toEqual(['T-002']);
    expect(filterTasks(tasks, { where: { assignee: 'a' } }).map((t) => t.id)).toEqual(['T-002']);
  });
});
