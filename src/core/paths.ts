import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DeskError } from './errors.js';

export const DESK_DIR = '.desk';
export const TASK_FILE_RE = /^([A-Za-z]+-\d+)\.md$/;

export const deskDir = (root: string): string => join(root, DESK_DIR);
export const boardPath = (root: string): string => join(root, DESK_DIR, 'board.yaml');
export const projectPath = (root: string): string => join(root, DESK_DIR, 'project.yaml');
export const tasksDir = (root: string): string => join(root, DESK_DIR, 'tasks');
export const lockPath = (root: string): string => join(root, DESK_DIR, '.lock');
export const taskPath = (root: string, id: string): string => join(tasksDir(root), `${id}.md`);

/** Корень проекта: DESK_ROOT, иначе первая папка с `.desk/` вверх от cwd. */
export function findRoot(cwd: string, env: NodeJS.ProcessEnv = process.env): string {
  if (env.DESK_ROOT) {
    const root = resolve(env.DESK_ROOT);
    if (isDirectory(deskDir(root))) return root;
    throw notFound(root);
  }
  let dir = resolve(cwd);
  for (;;) {
    if (isDirectory(deskDir(dir))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw notFound(resolve(cwd));
    dir = parent;
  }
}

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function notFound(from: string): DeskError {
  return new DeskError(
    'INVALID_BOARD',
    `Папка .desk не найдена (поиск от ${from}). Запусти desk init в корне проекта.`,
  );
}
