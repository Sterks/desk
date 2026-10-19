import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { presentBoard, presentLoaded, presentTask, presentTaskList } from '../../src/core/present.js';
import { toolDefinitions } from '../../src/mcp/input-schema.js';
import { testBoard, testTask } from '../helpers/board.js';

// Проверяет, что каждый outputSchema реально принимает то, что present.ts
// сегодня возвращает — а не просто повторяет форму present.ts на словах.
// Если поле переименуют/уберут/сменят nullability в presenters, эти тесты упадут.

const ajv = new Ajv({ strict: false });
const board = testBoard();
const schemaFor = (name: string): object => {
  const tool = toolDefinitions(board).find((t) => t.name === name);
  if (!tool?.outputSchema) throw new Error(`нет outputSchema у ${name}`);
  return tool.outputSchema;
};

describe('outputSchema соответствует реальному выводу present.ts', () => {
  it('get_board ← presentBoard', () => {
    const data = presentBoard(board, [testTask(), testTask({ id: 'T-002', column: 'done' })]);
    const validate = ajv.compile(schemaFor('get_board'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it('create_task/update_task/move_task/add_note ← presentTask', () => {
    const data = presentTask(testTask({ description: 'D', notes: [{ at: '2026-09-24T10:00:00Z', by: 'dev', text: 'заметка' }] }), []);
    for (const name of ['create_task', 'update_task', 'move_task', 'add_note']) {
      const validate = ajv.compile(schemaFor(name));
      expect(validate(data), `${name}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it('create_task/update_task/move_task/add_note ← presentTask с невалидной задачей (errors непустой)', () => {
    const data = presentTask(testTask(), ['Поле x не объявлено']);
    const validate = ajv.compile(schemaFor('create_task'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it('list_tasks ← presentTaskList, включая invalid_files и duplicate_ids', () => {
    const loaded = [
      { id: 'T-001', task: testTask({ fields: { priority: 'p3' } }), errors: [] },
      { id: 'T-002', task: testTask({ id: 'T-002', fields: { priority: 'p0' } }), errors: ['Поле x не объявлено'] },
      { id: 'T-003', task: null, errors: ['нет frontmatter'] },
    ];
    const data = presentTaskList(board, loaded, { limit: 10 });
    const validate = ajv.compile(schemaFor('list_tasks'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it('get_task ← presentLoaded, обе ветки (задача читается / файл не читается)', () => {
    const validate = ajv.compile(schemaFor('get_task'));
    const readable = presentLoaded({ id: 'T-001', task: testTask(), errors: [] });
    expect(validate(readable), JSON.stringify(validate.errors)).toBe(true);
    const unreadable = presentLoaded({ id: 'T-009', task: null, errors: ['нет frontmatter'] });
    expect(validate(unreadable), JSON.stringify(validate.errors)).toBe(true);
  });

  it('list_projects/get_project ← реальная форма, которую строит tools.ts', () => {
    const projectsList = { projects: [{ tenant_id: 'local', project_id: 'local', name: 'desk', legacy: true }] };
    expect(ajv.compile(schemaFor('list_projects'))(projectsList)).toBe(true);
    const project = { tenant_id: 'local', project_id: 'local', name: 'desk', guide: null, legacy: true };
    expect(ajv.compile(schemaFor('get_project'))(project)).toBe(true);
  });
});
