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

export function watchDesk(
  root: string,
  onEvent: (event: DeskEvent) => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): DeskWatcher {
  const timers = new Map<string, NodeJS.Timeout>();
  const schedule = (key: string, event: DeskEvent): void => {
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        onEvent(event);
      }, debounceMs),
    );
  };

  // Момент запуска наблюдения: на macOS fsevents может доставить "исторический"
  // `change` для файла, изменённого непосредственно перед стартом (несмотря на
  // ignoreInitial: true) — отличаем его по stats.mtimeMs < startedAt ниже.
  // performance.timeOrigin + performance.now() даёт эпоху с суб-миллисекундной
  // точностью: Date.now() округляет до целой мс, и файл, записанный в той же
  // миллисекунде, что и старт вотчера, тогда часто ложно не отфильтровывается
  // (mtimeMs с дробной частью оказывается больше усечённого Date.now()).
  const startedAt = performance.timeOrigin + performance.now();
  const watcher = chokidar.watch(deskDir(root), {
    ignoreInitial: true,
    alwaysStat: true,
    ignored: (path: string) => path.endsWith('.tmp') || path.endsWith('.lock'),
  });

  const handle =
    (kind: 'add' | 'change' | 'unlink') =>
    (path: string, stats?: { mtimeMs: number }): void => {
      // Отбрасываем только "исторический" replay change-события (mtime раньше старта
      // наблюдения); add/unlink никогда не отбрасываются — это всегда реальные изменения.
      if (kind === 'change' && stats && stats.mtimeMs < startedAt) return;
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
  const ready = new Promise<void>((resolve) => watcher.once('ready', () => resolve()));

  return {
    ready,
    close: async () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      await watcher.close();
    },
  };
}
