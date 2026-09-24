import { readdir, readFile } from 'node:fs/promises';
import { DeskError } from './errors.js';
import { writeFileAtomic } from './fs-atomic.js';
import { idNumber, nextId } from './ids.js';
import { withLock } from './lock.js';
import { TASK_FILE_RE, taskPath, tasksDir } from './paths.js';
import { parseTaskFile, serializeTask } from './task-file.js';
import { checkWip, planMove } from './transitions.js';
import type { Board, Clock, LoadedTask, Task } from './types.js';
import {
  applyChanges,
  applyDefaults,
  assertTaskValid,
  checkActor,
  checkAgent,
  checkText,
  checkTitle,
  validateTask,
  type ValidationContext,
} from './validate.js';

export interface CreateInput {
  title: unknown;
  description?: unknown;
  column?: string;
  fields?: Record<string, unknown>;
  /** Полный тип сабагента; задаёт только хук agent-start, в MCP/HTTP не пробрасывается. */
  agent?: unknown;
}

export interface UpdateInput {
  title?: unknown;
  description?: unknown;
  fields?: Record<string, unknown>;
}

const MAX_NOTE = 2000;
const systemClock: Clock = () => new Date();

export function isoNow(clock: Clock): string {
  return clock().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export async function loadAll(root: string, board: Board): Promise<LoadedTask[]> {
  let names: string[];
  try {
    names = await readdir(tasksDir(root));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const ids = names.flatMap((name) => {
    const match = TASK_FILE_RE.exec(name);
    return match?.[1] ? [match[1]] : [];
  });
  const parsed = await Promise.all(
    ids.map(async (id) => ({ id, ...parseTaskFile(await readFile(taskPath(root, id), 'utf8'), id) })),
  );
  const ctx = contextFor(parsed);
  return parsed
    .map(({ id, task, errors }) => ({
      id,
      task,
      errors: task ? [...errors, ...validateTask(board, task, ctx).map((e) => e.message)] : errors,
    }))
    .sort((a, b) => (idNumber(a.id) ?? 0) - (idNumber(b.id) ?? 0) || a.id.localeCompare(b.id));
}

export function readableTasks(loaded: readonly LoadedTask[]): Task[] {
  return loaded.flatMap((l) => (l.task ? [l.task] : []));
}

export function contextFor(loaded: readonly { id: string }[]): ValidationContext {
  const ids = new Set(loaded.map((l) => l.id));
  return { taskExists: (id) => ids.has(id) };
}

export async function getTask(root: string, board: Board, id: string): Promise<LoadedTask> {
  const found = (await loadAll(root, board)).find((l) => l.id === id);
  if (!found) throw new DeskError('NOT_FOUND', `Задача ${id} не найдена`, { field: 'id' });
  return found;
}

export async function createTask(
  root: string,
  board: Board,
  input: CreateInput,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  const title = checkTitle(input.title);
  const description = checkText(input.description ?? '', 'description').trim();
  const agent = input.agent === undefined ? undefined : checkAgent(input.agent);
  const firstColumn = board.columns[0]?.id ?? '';
  const target = input.column ?? firstColumn;

  return withLock(root, async () => {
    const loaded = await loadAll(root, board);
    const tasks = readableTasks(loaded);
    const ctx = contextFor(loaded);
    const now = isoNow(clock);
    const id = nextId(board.idPrefix, loaded.map((l) => l.id));
    const draft: Task = {
      id,
      title,
      column: firstColumn,
      ...(agent === undefined ? {} : { agent }),
      createdBy: actor,
      createdAt: now,
      updatedAt: now,
      fields: applyDefaults(board, {}),
      history: [],
      description,
      notes: [],
    };
    const withFields = applyChanges(board, draft, input.fields ?? {}, ctx);
    if (target === firstColumn) checkWip(board, tasks, id, firstColumn);
    const placed = target === firstColumn ? withFields : planMove(board, tasks, withFields, { to: target, changes: {}, actor, now }, ctx);
    const task: Task = { ...placed, history: [{ at: now, by: actor, from: null, to: placed.column }] };
    assertTaskValid(board, task, ctx);
    await writeFileAtomic(taskPath(root, id), serializeTask(task));
    return task;
  });
}

type Mutation = (task: Task, tasks: readonly Task[], ctx: ValidationContext, now: string) => Task;

async function mutate(root: string, board: Board, id: string, clock: Clock, fn: Mutation): Promise<Task> {
  return withLock(root, async () => {
    const loaded = await loadAll(root, board);
    const entry = loaded.find((l) => l.id === id);
    if (!entry) throw new DeskError('NOT_FOUND', `Задача ${id} не найдена`, { field: 'id' });
    if (!entry.task) {
      throw new DeskError('BAD_REQUEST', `Файл задачи ${id} не читается: ${entry.errors.join('; ')}. Исправь файл вручную.`);
    }
    const ctx = contextFor(loaded);
    const next = fn(entry.task, readableTasks(loaded), ctx, isoNow(clock));
    if (next === entry.task) return next;
    assertTaskValid(board, next, ctx);
    await writeFileAtomic(taskPath(root, id), serializeTask(next));
    return next;
  });
}

export async function updateTask(
  root: string,
  board: Board,
  id: string,
  input: UpdateInput,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  checkActor(actorRaw);
  const title = input.title === undefined ? undefined : checkTitle(input.title);
  const description = input.description === undefined ? undefined : checkText(input.description, 'description').trim();
  return mutate(root, board, id, clock, (task, _tasks, ctx, now) => ({
    ...applyChanges(board, task, input.fields ?? {}, ctx),
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    updatedAt: now,
  }));
}

export async function moveTask(
  root: string,
  board: Board,
  id: string,
  to: string,
  fields: Record<string, unknown>,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  return mutate(root, board, id, clock, (task, tasks, ctx, now) =>
    planMove(board, tasks, task, { to, changes: fields, actor, now }, ctx),
  );
}

export async function addNote(
  root: string,
  board: Board,
  id: string,
  textRaw: unknown,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  const text = checkText(textRaw, 'text').replace(/\s+/g, ' ').trim();
  if (text === '' || text.length > MAX_NOTE) {
    throw new DeskError('BAD_REQUEST', `text: заметка 1–${MAX_NOTE} символов`);
  }
  return mutate(root, board, id, clock, (task, _tasks, _ctx, now) => ({
    ...task,
    updatedAt: now,
    notes: [...task.notes, { at: now, by: actor, text }],
  }));
}
