import { findDuplicateIds } from './ids.js';
import { filterTasks, sortTasks, type TaskFilter } from './query.js';
import type { Board, FieldType, FieldValue, HistoryEntry, LoadedTask, Note, Task } from './types.js';

export interface BoardJson {
  name: string;
  guide: string | null;
  columns: { id: string; title: string; guide: string | null; wip_limit: number | null; count: number }[];
  fields: {
    id: string;
    type: FieldType;
    required: boolean;
    values: string[] | null;
    default: FieldValue | null;
    min: number | null;
    max: number | null;
    guide: string | null;
  }[];
  transitions: { from: string; to: string[]; requires: string[] }[] | null;
}

export interface TaskListItemJson {
  id: string;
  title: string;
  column: string;
  assignee: string | null;
  fields: Record<string, FieldValue>;
  created_at: string;
  invalid: boolean;
  errors: string[];
}

export interface TaskJson extends TaskListItemJson {
  created_by: string;
  updated_at: string;
  description: string;
  notes: Note[];
  history: HistoryEntry[];
}

export interface UnreadableTaskJson {
  id: string;
  unreadable: true;
  invalid: true;
  errors: string[];
}

export interface TaskListJson {
  tasks: TaskListItemJson[];
  invalid_files: { id: string; errors: string[] }[];
  duplicate_ids: string[][];
  total: number;
}

export function presentBoard(board: Board, tasks: readonly Task[]): BoardJson {
  return {
    name: board.name,
    guide: board.guide ?? null,
    columns: board.columns.map((c) => ({
      id: c.id,
      title: c.title,
      guide: c.guide ?? null,
      wip_limit: c.wipLimit ?? null,
      count: tasks.filter((t) => t.column === c.id).length,
    })),
    fields: board.fields.map((f) => ({
      id: f.id,
      type: f.type,
      required: f.required,
      values: f.values ?? null,
      default: f.default ?? null,
      min: f.min ?? null,
      max: f.max ?? null,
      guide: f.guide ?? null,
    })),
    transitions: board.transitions?.map((t) => ({ from: t.from, to: t.to, requires: t.requires })) ?? null,
  };
}

export function presentListItem(task: Task, errors: readonly string[]): TaskListItemJson {
  return {
    id: task.id,
    title: task.title,
    column: task.column,
    assignee: task.assignee ?? null,
    fields: task.fields,
    created_at: task.createdAt,
    invalid: errors.length > 0,
    errors: [...errors],
  };
}

export function presentTask(task: Task, errors: readonly string[]): TaskJson {
  return {
    ...presentListItem(task, errors),
    created_by: task.createdBy,
    updated_at: task.updatedAt,
    description: task.description,
    notes: task.notes,
    history: task.history,
  };
}

export function presentLoaded(loaded: LoadedTask): TaskJson | UnreadableTaskJson {
  if (loaded.task === null) return { id: loaded.id, unreadable: true, invalid: true, errors: loaded.errors };
  return presentTask(loaded.task, loaded.errors);
}

export function presentTaskList(board: Board, loaded: readonly LoadedTask[], filter: TaskFilter): TaskListJson {
  const errorsById = new Map(loaded.map((l) => [l.id, l.errors]));
  const readable = loaded.flatMap((l) => (l.task ? [l.task] : []));
  const matched = filterTasks(sortTasks(board, readable), filter);
  const limited = filter.limit === undefined ? matched : matched.slice(0, filter.limit);
  return {
    tasks: limited.map((t) => presentListItem(t, errorsById.get(t.id) ?? [])),
    invalid_files: loaded.filter((l) => l.task === null).map((l) => ({ id: l.id, errors: l.errors })),
    duplicate_ids: findDuplicateIds(loaded.map((l) => l.id)),
    total: matched.length,
  };
}
