import { DeskError } from '../../src/core/errors.js';

export function catchError(fn: () => unknown): DeskError {
  try {
    fn();
  } catch (e) {
    if (e instanceof DeskError) return e;
    throw e;
  }
  throw new Error('Ожидалась DeskError, но функция завершилась без ошибки');
}

export async function catchErrorAsync(fn: () => Promise<unknown>): Promise<DeskError> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof DeskError) return e;
    throw e;
  }
  throw new Error('Ожидалась DeskError, но функция завершилась без ошибки');
}
