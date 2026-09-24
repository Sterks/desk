import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Board, FieldDef } from '../core/types.js';
import { ASSIGNEE_GUIDE } from '../core/validate.js';

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

const object = (properties: Record<string, JsonSchema>, required: string[] = []): Tool['inputSchema'] =>
  ({
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  }) as Tool['inputSchema'];

export function toolDefinitions(board: Board | null): Tool[] {
  const column: JsonSchema = board ? { type: 'string', enum: board.columns.map((c) => c.id) } : { type: 'string' };
  const actor = { type: 'string', description: 'Твоё имя агента, например backend-agent. Пишется в историю.' };
  const id = { type: 'string', description: 'ID задачи, например T-012.' };

  return [
    {
      name: 'get_board',
      description:
        'Схема доски: общие правила (guide), колонки с guide и WIP-лимитами, поля с типами и guide, разрешённые переходы, число задач в колонках. Вызывай первым.',
      inputSchema: object({}),
    },
    {
      name: 'list_tasks',
      description:
        'Список задач, отсортированный по priority и дате создания. Фильтры объединяются через И. Перед созданием задачи ищи дубликаты через query.',
      inputSchema: object({
        column,
        assignee: { type: 'string' },
        query: { type: 'string', description: 'Подстрока в title или описании, без учёта регистра.' },
        where: {
          type: 'object',
          description: 'Точное совпадение по полям, например {"priority":"p0"}. Для multi_enum — значение содержится в массиве.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      }),
    },
    {
      name: 'get_task',
      description: 'Вся задача: поля, описание, notes, history и ошибки валидности.',
      inputSchema: object({ id }, ['id']),
    },
    {
      name: 'create_task',
      description:
        'Создать задачу. Без column задача попадает в первую колонку. Поля проверяются по board.yaml; при ошибке придут code, guide и allowed — исправь и повтори.',
      inputSchema: object(
        {
          actor,
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', description: 'Markdown.' },
          column,
          fields: fieldsSchema(board, false),
        },
        ['actor', 'title'],
      ),
    },
    {
      name: 'update_task',
      description: 'Изменить title, описание или поля. Колонку меняет только move_task.',
      inputSchema: object(
        { actor, id, title: { type: 'string', maxLength: 200 }, description: { type: 'string' }, fields: fieldsSchema(board, true) },
        ['actor', 'id'],
      ),
    },
    {
      name: 'move_task',
      description: 'Перенести задачу в колонку to. Поля, которые требует переход (requires), передай в fields этим же вызовом.',
      inputSchema: object({ actor, id, to: column, fields: fieldsSchema(board, true) }, ['actor', 'id', 'to']),
    },
    {
      name: 'add_note',
      description: 'Добавить заметку в раздел Notes задачи: решение, находку, причину блокировки. Одна строка.',
      inputSchema: object({ actor, id, text: { type: 'string', maxLength: 2000 } }, ['actor', 'id', 'text']),
    },
  ];
}
