import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createBoardHolder } from '../../src/core/board-holder.js';
import { boardPath } from '../../src/core/paths.js';
import { catchError } from '../helpers/errors.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

describe('BoardHolder', () => {
  it('читает доску при создании', async () => {
    const root = await makeProject();
    const holder = await createBoardHolder(root, {});
    expect(holder.root).toBe(root);
    expect(holder.read().name).toBe('test');
    expect(holder.write().name).toBe('test');
  });

  it('без .desk: current null, read и requireRoot бросают INVALID_BOARD', async () => {
    const holder = await createBoardHolder(await makeEmptyDir(), {});
    expect(holder.root).toBeNull();
    expect(holder.current()).toBeNull();
    expect(catchError(() => holder.read()).message).toContain('desk init');
    expect(catchError(() => holder.requireRoot()).code).toBe('INVALID_BOARD');
    expect(await holder.reload()).toBe('invalid');
  });

  it('сломанный board.yaml: чтение по старой доске, запись запрещена', async () => {
    const root = await makeProject();
    const holder = await createBoardHolder(root, {});
    await writeFile(boardPath(root), 'version: 1\ncolumns: [\n');
    expect(await holder.reload()).toBe('invalid');
    expect(holder.read().name).toBe('test');
    expect(catchError(() => holder.write()).code).toBe('INVALID_BOARD');
  });

  it('changed и unchanged', async () => {
    const root = await makeProject();
    const holder = await createBoardHolder(root, {});
    expect(await holder.reload()).toBe('unchanged');
    const text = await readFile(boardPath(root), 'utf8');
    await writeFile(boardPath(root), text.replace('name: test', 'name: renamed'));
    expect(await holder.reload()).toBe('changed');
    expect(holder.read().name).toBe('renamed');
  });
});
