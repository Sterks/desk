import { describe, expect, it } from 'vitest';
import { boardInfo, taskItem } from './test-fixtures';
import { allowedTargets, groupByColumn, isEmptyValue, missingForMove, orphanTasks, requiredFor } from './transitions';

const board = boardInfo();

describe('правила переходов в UI', () => {
  it('allowedTargets повторяет логику сервера', () => {
    expect(allowedTargets(board, 'backlog')).toEqual(['in_progress']);
    expect(allowedTargets(board, 'done')).toEqual([]);
    expect(allowedTargets(boardInfo({ transitions: null }), 'done')).toEqual(['backlog', 'in_progress', 'review']);
    expect(allowedTargets(board, 'archived')).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });

  it('requiredFor и missingForMove', () => {
    expect(requiredFor(board, 'in_progress', 'review')).toEqual(['pr_url']);
    expect(missingForMove(board, taskItem(), 'in_progress')).toEqual(['assignee']);
    expect(missingForMove(board, taskItem({ assignee: 'dev' }), 'in_progress')).toEqual([]);
    expect(missingForMove(board, taskItem({ column: 'in_progress', fields: { pr_url: 'https://x.y' } }), 'review')).toEqual([]);
  });

  it('isEmptyValue', () => {
    expect([undefined, null, '', []].every(isEmptyValue)).toBe(true);
    expect([0, false, 'x'].some(isEmptyValue)).toBe(false);
  });

  it('groupByColumn сохраняет порядок; orphanTasks — задачи вне колонок', () => {
    const tasks = [taskItem({ id: 'T-2' }), taskItem({ id: 'T-1' }), taskItem({ id: 'T-3', column: 'archived' })];
    expect(groupByColumn(board, tasks).get('backlog')?.map((t) => t.id)).toEqual(['T-2', 'T-1']);
    expect(groupByColumn(board, tasks).get('done')).toEqual([]);
    expect(orphanTasks(board, tasks).map((t) => t.id)).toEqual(['T-3']);
  });
});
