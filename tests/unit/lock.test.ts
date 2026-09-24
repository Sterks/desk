import { existsSync } from 'node:fs';
import { readdir, readFile, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeFileAtomic } from '../../src/core/fs-atomic.js';
import { withLock } from '../../src/core/lock.js';
import { lockPath } from '../../src/core/paths.js';
import { catchErrorAsync } from '../helpers/errors.js';
import { makeProject } from '../helpers/project.js';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('withLock', () => {
  it('возвращает результат и снимает lock', async () => {
    const root = await makeProject();
    expect(await withLock(root, async () => 42)).toBe(42);
    expect(existsSync(lockPath(root))).toBe(false);
  });

  it('снимает lock, если fn бросает', async () => {
    const root = await makeProject();
    await expect(withLock(root, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(existsSync(lockPath(root))).toBe(false);
  });

  it('не пускает две критические секции одновременно', async () => {
    const root = await makeProject();
    let inside = 0;
    let maxInside = 0;
    const section = async (): Promise<void> => {
      inside += 1;
      maxInside = Math.max(maxInside, inside);
      await sleep(20);
      inside -= 1;
    };
    await Promise.all(Array.from({ length: 5 }, () => withLock(root, section)));
    expect(maxInside).toBe(1);
  });

  it('удаляет брошенный lock старше staleMs', async () => {
    const root = await makeProject();
    await writeFile(lockPath(root), '999999\n');
    const old = new Date(Date.now() - 60_000);
    await utimes(lockPath(root), old, old);
    expect(await withLock(root, async () => 'ok', { timeoutMs: 500 })).toBe('ok');
  });

  it('LOCK_TIMEOUT, если свежий lock не отпускают', async () => {
    const root = await makeProject();
    await writeFile(lockPath(root), '999999\n');
    const err = await catchErrorAsync(() => withLock(root, async () => 'never', { timeoutMs: 100 }));
    expect(err.code).toBe('LOCK_TIMEOUT');
  });
});

describe('writeFileAtomic', () => {
  it('пишет файл и не оставляет .tmp', async () => {
    const root = await makeProject();
    const path = join(root, '.desk', 'tasks', 'T-001.md');
    await writeFileAtomic(path, 'hello');
    expect(await readFile(path, 'utf8')).toBe('hello');
    expect(await readdir(join(root, '.desk', 'tasks'))).toEqual(['T-001.md']);
  });
});
