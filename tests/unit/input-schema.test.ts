import { describe, expect, it } from 'vitest';
import { fieldJsonSchema, toolDefinitions } from '../../src/mcp/input-schema.js';
import { testBoard } from '../helpers/board.js';

const board = testBoard();
const tool = (name: string) => {
  const found = toolDefinitions(board).find((t) => t.name === name);
  if (!found) throw new Error(`нет tool ${name}`);
  return found;
};
type Props = Record<string, Record<string, unknown>>;
const props = (name: string): Props => tool(name).inputSchema.properties as Props;

describe('toolDefinitions', () => {
  it('9 tools', () => {
    expect(toolDefinitions(board).map((t) => t.name)).toEqual([
      'get_board', 'list_projects', 'get_project', 'list_tasks', 'get_task', 'create_task', 'update_task', 'move_task', 'add_note',
    ]);
  });

  it('create_task: enum колонок и полей, guide в description, обязательные параметры', () => {
    expect(props('create_task').column).toMatchObject({ enum: ['backlog', 'in_progress', 'review', 'done'] });
    const fields = props('create_task').fields as { properties: Props; additionalProperties: boolean };
    expect(fields.additionalProperties).toBe(false);
    expect(fields.properties.priority).toMatchObject({ type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] });
    expect(String(fields.properties.priority?.description)).toContain('p0 — прод лежит.');
    expect(String(fields.properties.priority?.description)).toContain('Обязательное');
    expect(fields.properties.assignee).toMatchObject({ type: 'string' });
    expect(tool('create_task').inputSchema.required).toEqual(['actor', 'title']);
  });

  it('move_task: to — enum колонок; поля допускают null', () => {
    expect(props('move_task').to).toMatchObject({ enum: ['backlog', 'in_progress', 'review', 'done'] });
    const fields = props('move_task').fields as { properties: Props };
    expect(fields.properties.estimate).toMatchObject({ anyOf: [{ type: 'number', minimum: 0, maximum: 100 }, { type: 'null' }] });
    expect(tool('move_task').inputSchema.required).toEqual(['actor', 'id', 'to']);
  });

  it('без доски — общие схемы без enum', () => {
    const defs = toolDefinitions(null);
    expect(defs).toHaveLength(9);
    const create = defs.find((t) => t.name === 'create_task');
    expect((create?.inputSchema.properties as Props).column).toEqual({ type: 'string' });
  });
});

describe('toolDefinitions: annotations', () => {
  it.each([
    ['get_board', { readOnlyHint: true, idempotentHint: true, openWorldHint: false }],
    ['list_projects', { readOnlyHint: true, idempotentHint: true, openWorldHint: false }],
    ['get_project', { readOnlyHint: true, idempotentHint: true, openWorldHint: false }],
    ['list_tasks', { readOnlyHint: true, idempotentHint: true, openWorldHint: false }],
    ['get_task', { readOnlyHint: true, idempotentHint: true, openWorldHint: false }],
    ['create_task', { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }],
    ['update_task', { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }],
    ['move_task', { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }],
    ['add_note', { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }],
  ])('%s', (name, expected) => {
    expect(tool(name).annotations).toEqual(expected);
  });
});

describe('toolDefinitions: outputSchema', () => {
  it('корень всегда type object (ограничение MCP SDK)', () => {
    for (const t of toolDefinitions(board)) expect(t.outputSchema?.type).toBe('object');
  });

  it('get_board: колонки со счётчиком, поля, transitions', () => {
    const schema = tool('get_board').outputSchema as { properties: Props; required: string[] };
    expect(schema.required).toEqual(['name', 'guide', 'columns', 'fields', 'transitions']);
    expect(schema.properties.columns).toMatchObject({ type: 'array', items: { required: ['id', 'title', 'guide', 'wip_limit', 'count'] } });
  });

  it('list_tasks: обёртка tasks/invalid_files/duplicate_ids/total', () => {
    const schema = tool('list_tasks').outputSchema as { required: string[] };
    expect(schema.required).toEqual(['tasks', 'invalid_files', 'duplicate_ids', 'total']);
  });

  it('create_task/update_task/move_task/add_note возвращают одну и ту же форму задачи', () => {
    const shapes = ['create_task', 'update_task', 'move_task', 'add_note'].map((n) => tool(n).outputSchema);
    for (const s of shapes) expect(s).toEqual(shapes[0]);
    expect((shapes[0] as { required: string[] }).required).toContain('history');
  });

  it('get_task: id/invalid/errors обязательны, остальное — общее с задачей плюс unreadable', () => {
    const schema = tool('get_task').outputSchema as { properties: Props; required: string[] };
    expect(schema.required).toEqual(['id', 'invalid', 'errors']);
    expect(schema.properties.unreadable).toEqual({ type: 'boolean' });
    expect(schema.properties.history).toBeDefined();
  });
});

describe('fieldJsonSchema', () => {
  it.each([
    ['summary', { type: 'string', maxLength: 200 }],
    ['acceptance', { type: 'string' }],
    ['flaky', { type: 'boolean' }],
    ['due', { type: 'string', format: 'date' }],
    ['pr_url', { type: 'string', format: 'uri' }],
    ['area', { type: 'array', items: { type: 'string', enum: ['backend', 'frontend'] }, uniqueItems: true }],
    ['blocked_by', { type: 'string', pattern: '^[A-Za-z]+-\\d+$' }],
  ])('%s', (id, expected) => {
    const field = board.fields.find((f) => f.id === id);
    if (!field) throw new Error(id);
    expect(fieldJsonSchema(field, false)).toMatchObject(expected);
  });

  it('default попадает в description', () => {
    const priority = board.fields[0];
    if (!priority) throw new Error('priority');
    expect(String(fieldJsonSchema(priority, false).description)).toContain('По умолчанию: "p2"');
  });
});
