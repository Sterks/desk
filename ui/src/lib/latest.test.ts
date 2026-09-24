import { describe, expect, it } from 'vitest';
import { createLatestGuard } from './latest';

/** Промис, который тест разрешает вручную — порядок ответов задаётся явно. */
function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('createLatestGuard', () => {
  it('поздний ответ старого запроса не перезаписывает ответ нового', async () => {
    const guard = createLatestGuard();
    let applied: string | null = null;
    const load = async (response: Promise<string>): Promise<void> => {
      const isLatest = guard.begin();
      const value = await response;
      if (isLatest()) applied = value;
    };
    const older = deferred<string>();
    const newer = deferred<string>();
    const first = load(older.promise);
    const second = load(newer.promise);
    newer.resolve('v2');
    await second;
    older.resolve('v1');
    await first;
    expect(applied).toBe('v2');
  });

  it('invalidate() отбрасывает запрос, начатый до записи', async () => {
    const guard = createLatestGuard();
    const isLatest = guard.begin();
    guard.invalidate();
    expect(isLatest()).toBe(false);
    expect(guard.begin()()).toBe(true);
  });

  it('единственный запрос применяется', () => {
    const guard = createLatestGuard();
    expect(guard.begin()()).toBe(true);
  });
});
