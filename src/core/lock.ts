import { open, stat, unlink } from 'node:fs/promises';
import { DeskError } from './errors.js';
import { lockPath } from './paths.js';

export interface LockOptions {
  retryMs?: number;
  timeoutMs?: number;
  staleMs?: number;
}

const DEFAULT_RETRY_MS = 25;
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_STALE_MS = 30000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const errnoCode = (e: unknown): string | undefined => (e as NodeJS.ErrnoException).code;

export async function withLock<T>(root: string, fn: () => Promise<T>, opts: LockOptions = {}): Promise<T> {
  const retryMs = opts.retryMs ?? DEFAULT_RETRY_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  const path = lockPath(root);
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      const handle = await open(path, 'wx');
      try {
        await handle.writeFile(`${process.pid}\n`);
      } finally {
        await handle.close();
      }
      break;
    } catch (e) {
      if (errnoCode(e) !== 'EEXIST') throw e;
      await removeIfStale(path, staleMs);
      if (Date.now() >= deadline) {
        throw new DeskError(
          'LOCK_TIMEOUT',
          `Не удалось взять ${path} за ${timeoutMs} мс. Если процесс завис, удали файл вручную.`,
        );
      }
      await sleep(retryMs);
    }
  }

  try {
    return await fn();
  } finally {
    await unlink(path).catch((e: unknown) => {
      if (errnoCode(e) !== 'ENOENT') throw e;
    });
  }
}

async function removeIfStale(path: string, staleMs: number): Promise<void> {
  try {
    const info = await stat(path);
    if (Date.now() - info.mtimeMs > staleMs) await unlink(path);
  } catch (e) {
    if (errnoCode(e) !== 'ENOENT') throw e;
  }
}
