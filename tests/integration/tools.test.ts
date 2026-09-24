import { beforeEach, describe, expect, it } from 'vitest';
import { createBoardHolder } from '../../src/core/board-holder.js';
import { DeskError } from '../../src/core/errors.js';
import { callTool, type ToolContext } from '../../src/mcp/tools.js';
import { catchErrorAsync } from '../helpers/errors.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';
import { createWorkspaceContext } from '../../src/core/workspace.js';

let ctx: ToolContext;
beforeEach(async () => {
  ctx = { holder: await createBoardHolder(await makeProject(), {}), clock: fixedClock() };
});

const create = (args: Record<string, unknown> = {}) =>
  callTool(ctx, 'create_task', { actor: 'planner', title: 'Задача', ...args }) as Promise<{ id: string; column: string }>;

describe('callTool', () => {
  it('get_board: guide, колонки со счётчиками, поля', async () => {
    await create();
    const board = (await callTool(ctx, 'get_board', {})) as { guide: string; columns: { id: string; count: number }[] };
    expect(board.guide).toBe('Общие правила.');
    expect(board.columns[0]).toMatchObject({ id: 'backlog', count: 1 });
  });

  it('project tools возвращают legacy context и отклоняют чужой project', async () => {
    const root = await makeProject();
    const local: ToolContext = { holder: await createBoardHolder(root, {}), workspace: await createWorkspaceContext(root, 'agent') };
    const projects = (await callTool(local, 'list_projects', {})) as { projects: { tenant_id: string; project_id: string }[] };
    expect(projects.projects).toHaveLength(1);
    const project = (await callTool(local, 'get_project', {})) as { tenant_id: string; project_id: string; legacy: boolean };
    expect(project).toMatchObject({ tenant_id: 'local', legacy: true });
    expect((await catchErrorAsync(() => callTool(local, 'list_tasks', { project_id: 'other' }))).code).toBe('BAD_REQUEST');
  });

  it('create_task → get_task', async () => {
    const created = await create({ description: 'Описание', fields: { priority: 'p0' } });
    expect(created).toMatchObject({ id: 'T-001', column: 'backlog' });
    const full = (await callTool(ctx, 'get_task', { id: 'T-001' })) as { description: string; fields: object };
    expect(full).toMatchObject({ description: 'Описание', fields: { priority: 'p0' } });
  });

  it('list_tasks: фильтр where и limit по умолчанию', async () => {
    for (let i = 0; i < 3; i++) await create({ fields: { priority: i === 0 ? 'p0' : 'p2' } });
    const list = (await callTool(ctx, 'list_tasks', { where: { priority: 'p0' } })) as { tasks: { id: string }[]; total: number };
    expect(list.tasks.map((t) => t.id)).toEqual(['T-001']);
    expect(list.total).toBe(1);
  });

  it('list_tasks: limit больше 200 — BAD_REQUEST', async () => {
    expect((await catchErrorAsync(() => callTool(ctx, 'list_tasks', { limit: 500 }))).code).toBe('BAD_REQUEST');
  });

  it('move_task с fields закрывает requires; add_note', async () => {
    await create();
    const moved = (await callTool(ctx, 'move_task', { actor: 'dev', id: 'T-001', to: 'in_progress', fields: { assignee: 'dev' } })) as { column: string; assignee: string };
    expect(moved).toMatchObject({ column: 'in_progress', assignee: 'dev' });
    const noted = (await callTool(ctx, 'add_note', { actor: 'dev', id: 'T-001', text: 'готово' })) as { notes: { text: string }[] };
    expect(noted.notes[0]?.text).toBe('готово');
  });

  it('update_task: null удаляет поле', async () => {
    await create({ fields: { estimate: 3 } });
    const updated = (await callTool(ctx, 'update_task', { actor: 'dev', id: 'T-001', fields: { estimate: null } })) as { fields: object };
    expect(updated.fields).toEqual({ priority: 'p2' });
  });

  it.each([
    ['без actor', 'create_task', { title: 'X' }],
    ['лишний ключ на верхнем уровне', 'create_task', { actor: 'a', title: 'X', priority: 'p0' }],
    ['fields не объект', 'create_task', { actor: 'a', title: 'X', fields: 'p0' }],
    ['неизвестный tool', 'delete_task', {}],
    ['без id', 'get_task', {}],
  ])('%s → BAD_REQUEST', async (_name, tool, args) => {
    expect((await catchErrorAsync(() => callTool(ctx, tool, args))).code).toBe('BAD_REQUEST');
  });

  it('ошибки ядра проходят как есть', async () => {
    await create();
    const err = await catchErrorAsync(() => callTool(ctx, 'move_task', { actor: 'dev', id: 'T-001', to: 'done' }));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_FORBIDDEN', allowed: ['in_progress'] });
  });

  it('без .desk — INVALID_BOARD', async () => {
    const empty: ToolContext = { holder: await createBoardHolder(await makeEmptyDir(), {}) };
    expect((await catchErrorAsync(() => callTool(empty, 'get_board', {}))).code).toBe('INVALID_BOARD');
  });

  it('без .desk — list_projects/get_project возвращают INVALID_BOARD, а не пустой/дефолтный успех', async () => {
    const empty: ToolContext = { holder: await createBoardHolder(await makeEmptyDir(), {}) };
    expect((await catchErrorAsync(() => callTool(empty, 'list_projects', {}))).code).toBe('INVALID_BOARD');
    expect((await catchErrorAsync(() => callTool(empty, 'get_project', {}))).code).toBe('INVALID_BOARD');
  });

  it('workspaceError (сломанный project.yaml): list_projects/get_project — INVALID_BOARD, get_board работает', async () => {
    const root = await makeProject();
    const broken: ToolContext = {
      holder: await createBoardHolder(root, {}),
      clock: fixedClock(),
      workspaceError: new DeskError('INVALID_BOARD', 'project.yaml: tenant_id: обязательное поле'),
    };
    expect((await catchErrorAsync(() => callTool(broken, 'list_projects', {}))).message).toContain('project.yaml');
    expect((await catchErrorAsync(() => callTool(broken, 'get_project', {}))).message).toContain('project.yaml');
    const board = await callTool(broken, 'get_board', {});
    expect(board).toMatchObject({ guide: 'Общие правила.' });
  });
});
