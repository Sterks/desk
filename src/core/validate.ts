import { DeskError, isDeskError } from './errors.js';
import type { Board, FieldDef, FieldValue, Task } from './types.js';

export interface ValidationContext {
  taskExists(id: string): boolean;
}

export const ASSIGNEE_GUIDE = 'Имя агента или человека, который выполняет задачу.';

const MAX_STRING = 200;
const MAX_ACTOR = 64;
const MAX_AGENT = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TASK_ID_RE = /^[A-Za-z]+-\d+$/;
const ACTOR_FORBIDDEN_RE = /[:·\n\r]/;

export function checkValue(field: FieldDef, value: unknown, ctx?: ValidationContext): FieldValue {
  const fail = (message: string, allowed?: unknown[]): DeskError =>
    new DeskError('INVALID_VALUE', `Поле ${field.id}: ${message}`, {
      field: field.id,
      guide: field.guide,
      allowed,
    });
  const values = field.values ?? [];

  switch (field.type) {
    case 'string':
      if (typeof value !== 'string' || value.includes('\n') || value.length > MAX_STRING) {
        throw fail(`ожидается строка без переносов, до ${MAX_STRING} символов`);
      }
      return value;
    case 'text':
      if (typeof value !== 'string') throw fail('ожидается строка');
      return value;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) throw fail('ожидается конечное число');
      if (field.min !== undefined && value < field.min) throw fail(`минимум ${field.min}`);
      if (field.max !== undefined && value > field.max) throw fail(`максимум ${field.max}`);
      return value;
    case 'bool':
      if (typeof value !== 'boolean') throw fail('ожидается true или false');
      return value;
    case 'date':
      if (typeof value !== 'string' || !isValidDate(value)) throw fail('ожидается дата YYYY-MM-DD');
      return value;
    case 'url':
      if (typeof value !== 'string' || !isHttpUrl(value)) throw fail('ожидается абсолютный http(s) URL');
      return value;
    case 'enum':
      if (typeof value !== 'string' || !values.includes(value)) {
        throw fail(`допустимые значения: ${values.join(', ')}`, values);
      }
      return value;
    case 'multi_enum':
      if (
        !Array.isArray(value) ||
        value.some((v) => typeof v !== 'string' || !values.includes(v)) ||
        new Set(value).size !== value.length
      ) {
        throw fail(`ожидается массив уникальных значений из: ${values.join(', ')}`, values);
      }
      return [...(value as string[])];
    case 'task_ref':
      if (typeof value !== 'string' || !TASK_ID_RE.test(value)) throw fail('ожидается ID задачи, например T-001');
      if (ctx && !ctx.taskExists(value)) throw fail(`задача ${value} не найдена`);
      return value;
  }
}

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function checkTitle(title: unknown): string {
  if (typeof title !== 'string' || title.includes('\n') || title.trim() === '' || title.trim().length > MAX_STRING) {
    throw new DeskError('INVALID_VALUE', `title: ожидается строка 1–${MAX_STRING} символов без переносов`, {
      field: 'title',
    });
  }
  return title.trim();
}

export function checkActor(actor: unknown): string {
  if (typeof actor !== 'string' || actor.trim() === '' || actor.trim().length > MAX_ACTOR || ACTOR_FORBIDDEN_RE.test(actor)) {
    throw new DeskError(
      'BAD_REQUEST',
      `actor: обязательная строка до ${MAX_ACTOR} символов без ":", "·" и переносов — твоё имя агента`,
    );
  }
  return actor.trim();
}

export function checkText(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new DeskError('BAD_REQUEST', `${name}: ожидается строка`);
  return value;
}

/** Тип сабагента: одна строка до 100 символов, `:` допустим. */
export function checkAgent(value: unknown): string {
  if (typeof value !== 'string' || /[\r\n]/.test(value) || value.trim() === '' || value.trim().length > MAX_AGENT) {
    throw new DeskError('INVALID_VALUE', `agent: строка до ${MAX_AGENT} символов без переносов`, { field: 'agent' });
  }
  return value.trim();
}

function checkAssignee(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > MAX_ACTOR || ACTOR_FORBIDDEN_RE.test(value)) {
    throw new DeskError('INVALID_VALUE', `assignee: строка до ${MAX_ACTOR} символов без ":", "·" и переносов`, {
      field: 'assignee',
      guide: ASSIGNEE_GUIDE,
    });
  }
  return value.trim();
}

export function fieldDef(board: Board, id: string): FieldDef | undefined {
  return board.fields.find((f) => f.id === id);
}

export function applyDefaults(board: Board, fields: Record<string, FieldValue>): Record<string, FieldValue> {
  const defaults = board.fields
    .filter((f) => f.default !== undefined && fields[f.id] === undefined)
    .map((f) => [f.id, f.default as FieldValue] as const);
  return { ...Object.fromEntries(defaults), ...fields };
}

function withoutKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as T;
}

export function applyChanges(
  board: Board,
  task: Task,
  changes: Record<string, unknown>,
  ctx: ValidationContext,
): Task {
  let fields = task.fields;
  let assignee = task.assignee;

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'assignee') {
      assignee = value === null ? undefined : checkAssignee(value);
      continue;
    }
    const def = fieldDef(board, key);
    if (!def) {
      if (value === null && key in fields) {
        fields = withoutKey(fields, key);
        continue;
      }
      throw new DeskError('UNKNOWN_FIELD', `Поле ${key} не объявлено в board.yaml`, {
        field: key,
        allowed: [...board.fields.map((f) => f.id), 'assignee'],
      });
    }
    fields = value === null ? withoutKey(fields, key) : { ...fields, [key]: checkValue(def, value, ctx) };
  }

  const base = withoutKey(task as unknown as Record<string, unknown>, 'assignee') as unknown as Task;
  return assignee === undefined ? { ...base, fields } : { ...base, fields, assignee };
}

function requiredError(field: FieldDef): DeskError {
  return new DeskError('REQUIRED_MISSING', `Поле ${field.id} обязательно`, { field: field.id, guide: field.guide });
}

export function validateTask(board: Board, task: Task, ctx: ValidationContext): DeskError[] {
  const titleErrors = (() => {
    try {
      checkTitle(task.title);
      return [];
    } catch (e) {
      if (isDeskError(e)) return [e];
      throw e;
    }
  })();
  const columnErrors = board.columns.some((c) => c.id === task.column)
    ? []
    : [
        new DeskError('INVALID_VALUE', `Колонка ${task.column} не существует в board.yaml`, {
          field: 'column',
          allowed: board.columns.map((c) => c.id),
        }),
      ];
  const fieldErrors = Object.entries(task.fields).flatMap(([key, value]) => {
    const def = fieldDef(board, key);
    if (!def) {
      return [
        new DeskError('UNKNOWN_FIELD', `Поле ${key} не объявлено в board.yaml. Удали его: fields {"${key}": null}`, {
          field: key,
        }),
      ];
    }
    try {
      checkValue(def, value, ctx);
      return [];
    } catch (e) {
      if (isDeskError(e)) return [e];
      throw e;
    }
  });
  const agentErrors = (() => {
    if (task.agent === undefined) return [];
    try {
      checkAgent(task.agent);
      return [];
    } catch (e) {
      if (isDeskError(e)) return [e];
      throw e;
    }
  })();
  const requiredErrors = board.fields.filter((f) => f.required && isEmptyValue(task.fields[f.id])).map(requiredError);
  return [...titleErrors, ...columnErrors, ...agentErrors, ...fieldErrors, ...requiredErrors];
}

export function assertTaskValid(board: Board, task: Task, ctx: ValidationContext): void {
  const [first] = validateTask(board, task, ctx);
  if (first) throw first;
}
