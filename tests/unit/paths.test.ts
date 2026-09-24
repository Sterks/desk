import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRoot, taskPath } from '../../src/core/paths.js';
import { catchError } from '../helpers/errors.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

describe('findRoot', () => {
  it('находит .desk в текущей папке', async () => {
    const root = await makeProject();
    expect(findRoot(root, {})).toBe(root);
  });

  it('находит .desk из вложенной папки проекта', async () => {
    const root = await makeProject();
    const nested = join(root, 'src', 'deep', 'module');
    await mkdir(nested, { recursive: true });
    expect(findRoot(nested, {})).toBe(root);
  });

  it('DESK_ROOT важнее cwd', async () => {
    const root = await makeProject();
    const other = await makeEmptyDir();
    expect(findRoot(other, { DESK_ROOT: root })).toBe(root);
  });

  it('INVALID_BOARD с подсказкой про desk init, если .desk нет', async () => {
    const dir = await makeEmptyDir();
    const err = catchError(() => findRoot(dir, {}));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain('desk init');
  });

  it('INVALID_BOARD, если DESK_ROOT указывает на папку без .desk', async () => {
    const dir = await makeEmptyDir();
    expect(catchError(() => findRoot(dir, { DESK_ROOT: dir })).code).toBe('INVALID_BOARD');
  });
});

describe('taskPath', () => {
  it('строит путь .desk/tasks/<id>.md', () => {
    expect(taskPath('/p', 'T-001')).toBe(join('/p', '.desk', 'tasks', 'T-001.md'));
  });
});
