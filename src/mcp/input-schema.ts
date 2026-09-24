import type { Tool, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { Board, FieldDef } from '../core/types.js';
import { ASSIGNEE_GUIDE } from '../core/validate.js';
import { DEFAULT_LIMIT, MAX_LIMIT } from './tools.js';

type JsonSchema = Record<string, unknown>;

function baseSchema(field: FieldDef): JsonSchema {
  switch (field.type) {
    case 'string':
      return { type: 'string', maxLength: 200 };
    case 'text':
      return { type: 'string' };
    case 'number':
      return {
        type: 'number',
        ...(field.min === undefined ? {} : { minimum: field.min }),
        ...(field.max === undefined ? {} : { maximum: field.max }),
      };
    case 'bool':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'url':
      return { type: 'string', format: 'uri' };
    case 'enum':
      return { type: 'string', enum: field.values ?? [] };
    case 'multi_enum':
      return { type: 'array', items: { type: 'string', enum: field.values ?? [] }, uniqueItems: true };
    case 'task_ref':
      return { type: 'string', pattern: '^[A-Za-z]+-\\d+$' };
  }
}

export function fieldJsonSchema(field: FieldDef, nullable: boolean): JsonSchema {
  const description = [
    field.guide,
    field.required ? 'Обязательное поле.' : null,
    field.default === undefined ? null : `По умолчанию: ${JSON.stringify(field.default)}.`,
    nullable && !field.required ? 'null удаляет значение.' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const base = baseSchema(field);
  const described = description === '' ? {} : { description };
  return nullable ? { anyOf: [base, { type: 'null' }], ...described } : { ...base, ...described };
}

function fieldsSchema(board: Board | null, nullable: boolean): JsonSchema {
  if (!board) return { type: 'object', description: 'Поля задачи. Схему смотри в get_board.' };
  const assignee = nullable
    ? { anyOf: [{ type: 'string' }, { type: 'null' }], description: `${ASSIGNEE_GUIDE} null снимает исполнителя.` }
    : { type: 'string', description: ASSIGNEE_GUIDE };
  return {
    type: 'object',
    description: 'Поля задачи из board.yaml.',
    properties: {
      ...Object.fromEntries(board.fields.map((f) => [f.id, fieldJsonSchema(f, nullable)])),
      assignee,
    },
    additionalProperties: false,
  };
}

const object = (properties: Record<string, JsonSchema>, required: string[] = []): Tool['inputSchema'] => ({
  type: 'object',
  properties,
  ...(required.length > 0 ? { required } : {}),
  additionalProperties: false,
});

const nullable = (schema: JsonSchema): JsonSchema => ({ anyOf: [schema, { type: 'null' }] });

// Формы ответов зеркалят src/core/present.ts (BoardJson/TaskJson/TaskListJson/...) —
// держи в синхроне при правке presenters.
const noteOutputSchema: JsonSchema = object(
  { at: { type: 'string' }, by: { type: 'string' }, text: { type: 'string' } },
  ['at', 'by', 'text'],
);
const historyEntryOutputSchema: JsonSchema = object(
  { at: { type: 'string' }, by: { type: 'string' }, from: nullable({ type: 'string' }), to: { type: 'string' } },
  ['at', 'by', 'from', 'to'],
);
const taskFieldsOutputSchema: JsonSchema = { type: 'object', description: 'Поля задачи. Схема — в get_board.' };

const TASK_LIST_ITEM_PROPS: Record<string, JsonSchema> = {
  id: { type: 'string' },
  title: { type: 'string' },
  column: { type: 'string' },
  assignee: nullable({ type: 'string' }),
  agent: nullable({ type: 'string' }),
  fields: taskFieldsOutputSchema,
  created_at: { type: 'string' },
  invalid: { type: 'boolean' },
  errors: { type: 'array', items: { type: 'string' } },
};
const TASK_LIST_ITEM_REQUIRED = ['id', 'title', 'column', 'assignee', 'agent', 'fields', 'created_at', 'invalid', 'errors'];

const TASK_PROPS: Record<string, JsonSchema> = {
  ...TASK_LIST_ITEM_PROPS,
  created_by: { type: 'string' },
  updated_at: { type: 'string' },
  description: { type: 'string' },
  notes: { type: 'array', items: noteOutputSchema },
  history: { type: 'array', items: historyEntryOutputSchema },
};
const TASK_REQUIRED = [...TASK_LIST_ITEM_REQUIRED, 'created_by', 'updated_at', 'description', 'notes', 'history'];

/** Полная задача — ответ create_task/update_task/move_task/add_note. */
const taskOutputSchema = object(TASK_PROPS, TASK_REQUIRED);

/**
 * get_task возвращает TaskJson либо UnreadableTaskJson (нечитаемый файл задачи).
 * outputSchema верхнего уровня обязан быть одним type:"object" (ограничение MCP SDK),
 * поэтому это не anyOf, а объединение полей: id/invalid/errors общие всегда,
 * остальные task-поля присутствуют только когда unreadable отсутствует.
 */
const getTaskOutputSchema = object({ ...TASK_PROPS, unreadable: { type: 'boolean' } }, ['id', 'invalid', 'errors']);

const listTasksOutputSchema = object(
  {
    tasks: { type: 'array', items: object(TASK_LIST_ITEM_PROPS, TASK_LIST_ITEM_REQUIRED) },
    invalid_files: { type: 'array', items: object({ id: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } } }, ['id', 'errors']) },
    duplicate_ids: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
    total: { type: 'number' },
  },
  ['tasks', 'invalid_files', 'duplicate_ids', 'total'],
);

const boardOutputSchema = object(
  {
    name: { type: 'string' },
    guide: nullable({ type: 'string' }),
    columns: {
      type: 'array',
      items: object(
        { id: { type: 'string' }, title: { type: 'string' }, guide: nullable({ type: 'string' }), wip_limit: nullable({ type: 'number' }), count: { type: 'number' } },
        ['id', 'title', 'guide', 'wip_limit', 'count'],
      ),
    },
    fields: {
      type: 'array',
      items: object(
        {
          id: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          values: nullable({ type: 'array', items: { type: 'string' } }),
          default: {},
          min: nullable({ type: 'number' }),
          max: nullable({ type: 'number' }),
          guide: nullable({ type: 'string' }),
        },
        ['id', 'type', 'required'],
      ),
    },
    transitions: nullable({
      type: 'array',
      items: object({ from: { type: 'string' }, to: { type: 'array', items: { type: 'string' } }, requires: { type: 'array', items: { type: 'string' } } }, ['from', 'to', 'requires']),
    }),
  },
  ['name', 'guide', 'columns', 'fields', 'transitions'],
);

const listProjectsOutputSchema = object(
  { projects: { type: 'array', items: object({ tenant_id: { type: 'string' }, project_id: { type: 'string' }, name: { type: 'string' }, legacy: { type: 'boolean' } }, ['tenant_id', 'project_id', 'name', 'legacy']) } },
  ['projects'],
);

const getProjectOutputSchema = object(
  { tenant_id: { type: 'string' }, project_id: { type: 'string' }, name: { type: 'string' }, guide: nullable({ type: 'string' }), legacy: { type: 'boolean' } },
  ['tenant_id', 'project_id', 'name', 'guide', 'legacy'],
);

/** Только чтение, безопасно вызывать без подтверждения; каждый вызов — тот же результат при неизменной доске. */
const READ_ONLY: ToolAnnotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
/** Мутирует, но только добавляет (новую задачу, новую заметку) — не стирает существующие данные. */
const ADDITIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
/** Мутирует и может перезаписать/обнулить существующие данные (поля, колонку). */
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false };
// idempotentHint: false для всех мутирующих tools — каждый вызов дописывает запись
// в history/notes, так что повтор с теми же аргументами не эквивалентен одному вызову.

export function toolDefinitions(board: Board | null): Tool[] {
  const column: JsonSchema = board ? { type: 'string', enum: board.columns.map((c) => c.id) } : { type: 'string' };
  const actor = { type: 'string', description: 'Твоё имя агента, например backend-agent. Пишется в историю.' };
  const id = { type: 'string', description: 'ID задачи, например T-012.' };

  return [
    {
      name: 'get_board',
      description:
        'Схема доски: общие правила (guide), колонки с guide и WIP-лимитами, поля с типами и guide, разрешённые переходы, число задач в колонках. Вызывай первым.',
      inputSchema: object({ tenant_id: { type: 'string' }, project_id: { type: 'string' } }),
      outputSchema: boardOutputSchema,
      annotations: READ_ONLY,
    },
    {
      name: 'list_projects',
      description: 'Список доступных проектов в текущем tenant context. В legacy режиме содержит текущий локальный project.',
      inputSchema: object({}),
      outputSchema: listProjectsOutputSchema,
      annotations: READ_ONLY,
    },
    {
      name: 'get_project',
      description: 'Метаданные tenant/project и признак legacy режима.',
      inputSchema: object({ tenant_id: { type: 'string' }, project_id: { type: 'string' } }),
      outputSchema: getProjectOutputSchema,
      annotations: READ_ONLY,
    },
    {
      name: 'list_tasks',
      description:
        'Список задач, отсортированный по priority и дате создания. Фильтры объединяются через И. Перед созданием задачи ищи дубликаты через query.',
      inputSchema: object({
        tenant_id: { type: 'string' },
        project_id: { type: 'string' },
        column,
        assignee: { type: 'string' },
        query: { type: 'string', description: 'Подстрока в title или описании, без учёта регистра.' },
        where: {
          type: 'object',
          description: 'Точное совпадение по полям, например {"priority":"p0"}. Для multi_enum — значение содержится в массиве.',
        },
        limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
      }),
      outputSchema: listTasksOutputSchema,
      annotations: READ_ONLY,
    },
    {
      name: 'get_task',
      description: 'Вся задача: поля, описание, notes, history и ошибки валидности.',
      inputSchema: object({ id, tenant_id: { type: 'string' }, project_id: { type: 'string' } }, ['id']),
      outputSchema: getTaskOutputSchema,
      annotations: READ_ONLY,
    },
    {
      name: 'create_task',
      description:
        'Создать задачу. Без column задача попадает в первую колонку. Поля проверяются по board.yaml; при ошибке придут code, guide и allowed — исправь и повтори.',
      inputSchema: object(
        {
          actor,
          tenant_id: { type: 'string' },
          project_id: { type: 'string' },
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', description: 'Markdown.' },
          column,
          fields: fieldsSchema(board, false),
        },
        ['actor', 'title'],
      ),
      outputSchema: taskOutputSchema,
      annotations: ADDITIVE,
    },
    {
      name: 'update_task',
      description: 'Изменить title, описание или поля. Колонку меняет только move_task.',
      inputSchema: object(
        { actor, id, tenant_id: { type: 'string' }, project_id: { type: 'string' }, title: { type: 'string', maxLength: 200 }, description: { type: 'string' }, fields: fieldsSchema(board, true) },
        ['actor', 'id'],
      ),
      outputSchema: taskOutputSchema,
      annotations: DESTRUCTIVE,
    },
    {
      name: 'move_task',
      description: 'Перенести задачу в колонку to. Поля, которые требует переход (requires), передай в fields этим же вызовом.',
      inputSchema: object({ actor, id, tenant_id: { type: 'string' }, project_id: { type: 'string' }, to: column, fields: fieldsSchema(board, true) }, ['actor', 'id', 'to']),
      outputSchema: taskOutputSchema,
      annotations: DESTRUCTIVE,
    },
    {
      name: 'add_note',
      description: 'Добавить заметку в раздел Notes задачи: решение, находку, причину блокировки. Одна строка.',
      inputSchema: object({ actor, id, tenant_id: { type: 'string' }, project_id: { type: 'string' }, text: { type: 'string', maxLength: 2000 } }, ['actor', 'id', 'text']),
      outputSchema: taskOutputSchema,
      annotations: ADDITIVE,
    },
  ];
}
