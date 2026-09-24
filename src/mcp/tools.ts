import { z } from 'zod';
import type { BoardHolder } from '../core/board-holder.js';
import { DeskError } from '../core/errors.js';
import { presentBoard, presentLoaded, presentTask, presentTaskList } from '../core/present.js';
import { addNote, createTask, getTask, loadAll, moveTask, readableTasks, updateTask } from '../core/task-store.js';
import type { Clock } from '../core/types.js';
import type { WorkspaceContext } from '../core/workspace.js';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export interface ToolContext {
  holder: BoardHolder;
  clock?: Clock;
  workspace?: WorkspaceContext;
}

const actor = z.string({ required_error: 'передай имя агента' });
const id = z.string({ required_error: 'передай ID задачи' });
const fields = z.record(z.unknown()).optional();
const context = { tenant_id: z.string().optional(), project_id: z.string().optional() };

const argSchemas = {
  get_board: z.object(context).strict(),
  list_projects: z.object({}).strict(),
  get_project: z.object(context).strict(),
  list_tasks: z
    .object({
      column: z.string().optional(),
      assignee: z.string().optional(),
      query: z.string().optional(),
      where: z.record(z.unknown()).optional(),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    })
    .extend(context)
    .strict(),
  get_task: z.object({ id, ...context }).strict(),
  create_task: z
    .object({ actor, title: z.string(), description: z.string().optional(), column: z.string().optional(), fields })
    .extend(context)
    .strict(),
  update_task: z
    .object({ actor, id, title: z.string().optional(), description: z.string().optional(), fields })
    .extend(context)
    .strict(),
  move_task: z.object({ actor, id, to: z.string(), fields, ...context }).strict(),
  add_note: z.object({ actor, id, text: z.string(), ...context }).strict(),
};

export type ToolName = keyof typeof argSchemas;
export const TOOL_NAMES = Object.keys(argSchemas) as ToolName[];

function assertContext(ctx: ToolContext, args: unknown): void {
  if (!ctx.workspace || typeof args !== 'object' || args === null) return;
  const value = args as { tenant_id?: string; project_id?: string };
  if (value.tenant_id && value.tenant_id !== ctx.workspace.tenantId) throw new DeskError('BAD_REQUEST', `Неизвестный tenant context: ${value.tenant_id}`);
  if (value.project_id && value.project_id !== ctx.workspace.projectId) throw new DeskError('BAD_REQUEST', `Неизвестный project context: ${value.project_id}`);
}

function parseArgs<N extends ToolName>(name: N, raw: unknown): z.infer<(typeof argSchemas)[N]> {
  const result = argSchemas[name].safeParse(raw ?? {});
  if (!result.success) {
    const [issue] = result.error.issues;
    const where = issue?.path.length ? issue.path.join('.') : 'аргументы';
    throw new DeskError('BAD_REQUEST', `${name}: ${where}: ${issue?.message ?? 'неверные аргументы'}`);
  }
  return result.data as z.infer<(typeof argSchemas)[N]>;
}

function isToolName(name: string): name is ToolName {
  return (TOOL_NAMES as string[]).includes(name);
}

export async function callTool(ctx: ToolContext, name: string, raw: unknown): Promise<unknown> {
  if (!isToolName(name)) {
    throw new DeskError('BAD_REQUEST', `Неизвестный tool: ${name}. Доступны: ${TOOL_NAMES.join(', ')}`);
  }
  const { holder } = ctx;
  const clock = ctx.clock ?? (() => new Date());

  switch (name) {
    case 'get_board': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const board = holder.read();
      return presentBoard(board, readableTasks(await loadAll(holder.requireRoot(), board)));
    }
    case 'list_projects': {
      parseArgs(name, raw);
      if (!ctx.workspace) return { projects: [] };
      return { projects: [{ tenant_id: ctx.workspace.tenantId, project_id: ctx.workspace.projectId, name: ctx.workspace.project.name, legacy: ctx.workspace.project.legacy }] };
    }
    case 'get_project': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      if (!ctx.workspace) throw new DeskError('INVALID_BOARD', 'Project context ещё не загружен');
      return { tenant_id: ctx.workspace.tenantId, project_id: ctx.workspace.projectId, name: ctx.workspace.project.name, guide: ctx.workspace.project.guide ?? null, legacy: ctx.workspace.project.legacy };
    }
    case 'list_tasks': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const board = holder.read();
      return presentTaskList(board, await loadAll(holder.requireRoot(), board), { ...args, limit: args.limit ?? DEFAULT_LIMIT });
    }
    case 'get_task': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const board = holder.read();
      return presentLoaded(await getTask(holder.requireRoot(), board, args.id));
    }
    case 'create_task': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const task = await createTask(
        holder.requireRoot(),
        holder.write(),
        { title: args.title, description: args.description, column: args.column, fields: args.fields },
        args.actor,
        clock,
      );
      return presentTask(task, []);
    }
    case 'update_task': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const task = await updateTask(
        holder.requireRoot(),
        holder.write(),
        args.id,
        { title: args.title, description: args.description, fields: args.fields },
        args.actor,
        clock,
      );
      return presentTask(task, []);
    }
    case 'move_task': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const task = await moveTask(holder.requireRoot(), holder.write(), args.id, args.to, args.fields ?? {}, args.actor, clock);
      return presentTask(task, []);
    }
    case 'add_note': {
      const args = parseArgs(name, raw);
      assertContext(ctx, args);
      const task = await addNote(holder.requireRoot(), holder.write(), args.id, args.text, args.actor, clock);
      return presentTask(task, []);
    }
  }
}
