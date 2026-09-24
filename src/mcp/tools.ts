import { z } from 'zod';
import type { BoardHolder } from '../core/board-holder.js';
import { DeskError } from '../core/errors.js';
import { presentBoard, presentLoaded, presentTask, presentTaskList } from '../core/present.js';
import { addNote, createTask, getTask, loadAll, moveTask, readableTasks, updateTask } from '../core/task-store.js';
import type { Clock } from '../core/types.js';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export interface ToolContext {
  holder: BoardHolder;
  clock?: Clock;
}

const actor = z.string({ required_error: 'передай имя агента' });
const id = z.string({ required_error: 'передай ID задачи' });
const fields = z.record(z.unknown()).optional();

const argSchemas = {
  get_board: z.object({}).strict(),
  list_tasks: z
    .object({
      column: z.string().optional(),
      assignee: z.string().optional(),
      query: z.string().optional(),
      where: z.record(z.unknown()).optional(),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    })
    .strict(),
  get_task: z.object({ id }).strict(),
  create_task: z
    .object({ actor, title: z.string(), description: z.string().optional(), column: z.string().optional(), fields })
    .strict(),
  update_task: z
    .object({ actor, id, title: z.string().optional(), description: z.string().optional(), fields })
    .strict(),
  move_task: z.object({ actor, id, to: z.string(), fields }).strict(),
  add_note: z.object({ actor, id, text: z.string() }).strict(),
};

export type ToolName = keyof typeof argSchemas;
export const TOOL_NAMES = Object.keys(argSchemas) as ToolName[];

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
      parseArgs(name, raw);
      const board = holder.read();
      return presentBoard(board, readableTasks(await loadAll(holder.requireRoot(), board)));
    }
    case 'list_tasks': {
      const args = parseArgs(name, raw);
      const board = holder.read();
      return presentTaskList(board, await loadAll(holder.requireRoot(), board), { ...args, limit: args.limit ?? DEFAULT_LIMIT });
    }
    case 'get_task': {
      const args = parseArgs(name, raw);
      const board = holder.read();
      return presentLoaded(await getTask(holder.requireRoot(), board, args.id));
    }
    case 'create_task': {
      const args = parseArgs(name, raw);
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
      const task = await moveTask(holder.requireRoot(), holder.write(), args.id, args.to, args.fields ?? {}, args.actor, clock);
      return presentTask(task, []);
    }
    case 'add_note': {
      const args = parseArgs(name, raw);
      const task = await addNote(holder.requireRoot(), holder.write(), args.id, args.text, args.actor, clock);
      return presentTask(task, []);
    }
  }
}
