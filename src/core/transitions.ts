import { DeskError } from './errors.js';
import type { Board, Task } from './types.js';
import { ASSIGNEE_GUIDE, applyChanges, fieldDef, isEmptyValue, type ValidationContext } from './validate.js';

export interface MoveInput {
  to: string;
  changes: Record<string, unknown>;
  actor: string;
  now: string;
}

export function allowedTargets(board: Board, from: string): string[] {
  const known = board.columns.some((c) => c.id === from);
  const others = board.columns.map((c) => c.id).filter((id) => id !== from);
  if (board.transitions === null || !known) return others;
  const targets = new Set(board.transitions.filter((t) => t.from === from).flatMap((t) => t.to));
  return others.filter((id) => targets.has(id));
}

export function requiredForTransition(board: Board, from: string, to: string): string[] {
  if (board.transitions === null) return [];
  const required = board.transitions.filter((t) => t.from === from && t.to.includes(to)).flatMap((t) => t.requires);
  return [...new Set(required)];
}

export function checkWip(board: Board, tasks: readonly Task[], taskId: string, columnId: string): void {
  const column = board.columns.find((c) => c.id === columnId);
  if (column?.wipLimit === undefined) return;
  const count = tasks.filter((t) => t.column === columnId && t.id !== taskId).length;
  if (count >= column.wipLimit) {
    throw new DeskError('WIP_LIMIT', `В колонке ${columnId} уже ${count} из ${column.wipLimit} задач`, {
      field: 'column',
      guide: column.guide,
    });
  }
}

export function planMove(
  board: Board,
  tasks: readonly Task[],
  task: Task,
  input: MoveInput,
  ctx: ValidationContext,
): Task {
  const columnIds = board.columns.map((c) => c.id);
  if (!columnIds.includes(input.to)) {
    throw new DeskError('NOT_FOUND', `Колонка ${input.to} не существует`, { field: 'column', allowed: columnIds });
  }

  if (task.column === input.to) {
    if (Object.keys(input.changes).length === 0) return task;
    return { ...applyChanges(board, task, input.changes, ctx), updatedAt: input.now };
  }

  const allowed = allowedTargets(board, task.column);
  if (!allowed.includes(input.to)) {
    throw new DeskError(
      'TRANSITION_FORBIDDEN',
      `Переход ${task.column} → ${input.to} запрещён. Разрешены: ${allowed.join(', ') || 'нет переходов'}`,
      { field: 'column', guide: board.columns.find((c) => c.id === task.column)?.guide, allowed },
    );
  }

  const changed = applyChanges(board, task, input.changes, ctx);
  for (const required of requiredForTransition(board, task.column, input.to)) {
    const value = required === 'assignee' ? changed.assignee : changed.fields[required];
    if (isEmptyValue(value)) {
      throw new DeskError('TRANSITION_REQUIRES', `Переход ${task.column} → ${input.to} требует поле ${required}`, {
        field: required,
        guide: required === 'assignee' ? ASSIGNEE_GUIDE : fieldDef(board, required)?.guide,
      });
    }
  }

  checkWip(board, tasks, task.id, input.to);

  return {
    ...changed,
    column: input.to,
    updatedAt: input.now,
    history: [...changed.history, { at: input.now, by: input.actor, from: task.column, to: input.to }],
  };
}
