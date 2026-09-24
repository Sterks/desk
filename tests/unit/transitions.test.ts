import { describe, expect, it } from 'vitest';
import { allowedTargets, checkWip, planMove, requiredForTransition } from '../../src/core/transitions.js';
import { testBoard, testTask } from '../helpers/board.js';
import { catchError } from '../helpers/errors.js';

const board = testBoard();
const ctx = { taskExists: () => true };
const NOW = '2026-09-24T12:00:00Z';
const move = (to: string, changes: Record<string, unknown> = {}) => ({ to, changes, actor: 'backend-agent', now: NOW });

describe('allowedTargets', () => {
  it('по секции transitions', () => {
    expect(allowedTargets(board, 'backlog')).toEqual(['in_progress']);
    expect(allowedTargets(board, 'review')).toEqual(['in_progress', 'done']);
    expect(allowedTargets(board, 'done')).toEqual([]);
  });
  it('без секции transitions — все остальные колонки', () => {
    expect(allowedTargets(testBoard({ transitions: null }), 'backlog')).toEqual(['in_progress', 'review', 'done']);
  });
  it('из удалённой колонки — все колонки', () => {
    expect(allowedTargets(board, 'archived')).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });
});

describe('requiredForTransition', () => {
  it('собирает requires', () => {
    expect(requiredForTransition(board, 'backlog', 'in_progress')).toEqual(['assignee']);
    expect(requiredForTransition(board, 'review', 'done')).toEqual([]);
    expect(requiredForTransition(testBoard({ transitions: null }), 'backlog', 'done')).toEqual([]);
  });
});

describe('planMove', () => {
  it('NOT_FOUND для несуществующей колонки', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('nowhere'), ctx));
    expect(err.code).toBe('NOT_FOUND');
    expect(err.details.allowed).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });

  it('TRANSITION_FORBIDDEN со списком разрешённых и guide текущей колонки', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('done'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_FORBIDDEN', allowed: ['in_progress'], guide: 'Новые задачи.' });
  });

  it('запрет перехода проверяется раньше значений полей', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('done', { estimate: -1 }), ctx));
    expect(err.code).toBe('TRANSITION_FORBIDDEN');
  });

  it('TRANSITION_REQUIRES, если нет assignee', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('in_progress'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_REQUIRES', field: 'assignee' });
    expect(err.details.guide).toContain('агента');
  });

  it('TRANSITION_REQUIRES несёт guide пользовательского поля', () => {
    const task = testTask({ column: 'in_progress', assignee: 'a' });
    const err = catchError(() => planMove(board, [], task, move('review'), ctx));
    expect(err.toJSON()).toMatchObject({ field: 'pr_url', guide: 'Ссылка на PR.' });
  });

  it('fields в том же вызове закрывают requires; история пополняется; исходник не меняется', () => {
    const task = testTask();
    const next = planMove(board, [task], task, move('in_progress', { assignee: 'backend-agent' }), ctx);
    expect(next.column).toBe('in_progress');
    expect(next.assignee).toBe('backend-agent');
    expect(next.updatedAt).toBe(NOW);
    expect(next.history.at(-1)).toEqual({ at: NOW, by: 'backend-agent', from: 'backlog', to: 'in_progress' });
    expect(task.column).toBe('backlog');
    expect(task.history).toHaveLength(1);
  });

  it('ошибка значения в fields после проверки перехода', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('in_progress', { assignee: 'a', estimate: -1 }), ctx));
    expect(err.code).toBe('INVALID_VALUE');
  });

  it('WIP_LIMIT, если колонка заполнена', () => {
    const busy = [
      testTask({ id: 'T-002', column: 'in_progress' }),
      testTask({ id: 'T-003', column: 'in_progress' }),
    ];
    const task = testTask({ assignee: 'a' });
    const err = catchError(() => planMove(board, [...busy, task], task, move('in_progress'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'WIP_LIMIT', guide: 'В работе.' });
    expect(err.message).toContain('2 из 2');
  });

  it('та же колонка без changes — тот же объект', () => {
    const task = testTask();
    expect(planMove(board, [task], task, move('backlog'), ctx)).toBe(task);
  });

  it('та же колонка с changes — обновление без записи в history', () => {
    const task = testTask();
    const next = planMove(board, [task], task, move('backlog', { estimate: 3 }), ctx);
    expect(next.fields.estimate).toBe(3);
    expect(next.history).toHaveLength(1);
    expect(next.updatedAt).toBe(NOW);
  });

  it('задачу из удалённой колонки можно перенести в любую', () => {
    const task = testTask({ column: 'archived' });
    expect(planMove(board, [task], task, move('done'), ctx).column).toBe('done');
  });
});

describe('checkWip', () => {
  it('не считает саму задачу', () => {
    const tasks = [testTask({ id: 'T-002', column: 'in_progress' }), testTask({ id: 'T-003', column: 'in_progress' })];
    expect(() => checkWip(board, tasks, 'T-002', 'in_progress')).not.toThrow();
  });
  it('колонка без лимита не ограничена', () => {
    expect(() => checkWip(board, [testTask({ column: 'done' })], 'T-009', 'done')).not.toThrow();
  });
});
