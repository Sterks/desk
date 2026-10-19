import { randomUUID } from 'node:crypto';
import { statSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { DESK_DIR, TASK_FILE_RE, boardPath, deskDir, tasksDir } from './paths.js';

export type DeskEvent =
  | { type: 'task_changed'; id: string }
  | { type: 'task_removed'; id: string }
  | { type: 'board_changed' };

export interface DeskWatcher {
  ready: Promise<void>;
  close(): Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 50;
/** Как часто переписывать пробный файл, пока наблюдатель его не увидит. */
const PROBE_INTERVAL_MS = 50;
/** Предел ожидания пробы: дальше `ready` разрешается как есть, чтобы не зависнуть навсегда. */
const PROBE_TIMEOUT_MS = 5000;
/**
 * Chokidar 4 глушит (без повторной доставки) повторный `change` того же пути в течение
 * 50 мс после предыдущего. Отфильтрованный нами replay тоже занимает это окно, и реальная
 * правка сразу после `ready` терялась бы, поэтому `ready` ждёт конца окна после replay —
 * с двукратным запасом: окно отсчитывается в chokidar чуть раньше, чем replay доходит до нас.
 * Значение взято из chokidar 4.0.3 (`_throttle(EV.CHANGE, path, 50)` в `_emit`); версия
 * закреплена в package.json без `^` — при обновлении chokidar перепроверь эту константу.
 */
const CHOKIDAR_CHANGE_THROTTLE_MS = 50;
const REPLAY_QUIET_MS = 2 * CHOKIDAR_CHANGE_THROTTLE_MS;

const isScratch = (path: string): boolean => path.endsWith('.tmp') || path.endsWith('.lock');

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

  // Пробные файлы (по одному на наблюдаемую папку) подтверждают, что наблюдение
  // реально запущено; см. confirmLive. Имя `*.tmp` — для остальных наблюдателей это мусор.
  const probeName = `.watch-probe-${randomUUID()}.tmp`;
  const probes = new Set([join(deskDir(root), probeName), join(tasksDir(root), probeName)]);

  // Момент запуска наблюдения: на macOS fsevents может доставить "исторический"
  // `change` для файла, изменённого непосредственно перед стартом (несмотря на
  // ignoreInitial: true) — отличаем его по stats.mtimeMs < startedAt ниже.
  // performance.timeOrigin + performance.now() даёт эпоху с суб-миллисекундной
  // точностью: Date.now() округляет до целой мс, и файл, записанный в той же
  // миллисекунде, что и старт вотчера, тогда часто ложно не отфильтровывается
  // (mtimeMs с дробной частью оказывается больше усечённого Date.now()).
  const startedAt = performance.timeOrigin + performance.now();
  // Сравнение с часами процесса недостаточно, когда mtime файла чуть впереди
  // вычисленного startedAt (например, на GitHub macOS runner). Запоминаем mtime
  // уже существующей доски, чтобы её стартовый replay не выглядел новой правкой.
  let initialBoardMtimeMs: number | undefined;
  try {
    initialBoardMtimeMs = statSync(boardPath(root)).mtimeMs;
  } catch {
    // Доска может отсутствовать или быть недоступной; watcher всё равно стартует.
  }
  let lastReplayAt = Number.NEGATIVE_INFINITY;
  const watcher = chokidar.watch(deskDir(root), {
    ignoreInitial: true,
    alwaysStat: true,
    ignored: (path: string) => isScratch(path) && !probes.has(path),
  });

  const handle =
    (kind: 'add' | 'change' | 'unlink') =>
    (path: string, stats?: { mtimeMs: number }): void => {
      if (probes.has(path)) return;
      const name = basename(path);
      const parent = basename(dirname(path));
      const isBoard = name === 'board.yaml' && parent === DESK_DIR;
      // Отбрасываем только "исторический" replay change-события (mtime раньше старта
      // наблюдения); add/unlink никогда не отбрасываются — это всегда реальные изменения.
      if (kind === 'change' && stats &&
          (stats.mtimeMs < startedAt || (isBoard && stats.mtimeMs === initialBoardMtimeMs))) {
        lastReplayAt = performance.now();
        return;
      }
      if (isBoard) {
        schedule('board.yaml', { type: 'board_changed' });
        return;
      }
      const match = TASK_FILE_RE.exec(name);
      if (!match?.[1] || parent !== 'tasks') return;
      const id = match[1];
      schedule(id, kind === 'unlink' ? { type: 'task_removed', id } : { type: 'task_changed', id });
    };

  watcher.on('add', handle('add')).on('change', handle('change')).on('unlink', handle('unlink'));
  const probe = confirmLive(watcher, probes, () => lastReplayAt + REPLAY_QUIET_MS);
  // Проба стартует по `ready` chokidar либо сразу при close() до него (тогда только уборка),
  // так что `ready` разрешается всегда, и close() может дождаться удаления проб.
  const started = new Promise<void>((resolve) => {
    watcher.once('ready', () => resolve());
    probe.onStop(resolve);
  });
  const ready = started.then(probe.run);

  return {
    ready,
    close: async () => {
      probe.stop();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      await ready;
      await watcher.close();
    },
  };
}

/**
 * Chokidar сообщает `ready` после обхода папок, но на macOS нативный поток FSEvents
 * (libuv запускает его асинхронно в отдельном потоке) в этот момент может ещё не
 * работать, и изменения сразу после `ready` теряются навсегда — особенно под нагрузкой.
 * Поэтому `ready` ждёт, пока наблюдатель увидит запись пробного файла в каждой
 * наблюдаемой папке (запись повторяется, пока событие не придёт), затем пробы удаляются.
 * Папку, куда записать не удалось (нет `tasks/`, только чтение), проверить нечем — пропускаем.
 * Replay приходит раньше пробы (он старше в том же потоке событий), так что после пробы
 * остаётся лишь дождаться `quietAt()` — конца окна троттлинга chokidar после replay.
 */
function confirmLive(
  watcher: FSWatcher,
  probes: ReadonlySet<string>,
  quietAt: () => number,
): { run: () => Promise<void>; stop: () => void; onStop: (fn: () => void) => void } {
  const pending = new Set(probes);
  let wake: () => void = () => {};
  let stopped = false;
  const stopListeners: (() => void)[] = [];
  const onProbeEvent = (_event: string, path: string): void => {
    if (pending.delete(path) && pending.size === 0) wake();
  };
  watcher.on('all', onProbeEvent);

  /** Пауза, которую прерывают и пришедшая проба, и stop(). */
  const pause = (ms: number): Promise<void> =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      wake = () => {
        clearTimeout(timer);
        resolve();
      };
    });

  const writeProbes = async (): Promise<void> => {
    const deadline = performance.now() + PROBE_TIMEOUT_MS;
    for (let attempt = 0; pending.size > 0 && !stopped && performance.now() < deadline; attempt++) {
      // Не удалось записать (нет папки, только чтение) — эту папку проверить нечем, пропускаем.
      await Promise.all(
        [...pending].map((path) => writeFile(path, String(attempt)).catch(() => pending.delete(path))),
      );
      if (pending.size > 0 && !stopped) await pause(PROBE_INTERVAL_MS);
    }
  };

  const removeProbes = async (): Promise<void> => {
    const results = await Promise.allSettled([...probes].map((path) => rm(path, { force: true })));
    for (const result of results) {
      if (result.status === 'rejected') {
        process.stderr.write(`desk watch: не удалось удалить пробный файл: ${String(result.reason)}\n`);
      }
    }
  };

  const run = async (): Promise<void> => {
    await writeProbes();
    watcher.off('all', onProbeEvent);
    await removeProbes();
    // Цикл, а не один таймер: setTimeout в Node может сработать на ~1 мс раньше срока.
    while (!stopped && performance.now() < quietAt()) await pause(quietAt() - performance.now() + 1);
  };

  return {
    run,
    stop: () => {
      stopped = true;
      wake();
      stopListeners.splice(0).forEach((fn) => fn());
    },
    onStop: (fn) => {
      stopListeners.push(fn);
    },
  };
}
