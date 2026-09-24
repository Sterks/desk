import { basename, dirname } from 'node:path';
import chokidar from 'chokidar';
import { DESK_DIR, TASK_FILE_RE, deskDir } from './paths.js';

export type DeskEvent =
  | { type: 'task_changed'; id: string }
  | { type: 'task_removed'; id: string }
  | { type: 'board_changed' };

export interface DeskWatcher {
  ready: Promise<void>;
  close(): Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 50;

/**
 * Задержка после `ready` chokidar, прежде чем считать вотчер стабильным.
 * На macOS fsevents может доставить "исторические" change-события для файлов,
 * созданных непосредственно перед стартом наблюдения (например, `.desk/board.yaml`
 * из фикстуры теста), несмотря на `ignoreInitial: true` — обычно в пределах ~10мс
 * после `ready`. События, пришедшие раньше этого окна, отбрасываются.
 */
const STABILIZE_MS = 250;

export function watchDesk(
  root: string,
  onEvent: (event: DeskEvent) => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): DeskWatcher {
  const timers = new Map<string, NodeJS.Timeout>();
  let settled = false;
  const schedule = (key: string, event: DeskEvent): void => {
    if (!settled) return;
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        onEvent(event);
      }, debounceMs),
    );
  };

  const watcher = chokidar.watch(deskDir(root), {
    ignoreInitial: true,
    ignored: (path: string) => path.endsWith('.tmp') || path.endsWith('.lock'),
  });

  const handle = (kind: 'add' | 'change' | 'unlink') => (path: string): void => {
    const name = basename(path);
    const parent = basename(dirname(path));
    if (name === 'board.yaml' && parent === DESK_DIR) {
      schedule('board.yaml', { type: 'board_changed' });
      return;
    }
    const match = TASK_FILE_RE.exec(name);
    if (!match?.[1] || parent !== 'tasks') return;
    const id = match[1];
    schedule(id, kind === 'unlink' ? { type: 'task_removed', id } : { type: 'task_changed', id });
  };

  watcher.on('add', handle('add')).on('change', handle('change')).on('unlink', handle('unlink'));
  const ready = new Promise<void>((resolve) => {
    watcher.once('ready', () => {
      setTimeout(() => {
        settled = true;
        resolve();
      }, STABILIZE_MS);
    });
  });

  return {
    ready,
    close: async () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      await watcher.close();
    },
  };
}
