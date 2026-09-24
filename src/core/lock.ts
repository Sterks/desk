import { randomUUID } from 'node:crypto';
import { open, readFile, stat, unlink } from 'node:fs/promises';
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
  const token = `${process.pid}:${randomUUID()}`;

  for (;;) {
    try {
      await acquire(path, token);
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
    await release(path, token);
  }
}

/** Создаёт lock-файл эксклюзивно и записывает токен владельца. Если запись не удалась после успешного open, чистит файл и пробрасывает ошибку. */
async function acquire(path: string, token: string): Promise<void> {
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${token}\n`);
  } catch (e) {
    await handle.close();
    await unlink(path).catch((e2: unknown) => {
      if (errnoCode(e2) !== 'ENOENT') throw e2;
    });
    throw e;
  }
  await handle.close();
}

/** Снимает lock, только если он всё ещё содержит наш токен — иначе его уже забрал другой владелец после stale-takeover, и трогать его нельзя. */
async function release(path: string, token: string): Promise<void> {
  let content: string;
  try {
    content = await readFile(path, 'utf8');
  } catch (e) {
    if (errnoCode(e) !== 'ENOENT') throw e;
    return;
  }
  if (content !== `${token}\n`) return;
  await unlink(path).catch((e: unknown) => {
    if (errnoCode(e) !== 'ENOENT') throw e;
  });
}

// Держатель, работающий дольше staleMs, может пересечься с "вором", забравшим lock как брошенный —
// это допустимо: спецификация (4.4) требует удалять lock старше staleMs как брошенный,
// а критические секции desk рассчитаны на миллисекунды, так что такое пересечение — крайний случай.
async function removeIfStale(path: string, staleMs: number): Promise<void> {
  try {
    const info = await stat(path);
    if (Date.now() - info.mtimeMs > staleMs) await unlink(path);
  } catch (e) {
    if (errnoCode(e) !== 'ENOENT') throw e;
  }
}
