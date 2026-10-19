import { stat, utimes } from 'node:fs/promises';
import { afterEach, expect, it, vi } from 'vitest';
import { boardPath } from '../../src/core/paths.js';
import { watchDesk, type DeskEvent } from '../../src/core/watch.js';
import { makeProject } from '../helpers/project.js';

type Handler = (path: string, stats?: { mtimeMs: number }) => void;
const handlers = vi.hoisted(() => new Map<string, Handler>());

vi.mock('chokidar', () => ({
  default: {
    watch: () => ({
      on(event: string, handler: Handler) {
        handlers.set(event, handler);
        return this;
      },
      once() { return this; },
      off() { return this; },
      close: async () => {},
    }),
  },
}));

afterEach(() => {
  handlers.clear();
  vi.useRealTimers();
});

it('ignores an initial board replay even when its mtime is ahead of the process clock', async () => {
  const root = await makeProject();
  const path = boardPath(root);
  const future = new Date(Date.now() + 60_000);
  await utimes(path, future, future);
  const initialMtime = (await stat(path)).mtimeMs;
  const events: DeskEvent[] = [];
  vi.useFakeTimers();
  const watcher = watchDesk(root, (event) => events.push(event), 0);

  try {
    const change = handlers.get('change');
    expect(change).toBeDefined();
    change?.(path, { mtimeMs: initialMtime });
    await vi.runAllTimersAsync();
    expect(events).toEqual([]);

    change?.(path, { mtimeMs: initialMtime + 1 });
    await vi.runAllTimersAsync();
    expect(events).toEqual([{ type: 'board_changed' }]);
  } finally {
    await watcher.close();
  }
});
