import { readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardPath, deskDir, taskPath, tasksDir } from '../../src/core/paths.js';
import { watchDesk, type DeskEvent } from '../../src/core/watch.js';
import { makeProject } from '../helpers/project.js';

const closers: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.all(closers.splice(0).map((close) => close()));
});

async function watch(root: string): Promise<DeskEvent[]> {
  const events: DeskEvent[] = [];
  const watcher = watchDesk(root, (e) => events.push(e));
  closers.push(watcher.close);
  await watcher.ready;
  return events;
}

describe('watchDesk', () => {
  it('task_changed при создании и изменении файла задачи', async () => {
    const root = await makeProject();
    const events = await watch(root);
    await writeFile(taskPath(root, 'T-001'), 'x');
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'task_changed', id: 'T-001' }), { timeout: 3000 });
  });

  it('task_changed сразу после ready, без окна стабилизации', async () => {
    const root = await makeProject();
    const events = await watch(root);
    await writeFile(taskPath(root, 'T-003'), 'x');
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'task_changed', id: 'T-003' }), { timeout: 3000 });
  });

  it('task_removed при удалении', async () => {
    const root = await makeProject();
    await writeFile(taskPath(root, 'T-001'), 'x');
    const events = await watch(root);
    await unlink(taskPath(root, 'T-001'));
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'task_removed', id: 'T-001' }), { timeout: 3000 });
  });

  it('board_changed при правке board.yaml', async () => {
    const root = await makeProject();
    const events = await watch(root);
    await writeFile(boardPath(root), `${await readFile(boardPath(root), 'utf8')}\n`);
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'board_changed' }), { timeout: 3000 });
  });

  it('игнорирует .tmp и .lock, склеивает серию правок одного файла', async () => {
    const root = await makeProject();
    const events = await watch(root);
    await writeFile(`${taskPath(root, 'T-001')}.tmp`, 'x');
    await writeFile(`${root}/.desk/.lock`, '1');
    for (const n of [1, 2, 3]) await writeFile(taskPath(root, 'T-002'), String(n));
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'task_changed', id: 'T-002' }), { timeout: 3000 });
    expect(events).toEqual([{ type: 'task_changed', id: 'T-002' }]);
  });

  it('ready не оставляет пробных файлов и не шлёт о них событий', async () => {
    const root = await makeProject();
    const events = await watch(root);
    expect((await readdir(deskDir(root))).sort()).toEqual(['board.yaml', 'tasks']);
    expect(await readdir(tasksDir(root))).toEqual([]);
    await writeFile(taskPath(root, 'T-004'), 'x');
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'task_changed', id: 'T-004' }), { timeout: 3000 });
    expect(events).toEqual([{ type: 'task_changed', id: 'T-004' }]);
  });

  it('ready разрешается и без папки tasks/', async () => {
    const root = await makeProject();
    await rm(tasksDir(root), { recursive: true });
    const events = await watch(root);
    await writeFile(boardPath(root), `${await readFile(boardPath(root), 'utf8')}\n`);
    await vi.waitFor(() => expect(events).toContainEqual({ type: 'board_changed' }), { timeout: 3000 });
  });
});
