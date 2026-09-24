export type FieldType = 'string' | 'text' | 'number' | 'bool' | 'date' | 'url' | 'enum' | 'multi_enum' | 'task_ref';
export type FieldValue = string | number | boolean | string[];

export interface FieldInfo {
  id: string;
  type: FieldType;
  required: boolean;
  values: string[] | null;
  default: FieldValue | null;
  min: number | null;
  max: number | null;
  guide: string | null;
}

export interface ColumnInfo {
  id: string;
  title: string;
  guide: string | null;
  wip_limit: number | null;
  count: number;
}

export interface TransitionInfo {
  from: string;
  to: string[];
  requires: string[];
}

export interface BoardInfo {
  name: string;
  guide: string | null;
  columns: ColumnInfo[];
  fields: FieldInfo[];
  transitions: TransitionInfo[] | null;
}

/** Контекст tenant/project (`GET /api/project`); `legacy` — проект без `.desk/project.yaml`. */
export interface ProjectInfo {
  tenant_id: string;
  project_id: string;
  name: string;
  guide: string | null;
  legacy: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  column: string;
  assignee: string | null;
  /** Полный тип сабагента Claude Code (например `ecc:code-reviewer`); пишет только hook. */
  agent: string | null;
  fields: Record<string, FieldValue>;
  created_at: string;
  invalid: boolean;
  errors: string[];
}

export interface NoteInfo {
  at: string;
  by: string;
  text: string;
}

export interface HistoryInfo {
  at: string;
  by: string;
  from: string | null;
  to: string;
}

export interface TaskFull extends TaskItem {
  created_by: string;
  updated_at: string;
  description: string;
  notes: NoteInfo[];
  history: HistoryInfo[];
}

/** Ответ GET /api/tasks/:id для файла, который не парсится (src/core/present.ts, UnreadableTaskJson). */
export interface UnreadableTask {
  id: string;
  unreadable: true;
  invalid: true;
  errors: string[];
}

export interface TaskList {
  tasks: TaskItem[];
  invalid_files: { id: string; errors: string[] }[];
  duplicate_ids: string[][];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  field: string | null;
  guide: string | null;
  allowed: unknown[] | null;
}
