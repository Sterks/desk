export const FIELD_TYPES = [
  'string',
  'text',
  'number',
  'bool',
  'date',
  'url',
  'enum',
  'multi_enum',
  'task_ref',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
export type FieldValue = string | number | boolean | string[];

export interface FieldDef {
  id: string;
  type: FieldType;
  required: boolean;
  values?: string[];
  default?: FieldValue;
  min?: number;
  max?: number;
  guide?: string;
}

export interface ColumnDef {
  id: string;
  title: string;
  wipLimit?: number;
  guide?: string;
}

export interface Transition {
  from: string;
  to: string[];
  requires: string[];
}

export interface Board {
  version: 1;
  name: string;
  idPrefix: string;
  guide?: string;
  columns: ColumnDef[];
  /** null — секции transitions нет, разрешён любой переход. */
  transitions: Transition[] | null;
  fields: FieldDef[];
}

export interface HistoryEntry {
  at: string;
  by: string;
  from: string | null;
  to: string;
}

export interface Note {
  at: string;
  by: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  column: string;
  assignee?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, FieldValue>;
  history: HistoryEntry[];
  description: string;
  notes: Note[];
}

/** Задача, прочитанная с диска. task = null, если файл не читается вообще. */
export interface LoadedTask {
  id: string;
  task: Task | null;
  errors: string[];
}

export type Clock = () => Date;

export const BUILTIN_FIELDS = [
  'id',
  'title',
  'column',
  'assignee',
  'created_by',
  'created_at',
  'updated_at',
  'history',
] as const;
