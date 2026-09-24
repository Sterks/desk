import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { loadBoard } from '../../src/core/board-loader.js';
import { createTask, loadAll } from '../../src/core/task-store.js';
import { makeProject } from '../helpers/project.js';

const run = promisify(execFile);
const worker = fileURLToPath(new URL('../helpers/worker.ts', import.meta.url));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const spawnWorkers = (op: string, root: string, count: number): Promise<unknown[]> =>
  Promise.all(
    Array.from({ length: count }, (_, i) =>
      run(process.execPath, ['--import', 'tsx', worker, op, root, String(i + 1)], { cwd: repoRoot }),
    ),
  );

describe('конкурентная запись из разных процессов', () => {
  it('20 параллельных create_task дают 20 уникальных валидных задач', async () => {
    const root = await makeProject();
    await spawnWorkers('create', root, 20);
    const loaded = await loadAll(root, await loadBoard(root));
    expect(loaded).toHaveLength(20);
    expect(new Set(loaded.map((l) => l.id)).size).toBe(20);
    expect(loaded.map((l) => l.id).at(-1)).toBe('T-020');
    expect(loaded.every((l) => l.task !== null && l.errors.length === 0)).toBe(true);
  }, 60_000);

  it('10 параллельных add_note в одну задачу не теряют ни одной заметки', async () => {
    const root = await makeProject();
    await createTask(root, await loadBoard(root), { title: 'Общая' }, 'planner');
    await spawnWorkers('note', root, 10);
    const [only] = await loadAll(root, await loadBoard(root));
    expect(only?.task?.notes).toHaveLength(10);
    expect(new Set(only?.task?.notes.map((n) => n.by)).size).toBe(10);
  }, 60_000);
});
