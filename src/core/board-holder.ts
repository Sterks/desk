import { loadBoard } from './board-loader.js';
import { DeskError, isDeskError } from './errors.js';
import { findRoot } from './paths.js';
import type { Board } from './types.js';

export type ReloadResult = 'changed' | 'unchanged' | 'invalid';

export interface BoardHolder {
  readonly root: string | null;
  current(): Board | null;
  read(): Board;
  write(): Board;
  requireRoot(): string;
  reload(): Promise<ReloadResult>;
}

export async function createBoardHolder(cwd: string, env: NodeJS.ProcessEnv = process.env): Promise<BoardHolder> {
  let root: string | null = null;
  let current: Board | null = null;
  let error: DeskError | null = null;

  try {
    root = findRoot(cwd, env);
  } catch (e) {
    if (!isDeskError(e)) throw e;
    error = e;
  }

  const fallbackError = (): DeskError => error ?? new DeskError('INVALID_BOARD', 'board.yaml ещё не загружен');

  const reload = async (): Promise<ReloadResult> => {
    if (root === null) return 'invalid';
    try {
      const next = await loadBoard(root);
      const changed = JSON.stringify(next) !== JSON.stringify(current);
      current = next;
      error = null;
      return changed ? 'changed' : 'unchanged';
    } catch (e) {
      if (!isDeskError(e)) throw e;
      error = e;
      return 'invalid';
    }
  };

  await reload();

  return {
    get root() {
      return root;
    },
    current: () => current,
    read: () => {
      if (current) return current;
      throw fallbackError();
    },
    write: () => {
      if (error) throw error;
      if (!current) throw fallbackError();
      return current;
    },
    requireRoot: () => {
      if (root === null) throw fallbackError();
      return root;
    },
    reload,
  };
}
