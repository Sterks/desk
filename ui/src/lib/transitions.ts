import type { BoardInfo, TaskItem } from '../api/types';

// Подсказка для UI. Решает сервер (src/core/transitions.ts); логика должна совпадать.
export function allowedTargets(board: BoardInfo, from: string): string[] {
  const known = board.columns.some((c) => c.id === from);
  const others = board.columns.map((c) => c.id).filter((id) => id !== from);
  if (board.transitions === null || !known) return others;
  const targets = new Set(board.transitions.filter((t) => t.from === from).flatMap((t) => t.to));
  return others.filter((id) => targets.has(id));
}

export function requiredFor(board: BoardInfo, from: string, to: string): string[] {
  if (board.transitions === null) return [];
  return [...new Set(board.transitions.filter((t) => t.from === from && t.to.includes(to)).flatMap((t) => t.requires))];
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function missingForMove(board: BoardInfo, task: TaskItem, to: string): string[] {
  return requiredFor(board, task.column, to).filter((id) =>
    isEmptyValue(id === 'assignee' ? task.assignee : task.fields[id]),
  );
}

export function groupByColumn(board: BoardInfo, tasks: readonly TaskItem[]): Map<string, TaskItem[]> {
  return new Map(board.columns.map((c) => [c.id, tasks.filter((t) => t.column === c.id)]));
}

export function orphanTasks(board: BoardInfo, tasks: readonly TaskItem[]): TaskItem[] {
  const ids = new Set(board.columns.map((c) => c.id));
  return tasks.filter((t) => !ids.has(t.column));
}
