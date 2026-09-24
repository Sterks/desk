import type { BoardInfo, FieldInfo, FieldValue, TaskFull } from '../api/types';

export type Draft = Record<string, FieldValue | null>;

export interface TaskDraft {
  title: string;
  description: string;
  assignee: string;
  fields: Draft;
}

export const ASSIGNEE_FIELD: FieldInfo = {
  id: 'assignee',
  type: 'string',
  required: false,
  values: null,
  default: null,
  min: null,
  max: null,
  guide: 'Имя агента или человека, который выполняет задачу.',
};

export function fieldInfo(board: BoardInfo, id: string): FieldInfo | undefined {
  return id === 'assignee' ? ASSIGNEE_FIELD : board.fields.find((f) => f.id === id);
}

export function defaultsFor(board: BoardInfo): Draft {
  return Object.fromEntries(board.fields.filter((f) => f.default !== null).map((f) => [f.id, f.default]));
}

export function compactFields(draft: Draft): Record<string, FieldValue> {
  return Object.fromEntries(Object.entries(draft).filter((entry): entry is [string, FieldValue] => entry[1] !== null));
}

export function diffFields(original: Record<string, FieldValue>, draft: Draft): Draft {
  return Object.fromEntries(
    Object.entries(draft)
      .filter(([key, value]) => JSON.stringify(original[key] ?? null) !== JSON.stringify(value ?? null))
      .map(([key, value]) => [key, value ?? null]),
  );
}

export function toDraft(task: TaskFull): TaskDraft {
  return { title: task.title, description: task.description, assignee: task.assignee ?? '', fields: { ...task.fields } };
}

export function buildUpdate(task: TaskFull, draft: TaskDraft): { title?: string; description?: string; fields: Draft } {
  const fields = diffFields(task.fields, draft.fields);
  const assignee = draft.assignee.trim() === '' ? null : draft.assignee.trim();
  return {
    ...(draft.title !== task.title ? { title: draft.title } : {}),
    ...(draft.description !== task.description ? { description: draft.description } : {}),
    fields: assignee === task.assignee ? fields : { ...fields, assignee },
  };
}

export function isDirty(task: TaskFull, draft: TaskDraft): boolean {
  const update = buildUpdate(task, draft);
  return update.title !== undefined || update.description !== undefined || Object.keys(update.fields).length > 0;
}

/** Значение `<input type="number">`: пустая строка — поле очищено (`null`). */
export function parseNumberInput(text: string): number | null {
  return text === '' ? null : Number(text);
}

export interface PanelState {
  task: TaskFull;
  draft: TaskDraft;
}

/**
 * Переносит несохранённые правки человека на свежую версию задачи: из черновика берётся только то,
 * чем он отличался от своей базы (`base`), всё остальное — из `next`. Иначе сохранение молча
 * откатило бы параллельную запись агента в поля, которых человек не касался.
 */
export function rebaseDraft(base: TaskFull, draft: TaskDraft, next: TaskFull): TaskDraft {
  const fresh = toDraft(next);
  const { title, description, fields } = buildUpdate(base, draft);
  const { assignee, ...changedFields } = fields;
  return {
    title: title ?? fresh.title,
    description: description ?? fresh.description,
    assignee: assignee === undefined ? fresh.assignee : draft.assignee,
    fields: { ...fresh.fields, ...changedFields },
  };
}

/** Новая версия задачи с сервера: чистый черновик заменяется, грязный — переносится через rebaseDraft. */
export function mergeFresh(prev: PanelState | null, next: TaskFull): PanelState {
  if (!prev || prev.task.id !== next.id || !isDirty(prev.task, prev.draft)) return { task: next, draft: toDraft(next) };
  return { task: next, draft: rebaseDraft(prev.task, prev.draft, next) };
}
