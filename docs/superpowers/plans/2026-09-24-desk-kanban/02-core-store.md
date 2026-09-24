# Часть 2. Ядро: хранилище (задачи 5–8)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: `docs/superpowers/specs/2026-09-24-desk-kanban-design.md`.

---

### Task 5: ID, lock-файл, атомарная запись

**Files:**
- Create: `src/core/ids.ts`, `src/core/lock.ts`, `src/core/fs-atomic.ts`
- Test: `tests/unit/ids.test.ts`, `tests/unit/lock.test.ts`

**Interfaces:**
- Consumes: `DeskError` (Task 1), `lockPath` (Task 1)
- Produces:
  - `idNumber(id: string): number | null`
  - `nextId(prefix: string, existing: readonly string[]): string`
  - `findDuplicateIds(ids: readonly string[]): string[][]` — группы ID с одинаковым префиксом и номером (`T-7` и `T-007`)
  - `withLock<T>(root: string, fn: () => Promise<T>, opts?: { retryMs?: number; timeoutMs?: number; staleMs?: number }): Promise<T>`
  - `writeFileAtomic(path: string, content: string): Promise<void>`

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/ids.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { findDuplicateIds, idNumber, nextId } from '../../src/core/ids.js';

describe('nextId', () => {
  it.each([
    [[], 'T-001'],
    [['T-001', 'T-009'], 'T-010'],
    [['T-999'], 'T-1000'],
    [['X-050', 'T-002'], 'T-003'],
    [['T-005', 'T-002'], 'T-006'],
  ])('%j → %s', (existing, expected) => {
    expect(nextId('T', existing)).toBe(expected);
  });
});

describe('idNumber', () => {
  it('разбирает номер', () => expect(idNumber('T-042')).toBe(42));
  it('null для не-ID', () => expect(idNumber('readme')).toBeNull());
});

describe('findDuplicateIds', () => {
  it('группирует ID с одинаковым номером', () => {
    expect(findDuplicateIds(['T-7', 'T-007', 'T-008', 'X-7'])).toEqual([['T-007', 'T-7']]);
  });
  it('пусто без дубликатов', () => expect(findDuplicateIds(['T-001', 'T-002'])).toEqual([]));
});
```

`tests/unit/lock.test.ts`:
```ts
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
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/ids.test.ts tests/unit/lock.test.ts`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать**

`src/core/ids.ts`:
```ts
const ID_RE = /^([A-Za-z]+)-(\d+)$/;

export function idNumber(id: string): number | null {
  const match = ID_RE.exec(id);
  return match ? Number(match[2]) : null;
}

export function nextId(prefix: string, existing: readonly string[]): string {
  const max = existing
    .filter((id) => id.startsWith(`${prefix}-`))
    .reduce((acc, id) => Math.max(acc, idNumber(id) ?? 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function findDuplicateIds(ids: readonly string[]): string[][] {
  const groups = ids.reduce((acc, id) => {
    const match = ID_RE.exec(id);
    if (!match) return acc;
    const key = `${match[1]}-${Number(match[2])}`;
    return new Map(acc).set(key, [...(acc.get(key) ?? []), id]);
  }, new Map<string, string[]>());
  return [...groups.values()].filter((g) => g.length > 1).map((g) => [...g].sort());
}
```

`src/core/fs-atomic.ts`:
```ts
import { rename, writeFile } from 'node:fs/promises';

/** Пишет во временный файл и переименовывает: читатель видит либо старую, либо новую версию. Вызывать под withLock. */
export async function writeFileAtomic(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, path);
}
```

`src/core/lock.ts`:
```ts
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
```

- [ ] **Step 4: Запустить тесты**

Run: `npx vitest run tests/unit/ids.test.ts tests/unit/lock.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/ids.ts src/core/lock.ts src/core/fs-atomic.ts tests/unit/ids.test.ts tests/unit/lock.test.ts
git commit -m "feat: add task id allocation, lock file and atomic writes"
```

---

### Task 6: Правила переходов

**Files:**
- Create: `src/core/transitions.ts`
- Test: `tests/unit/transitions.test.ts`

**Interfaces:**
- Consumes: `applyChanges`, `isEmptyValue`, `fieldDef`, `ASSIGNEE_GUIDE`, `ValidationContext` (Task 2); `DeskError`, `Board`, `Task` (Task 1)
- Produces:
  - `allowedTargets(board: Board, from: string): string[]` — если колонки `from` нет в доске, разрешены все колонки
  - `requiredForTransition(board: Board, from: string, to: string): string[]`
  - `checkWip(board: Board, tasks: readonly Task[], taskId: string, columnId: string): void` — бросает `WIP_LIMIT`
  - `interface MoveInput { to: string; changes: Record<string, unknown>; actor: string; now: string }`
  - `planMove(board: Board, tasks: readonly Task[], task: Task, input: MoveInput, ctx: ValidationContext): Task` — порядок проверок по спеке 4.2; при `to === task.column` и пустых `changes` возвращает тот же объект `task`

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/transitions.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { allowedTargets, checkWip, planMove, requiredForTransition } from '../../src/core/transitions.js';
import { testBoard, testTask } from '../helpers/board.js';
import { catchError } from '../helpers/errors.js';

const board = testBoard();
const ctx = { taskExists: () => true };
const NOW = '2026-09-24T12:00:00Z';
const move = (to: string, changes: Record<string, unknown> = {}) => ({ to, changes, actor: 'backend-agent', now: NOW });

describe('allowedTargets', () => {
  it('по секции transitions', () => {
    expect(allowedTargets(board, 'backlog')).toEqual(['in_progress']);
    expect(allowedTargets(board, 'review')).toEqual(['in_progress', 'done']);
    expect(allowedTargets(board, 'done')).toEqual([]);
  });
  it('без секции transitions — все остальные колонки', () => {
    expect(allowedTargets(testBoard({ transitions: null }), 'backlog')).toEqual(['in_progress', 'review', 'done']);
  });
  it('из удалённой колонки — все колонки', () => {
    expect(allowedTargets(board, 'archived')).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });
});

describe('requiredForTransition', () => {
  it('собирает requires', () => {
    expect(requiredForTransition(board, 'backlog', 'in_progress')).toEqual(['assignee']);
    expect(requiredForTransition(board, 'review', 'done')).toEqual([]);
    expect(requiredForTransition(testBoard({ transitions: null }), 'backlog', 'done')).toEqual([]);
  });
});

describe('planMove', () => {
  it('NOT_FOUND для несуществующей колонки', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('nowhere'), ctx));
    expect(err.code).toBe('NOT_FOUND');
    expect(err.details.allowed).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });

  it('TRANSITION_FORBIDDEN со списком разрешённых и guide текущей колонки', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('done'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_FORBIDDEN', allowed: ['in_progress'], guide: 'Новые задачи.' });
  });

  it('запрет перехода проверяется раньше значений полей', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('done', { estimate: -1 }), ctx));
    expect(err.code).toBe('TRANSITION_FORBIDDEN');
  });

  it('TRANSITION_REQUIRES, если нет assignee', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('in_progress'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_REQUIRES', field: 'assignee' });
    expect(err.details.guide).toContain('агента');
  });

  it('TRANSITION_REQUIRES несёт guide пользовательского поля', () => {
    const task = testTask({ column: 'in_progress', assignee: 'a' });
    const err = catchError(() => planMove(board, [], task, move('review'), ctx));
    expect(err.toJSON()).toMatchObject({ field: 'pr_url', guide: 'Ссылка на PR.' });
  });

  it('fields в том же вызове закрывают requires; история пополняется; исходник не меняется', () => {
    const task = testTask();
    const next = planMove(board, [task], task, move('in_progress', { assignee: 'backend-agent' }), ctx);
    expect(next.column).toBe('in_progress');
    expect(next.assignee).toBe('backend-agent');
    expect(next.updatedAt).toBe(NOW);
    expect(next.history.at(-1)).toEqual({ at: NOW, by: 'backend-agent', from: 'backlog', to: 'in_progress' });
    expect(task.column).toBe('backlog');
    expect(task.history).toHaveLength(1);
  });

  it('ошибка значения в fields после проверки перехода', () => {
    const err = catchError(() => planMove(board, [], testTask(), move('in_progress', { assignee: 'a', estimate: -1 }), ctx));
    expect(err.code).toBe('INVALID_VALUE');
  });

  it('WIP_LIMIT, если колонка заполнена', () => {
    const busy = [
      testTask({ id: 'T-002', column: 'in_progress' }),
      testTask({ id: 'T-003', column: 'in_progress' }),
    ];
    const task = testTask({ assignee: 'a' });
    const err = catchError(() => planMove(board, [...busy, task], task, move('in_progress'), ctx));
    expect(err.toJSON()).toMatchObject({ code: 'WIP_LIMIT', guide: 'В работе.' });
    expect(err.message).toContain('2 из 2');
  });

  it('та же колонка без changes — тот же объект', () => {
    const task = testTask();
    expect(planMove(board, [task], task, move('backlog'), ctx)).toBe(task);
  });

  it('та же колонка с changes — обновление без записи в history', () => {
    const task = testTask();
    const next = planMove(board, [task], task, move('backlog', { estimate: 3 }), ctx);
    expect(next.fields.estimate).toBe(3);
    expect(next.history).toHaveLength(1);
    expect(next.updatedAt).toBe(NOW);
  });

  it('задачу из удалённой колонки можно перенести в любую', () => {
    const task = testTask({ column: 'archived' });
    expect(planMove(board, [task], task, move('done'), ctx).column).toBe('done');
  });
});

describe('checkWip', () => {
  it('не считает саму задачу', () => {
    const tasks = [testTask({ id: 'T-002', column: 'in_progress' }), testTask({ id: 'T-003', column: 'in_progress' })];
    expect(() => checkWip(board, tasks, 'T-002', 'in_progress')).not.toThrow();
  });
  it('колонка без лимита не ограничена', () => {
    expect(() => checkWip(board, [testTask({ column: 'done' })], 'T-009', 'done')).not.toThrow();
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/transitions.test.ts`
Expected: FAIL — модуль `transitions.js` не найден.

- [ ] **Step 3: Реализовать `src/core/transitions.ts`**

```ts
import { DeskError } from './errors.js';
import type { Board, Task } from './types.js';
import { ASSIGNEE_GUIDE, applyChanges, fieldDef, isEmptyValue, type ValidationContext } from './validate.js';

export interface MoveInput {
  to: string;
  changes: Record<string, unknown>;
  actor: string;
  now: string;
}

export function allowedTargets(board: Board, from: string): string[] {
  const known = board.columns.some((c) => c.id === from);
  const others = board.columns.map((c) => c.id).filter((id) => id !== from);
  if (board.transitions === null || !known) return others;
  const targets = new Set(board.transitions.filter((t) => t.from === from).flatMap((t) => t.to));
  return others.filter((id) => targets.has(id));
}

export function requiredForTransition(board: Board, from: string, to: string): string[] {
  if (board.transitions === null) return [];
  const required = board.transitions.filter((t) => t.from === from && t.to.includes(to)).flatMap((t) => t.requires);
  return [...new Set(required)];
}

export function checkWip(board: Board, tasks: readonly Task[], taskId: string, columnId: string): void {
  const column = board.columns.find((c) => c.id === columnId);
  if (column?.wipLimit === undefined) return;
  const count = tasks.filter((t) => t.column === columnId && t.id !== taskId).length;
  if (count >= column.wipLimit) {
    throw new DeskError('WIP_LIMIT', `В колонке ${columnId} уже ${count} из ${column.wipLimit} задач`, {
      field: 'column',
      guide: column.guide,
    });
  }
}

export function planMove(
  board: Board,
  tasks: readonly Task[],
  task: Task,
  input: MoveInput,
  ctx: ValidationContext,
): Task {
  const columnIds = board.columns.map((c) => c.id);
  if (!columnIds.includes(input.to)) {
    throw new DeskError('NOT_FOUND', `Колонка ${input.to} не существует`, { field: 'column', allowed: columnIds });
  }

  if (task.column === input.to) {
    if (Object.keys(input.changes).length === 0) return task;
    return { ...applyChanges(board, task, input.changes, ctx), updatedAt: input.now };
  }

  const allowed = allowedTargets(board, task.column);
  if (!allowed.includes(input.to)) {
    throw new DeskError(
      'TRANSITION_FORBIDDEN',
      `Переход ${task.column} → ${input.to} запрещён. Разрешены: ${allowed.join(', ') || 'нет переходов'}`,
      { field: 'column', guide: board.columns.find((c) => c.id === task.column)?.guide, allowed },
    );
  }

  const changed = applyChanges(board, task, input.changes, ctx);
  for (const required of requiredForTransition(board, task.column, input.to)) {
    const value = required === 'assignee' ? changed.assignee : changed.fields[required];
    if (isEmptyValue(value)) {
      throw new DeskError('TRANSITION_REQUIRES', `Переход ${task.column} → ${input.to} требует поле ${required}`, {
        field: required,
        guide: required === 'assignee' ? ASSIGNEE_GUIDE : fieldDef(board, required)?.guide,
      });
    }
  }

  checkWip(board, tasks, task.id, input.to);

  return {
    ...changed,
    column: input.to,
    updatedAt: input.now,
    history: [...changed.history, { at: input.now, by: input.actor, from: task.column, to: input.to }],
  };
}
```

- [ ] **Step 4: Запустить тесты**

Run: `npx vitest run tests/unit/transitions.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/transitions.ts tests/unit/transitions.test.ts
git commit -m "feat: enforce column transitions, requires and WIP limits"
```

---

### Task 7: Хранилище задач, фильтры, представление

**Files:**
- Create: `src/core/query.ts`, `src/core/present.ts`, `src/core/task-store.ts`
- Test: `tests/unit/query.test.ts`, `tests/unit/present.test.ts`, `tests/integration/task-store.test.ts`

**Interfaces:**
- Consumes: всё из Tasks 1–6: `parseTaskFile`, `serializeTask`, `nextId`, `findDuplicateIds`, `idNumber`, `withLock`, `writeFileAtomic`, `planMove`, `checkWip`, `applyChanges`, `applyDefaults`, `assertTaskValid`, `validateTask`, `checkActor`, `checkTitle`, `checkText`, `tasksDir`, `taskPath`, `TASK_FILE_RE`
- Produces:
  - `query.ts`: `interface TaskFilter { column?: string; assignee?: string; query?: string; where?: Record<string, unknown>; limit?: number }`; `sortTasks(board, tasks): Task[]`; `filterTasks(tasks, filter): Task[]` (без `limit`)
  - `present.ts`: `presentBoard(board, tasks): BoardJson`; `presentListItem(task, errors): TaskListItemJson`; `presentTask(task, errors): TaskJson`; `presentLoaded(loaded): TaskJson | UnreadableTaskJson`; `presentTaskList(board, loaded, filter): TaskListJson` — `{ tasks, invalid_files, duplicate_ids, total }`
  - `task-store.ts`: `loadAll(root, board): Promise<LoadedTask[]>`; `readableTasks(loaded): Task[]`; `contextFor(loaded): ValidationContext`; `getTask(root, board, id): Promise<LoadedTask>`; `createTask(root, board, input: CreateInput, actor, clock?)`; `updateTask(root, board, id, input: UpdateInput, actor, clock?)`; `moveTask(root, board, id, to, fields, actor, clock?)`; `addNote(root, board, id, text, actor, clock?)` — все мутации возвращают `Promise<Task>`; `isoNow(clock): string`
  - `interface CreateInput { title: unknown; description?: unknown; column?: string; fields?: Record<string, unknown> }`, `interface UpdateInput { title?: unknown; description?: unknown; fields?: Record<string, unknown> }`

- [ ] **Step 1: Написать падающие тесты для query и present**

`tests/unit/query.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { filterTasks, sortTasks } from '../../src/core/query.js';
import { testBoard, testTask } from '../helpers/board.js';

const board = testBoard();
const tasks = [
  testTask({ id: 'T-001', title: 'Низкий', fields: { priority: 'p3' }, createdAt: '2026-09-24T09:00:00Z' }),
  testTask({ id: 'T-002', title: 'Пожар', fields: { priority: 'p0', area: ['backend', 'frontend'] }, createdAt: '2026-09-24T11:00:00Z', assignee: 'a' }),
  testTask({ id: 'T-003', title: 'Обычный', fields: { priority: 'p2' }, column: 'done', description: 'Про Логин' }),
  testTask({ id: 'T-004', title: 'Тоже пожар', fields: { priority: 'p0' }, createdAt: '2026-09-24T08:00:00Z' }),
  testTask({ id: 'T-005', title: 'Без приоритета', fields: {} }),
];

describe('sortTasks', () => {
  it('по priority, затем по created_at, без приоритета в конце', () => {
    expect(sortTasks(board, tasks).map((t) => t.id)).toEqual(['T-004', 'T-002', 'T-003', 'T-001', 'T-005']);
  });
  it('без поля priority — по created_at', () => {
    const plain = testBoard({ fields: [] });
    expect(sortTasks(plain, tasks).map((t) => t.id)[0]).toBe('T-004');
  });
});

describe('filterTasks', () => {
  it('column', () => expect(filterTasks(tasks, { column: 'done' }).map((t) => t.id)).toEqual(['T-003']));
  it('assignee', () => expect(filterTasks(tasks, { assignee: 'a' }).map((t) => t.id)).toEqual(['T-002']));
  it('query без учёта регистра по title и описанию', () => {
    expect(filterTasks(tasks, { query: 'пожар' }).map((t) => t.id)).toEqual(['T-002', 'T-004']);
    expect(filterTasks(tasks, { query: 'логин' }).map((t) => t.id)).toEqual(['T-003']);
  });
  it('where: точное совпадение и вхождение для массива', () => {
    expect(filterTasks(tasks, { where: { priority: 'p0' } }).map((t) => t.id)).toEqual(['T-002', 'T-004']);
    expect(filterTasks(tasks, { where: { area: 'frontend' } }).map((t) => t.id)).toEqual(['T-002']);
    expect(filterTasks(tasks, { where: { assignee: 'a' } }).map((t) => t.id)).toEqual(['T-002']);
  });
});
```

`tests/unit/present.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { presentBoard, presentLoaded, presentTaskList } from '../../src/core/present.js';
import { testBoard, testTask } from '../helpers/board.js';

const board = testBoard();

describe('presentBoard', () => {
  it('колонки со счётчиками, поля и переходы в snake_case', () => {
    const json = presentBoard(board, [testTask(), testTask({ id: 'T-002' }), testTask({ id: 'T-003', column: 'done' })]);
    expect(json.guide).toBe('Общие правила.');
    expect(json.columns[0]).toEqual({ id: 'backlog', title: 'Backlog', guide: 'Новые задачи.', wip_limit: null, count: 2 });
    expect(json.columns[1]).toMatchObject({ id: 'in_progress', wip_limit: 2, count: 0 });
    expect(json.fields[0]).toEqual({
      id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'],
      default: 'p2', min: null, max: null, guide: 'p0 — прод лежит.',
    });
    expect(json.transitions?.[0]).toEqual({ from: 'backlog', to: ['in_progress'], requires: ['assignee'] });
  });
});

describe('presentTaskList', () => {
  it('сортирует, считает total до limit, выносит нечитаемые файлы и помечает invalid', () => {
    const loaded = [
      { id: 'T-001', task: testTask({ fields: { priority: 'p3' } }), errors: [] },
      { id: 'T-002', task: testTask({ id: 'T-002', fields: { priority: 'p0' } }), errors: ['Поле x не объявлено'] },
      { id: 'T-003', task: null, errors: ['нет frontmatter'] },
    ];
    const list = presentTaskList(board, loaded, { limit: 1 });
    expect(list.total).toBe(2);
    expect(list.tasks).toHaveLength(1);
    expect(list.tasks[0]).toMatchObject({ id: 'T-002', invalid: true, errors: ['Поле x не объявлено'], assignee: null });
    expect(list.invalid_files).toEqual([{ id: 'T-003', errors: ['нет frontmatter'] }]);
    expect(list.duplicate_ids).toEqual([]);
  });
});

describe('presentLoaded', () => {
  it('полная задача', () => {
    const json = presentLoaded({ id: 'T-001', task: testTask({ description: 'D' }), errors: [] });
    expect(json).toMatchObject({ id: 'T-001', description: 'D', created_by: 'planner', invalid: false, history: [{ to: 'backlog' }] });
  });
  it('нечитаемая задача', () => {
    expect(presentLoaded({ id: 'T-009', task: null, errors: ['e'] })).toEqual({ id: 'T-009', unreadable: true, invalid: true, errors: ['e'] });
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/query.test.ts tests/unit/present.test.ts`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать `src/core/query.ts` и `src/core/present.ts`**

`src/core/query.ts`:
```ts
import type { Board, Task } from './types.js';

export interface TaskFilter {
  column?: string;
  assignee?: string;
  query?: string;
  where?: Record<string, unknown>;
  limit?: number;
}

export function sortTasks(board: Board, tasks: readonly Task[]): Task[] {
  const priority = board.fields.find((f) => f.id === 'priority' && f.type === 'enum');
  const values = priority?.values ?? [];
  const rank = (task: Task): number => {
    if (!priority) return 0;
    const index = values.indexOf(String(task.fields.priority));
    return index === -1 ? values.length : index;
  };
  return [...tasks].sort(
    (a, b) => rank(a) - rank(b) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

function matchesWhere(task: Task, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = key === 'assignee' ? task.assignee : task.fields[key];
    return Array.isArray(actual) ? actual.includes(expected as string) : actual === expected;
  });
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  const query = filter.query?.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (filter.column === undefined || task.column === filter.column) &&
      (filter.assignee === undefined || task.assignee === filter.assignee) &&
      (!query || task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)) &&
      (filter.where === undefined || matchesWhere(task, filter.where)),
  );
}
```

`src/core/present.ts`:
```ts
import { findDuplicateIds } from './ids.js';
import { filterTasks, sortTasks, type TaskFilter } from './query.js';
import type { Board, FieldType, FieldValue, HistoryEntry, LoadedTask, Note, Task } from './types.js';

export interface BoardJson {
  name: string;
  guide: string | null;
  columns: { id: string; title: string; guide: string | null; wip_limit: number | null; count: number }[];
  fields: {
    id: string;
    type: FieldType;
    required: boolean;
    values: string[] | null;
    default: FieldValue | null;
    min: number | null;
    max: number | null;
    guide: string | null;
  }[];
  transitions: { from: string; to: string[]; requires: string[] }[] | null;
}

export interface TaskListItemJson {
  id: string;
  title: string;
  column: string;
  assignee: string | null;
  fields: Record<string, FieldValue>;
  created_at: string;
  invalid: boolean;
  errors: string[];
}

export interface TaskJson extends TaskListItemJson {
  created_by: string;
  updated_at: string;
  description: string;
  notes: Note[];
  history: HistoryEntry[];
}

export interface UnreadableTaskJson {
  id: string;
  unreadable: true;
  invalid: true;
  errors: string[];
}

export interface TaskListJson {
  tasks: TaskListItemJson[];
  invalid_files: { id: string; errors: string[] }[];
  duplicate_ids: string[][];
  total: number;
}

export function presentBoard(board: Board, tasks: readonly Task[]): BoardJson {
  return {
    name: board.name,
    guide: board.guide ?? null,
    columns: board.columns.map((c) => ({
      id: c.id,
      title: c.title,
      guide: c.guide ?? null,
      wip_limit: c.wipLimit ?? null,
      count: tasks.filter((t) => t.column === c.id).length,
    })),
    fields: board.fields.map((f) => ({
      id: f.id,
      type: f.type,
      required: f.required,
      values: f.values ?? null,
      default: f.default ?? null,
      min: f.min ?? null,
      max: f.max ?? null,
      guide: f.guide ?? null,
    })),
    transitions: board.transitions?.map((t) => ({ from: t.from, to: t.to, requires: t.requires })) ?? null,
  };
}

export function presentListItem(task: Task, errors: readonly string[]): TaskListItemJson {
  return {
    id: task.id,
    title: task.title,
    column: task.column,
    assignee: task.assignee ?? null,
    fields: task.fields,
    created_at: task.createdAt,
    invalid: errors.length > 0,
    errors: [...errors],
  };
}

export function presentTask(task: Task, errors: readonly string[]): TaskJson {
  return {
    ...presentListItem(task, errors),
    created_by: task.createdBy,
    updated_at: task.updatedAt,
    description: task.description,
    notes: task.notes,
    history: task.history,
  };
}

export function presentLoaded(loaded: LoadedTask): TaskJson | UnreadableTaskJson {
  if (loaded.task === null) return { id: loaded.id, unreadable: true, invalid: true, errors: loaded.errors };
  return presentTask(loaded.task, loaded.errors);
}

export function presentTaskList(board: Board, loaded: readonly LoadedTask[], filter: TaskFilter): TaskListJson {
  const errorsById = new Map(loaded.map((l) => [l.id, l.errors]));
  const readable = loaded.flatMap((l) => (l.task ? [l.task] : []));
  const matched = filterTasks(sortTasks(board, readable), filter);
  const limited = filter.limit === undefined ? matched : matched.slice(0, filter.limit);
  return {
    tasks: limited.map((t) => presentListItem(t, errorsById.get(t.id) ?? [])),
    invalid_files: loaded.filter((l) => l.task === null).map((l) => ({ id: l.id, errors: l.errors })),
    duplicate_ids: findDuplicateIds(loaded.map((l) => l.id)),
    total: matched.length,
  };
}
```

- [ ] **Step 4: Запустить unit-тесты**

Run: `npx vitest run tests/unit/query.test.ts tests/unit/present.test.ts`
Expected: PASS.

- [ ] **Step 5: Написать падающий тест хранилища**

`tests/integration/task-store.test.ts`:
```ts
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadBoard } from '../../src/core/board-loader.js';
import { taskPath } from '../../src/core/paths.js';
import { addNote, createTask, getTask, loadAll, moveTask, updateTask } from '../../src/core/task-store.js';
import type { Board } from '../../src/core/types.js';
import { catchErrorAsync } from '../helpers/errors.js';
import { fixedClock, makeProject } from '../helpers/project.js';

let root: string;
let board: Board;
const clock = fixedClock('2026-09-24T10:00:00.123Z');
const later = fixedClock('2026-09-24T11:30:00Z');

beforeEach(async () => {
  root = await makeProject();
  board = await loadBoard(root);
});

describe('createTask', () => {
  it('создаёт T-001 в первой колонке с default и историей', async () => {
    const task = await createTask(root, board, { title: 'Первая' }, 'planner', clock);
    expect(task).toMatchObject({
      id: 'T-001', column: 'backlog', createdBy: 'planner', createdAt: '2026-09-24T10:00:00Z',
      fields: { priority: 'p2' },
      history: [{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'backlog' }],
    });
    expect(existsSync(taskPath(root, 'T-001'))).toBe(true);
  });

  it('следующий ID — T-002', async () => {
    await createTask(root, board, { title: 'A' }, 'planner', clock);
    expect((await createTask(root, board, { title: 'B' }, 'planner', clock)).id).toBe('T-002');
  });

  it('в не первую колонку — по правилам перехода из первой, одна запись history', async () => {
    const task = await createTask(root, board, { title: 'Сразу в работу', column: 'in_progress', fields: { assignee: 'dev' } }, 'planner', clock);
    expect(task.column).toBe('in_progress');
    expect(task.history).toEqual([{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'in_progress' }]);
  });

  it('запрещённая колонка — ошибка и файл не создан', async () => {
    const err = await catchErrorAsync(() => createTask(root, board, { title: 'X', column: 'done' }, 'planner', clock));
    expect(err.code).toBe('TRANSITION_FORBIDDEN');
    expect(await readdir(join(root, '.desk', 'tasks'))).toEqual([]);
  });

  it('WIP первой колонки проверяется при создании', async () => {
    const tight = await makeProject('version: 1\ncolumns:\n  - id: todo\n    wip_limit: 1\n');
    const tightBoard = await loadBoard(tight);
    await createTask(tight, tightBoard, { title: 'A' }, 'p', clock);
    expect((await catchErrorAsync(() => createTask(tight, tightBoard, { title: 'B' }, 'p', clock))).code).toBe('WIP_LIMIT');
  });

  it('ошибки ввода до записи', async () => {
    expect((await catchErrorAsync(() => createTask(root, board, { title: '' }, 'p', clock))).code).toBe('INVALID_VALUE');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X' }, '', clock))).code).toBe('BAD_REQUEST');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', description: 5 }, 'p', clock))).code).toBe('BAD_REQUEST');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', fields: { priority: 'p9' } }, 'p', clock))).code).toBe('INVALID_VALUE');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'X', fields: { priority: null } }, 'p', clock))).code).toBe('REQUIRED_MISSING');
    expect(await readdir(join(root, '.desk', 'tasks'))).toEqual([]);
  });

  it('task_ref на существующую задачу', async () => {
    await createTask(root, board, { title: 'A' }, 'p', clock);
    const b = await createTask(root, board, { title: 'B', fields: { blocked_by: 'T-001' } }, 'p', clock);
    expect(b.fields.blocked_by).toBe('T-001');
    expect((await catchErrorAsync(() => createTask(root, board, { title: 'C', fields: { blocked_by: 'T-099' } }, 'p', clock))).code).toBe('INVALID_VALUE');
  });
});

describe('updateTask, moveTask, addNote', () => {
  beforeEach(async () => {
    await createTask(root, board, { title: 'Задача', description: 'Старое' }, 'planner', clock);
  });

  it('updateTask меняет title, описание, поля и updated_at', async () => {
    const task = await updateTask(root, board, 'T-001', { title: 'Новое имя', description: 'Новое', fields: { estimate: 4 } }, 'dev', later);
    expect(task).toMatchObject({ title: 'Новое имя', description: 'Новое', updatedAt: '2026-09-24T11:30:00Z', fields: { priority: 'p2', estimate: 4 } });
    expect((await getTask(root, board, 'T-001')).task).toEqual(task);
  });

  it('NOT_FOUND для неизвестного ID', async () => {
    expect((await catchErrorAsync(() => updateTask(root, board, 'T-404', { title: 'X' }, 'dev', later))).code).toBe('NOT_FOUND');
    expect((await catchErrorAsync(() => getTask(root, board, 'T-404'))).code).toBe('NOT_FOUND');
  });

  it('moveTask пишет переход в history файла', async () => {
    await moveTask(root, board, 'T-001', 'in_progress', { assignee: 'dev' }, 'dev', later);
    const text = await readFile(taskPath(root, 'T-001'), 'utf8');
    expect(text).toContain('column: in_progress');
    expect(text).toContain('from: backlog');
  });

  it('moveTask в ту же колонку без полей не трогает файл', async () => {
    const before = await readFile(taskPath(root, 'T-001'), 'utf8');
    await moveTask(root, board, 'T-001', 'backlog', {}, 'dev', later);
    expect(await readFile(taskPath(root, 'T-001'), 'utf8')).toBe(before);
  });

  it('addNote схлопывает переносы и пишет автора', async () => {
    const task = await addNote(root, board, 'T-001', 'первая строка\nвторая строка', 'qa', later);
    expect(task.notes).toEqual([{ at: '2026-09-24T11:30:00Z', by: 'qa', text: 'первая строка вторая строка' }]);
    expect((await catchErrorAsync(() => addNote(root, board, 'T-001', '   ', 'qa', later))).code).toBe('BAD_REQUEST');
  });
});

describe('невалидные файлы', () => {
  it('loadAll помечает ошибки схемы, не падая', async () => {
    await createTask(root, board, { title: 'Ok' }, 'p', clock);
    await writeFile(taskPath(root, 'T-002'), '---\nid: T-002\ntitle: X\ncolumn: archived\ncreated_by: p\ncreated_at: x\nupdated_at: x\npriority: p2\nhistory: []\n---\n');
    await writeFile(taskPath(root, 'T-003'), 'мусор');
    await writeFile(join(root, '.desk', 'tasks', 'README.txt'), 'не задача');
    const loaded = await loadAll(root, board);
    expect(loaded.map((l) => l.id)).toEqual(['T-001', 'T-002', 'T-003']);
    expect(loaded[0]?.errors).toEqual([]);
    expect(loaded[1]?.errors.join()).toContain('archived');
    expect(loaded[2]?.task).toBeNull();
  });

  it('мутация нечитаемого файла — BAD_REQUEST', async () => {
    await writeFile(taskPath(root, 'T-001'), 'мусор');
    expect((await catchErrorAsync(() => updateTask(root, board, 'T-001', { title: 'X' }, 'p', later))).code).toBe('BAD_REQUEST');
  });

  it('поле удалили из board.yaml — update с null чистит задачу', async () => {
    await createTask(root, board, { title: 'A', fields: { summary: 'итог' } }, 'p', clock);
    const withoutSummary = { ...board, fields: board.fields.filter((f) => f.id !== 'summary') };
    const blocked = await catchErrorAsync(() => updateTask(root, withoutSummary, 'T-001', { title: 'B' }, 'p', later));
    expect(blocked.code).toBe('UNKNOWN_FIELD');
    const fixed = await updateTask(root, withoutSummary, 'T-001', { fields: { summary: null } }, 'p', later);
    expect(fixed.fields).toEqual({ priority: 'p2' });
  });
});
```

- [ ] **Step 6: Запустить и убедиться, что падает**

Run: `npx vitest run tests/integration/task-store.test.ts`
Expected: FAIL — модуль `task-store.js` не найден.

- [ ] **Step 7: Реализовать `src/core/task-store.ts`**

```ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DeskError } from './errors.js';
import { writeFileAtomic } from './fs-atomic.js';
import { idNumber, nextId } from './ids.js';
import { withLock } from './lock.js';
import { TASK_FILE_RE, taskPath, tasksDir } from './paths.js';
import { parseTaskFile, serializeTask } from './task-file.js';
import { checkWip, planMove } from './transitions.js';
import type { Board, Clock, LoadedTask, Task } from './types.js';
import {
  applyChanges,
  applyDefaults,
  assertTaskValid,
  checkActor,
  checkText,
  checkTitle,
  validateTask,
  type ValidationContext,
} from './validate.js';

export interface CreateInput {
  title: unknown;
  description?: unknown;
  column?: string;
  fields?: Record<string, unknown>;
}

export interface UpdateInput {
  title?: unknown;
  description?: unknown;
  fields?: Record<string, unknown>;
}

const MAX_NOTE = 2000;
const systemClock: Clock = () => new Date();

export function isoNow(clock: Clock): string {
  return clock().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export async function loadAll(root: string, board: Board): Promise<LoadedTask[]> {
  let names: string[];
  try {
    names = await readdir(tasksDir(root));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const ids = names.flatMap((name) => {
    const match = TASK_FILE_RE.exec(name);
    return match?.[1] ? [match[1]] : [];
  });
  const parsed = await Promise.all(
    ids.map(async (id) => ({ id, ...parseTaskFile(await readFile(taskPath(root, id), 'utf8'), id) })),
  );
  const ctx = contextFor(parsed);
  return parsed
    .map(({ id, task, errors }) => ({
      id,
      task,
      errors: task ? [...errors, ...validateTask(board, task, ctx).map((e) => e.message)] : errors,
    }))
    .sort((a, b) => (idNumber(a.id) ?? 0) - (idNumber(b.id) ?? 0) || a.id.localeCompare(b.id));
}

export function readableTasks(loaded: readonly LoadedTask[]): Task[] {
  return loaded.flatMap((l) => (l.task ? [l.task] : []));
}

export function contextFor(loaded: readonly { id: string }[]): ValidationContext {
  const ids = new Set(loaded.map((l) => l.id));
  return { taskExists: (id) => ids.has(id) };
}

export async function getTask(root: string, board: Board, id: string): Promise<LoadedTask> {
  const found = (await loadAll(root, board)).find((l) => l.id === id);
  if (!found) throw new DeskError('NOT_FOUND', `Задача ${id} не найдена`, { field: 'id' });
  return found;
}

export async function createTask(
  root: string,
  board: Board,
  input: CreateInput,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  const title = checkTitle(input.title);
  const description = checkText(input.description ?? '', 'description').trim();
  const firstColumn = board.columns[0]?.id ?? '';
  const target = input.column ?? firstColumn;

  return withLock(root, async () => {
    const loaded = await loadAll(root, board);
    const tasks = readableTasks(loaded);
    const ctx = contextFor(loaded);
    const now = isoNow(clock);
    const id = nextId(board.idPrefix, loaded.map((l) => l.id));
    const draft: Task = {
      id,
      title,
      column: firstColumn,
      createdBy: actor,
      createdAt: now,
      updatedAt: now,
      fields: applyDefaults(board, {}),
      history: [],
      description,
      notes: [],
    };
    const withFields = applyChanges(board, draft, input.fields ?? {}, ctx);
    if (target === firstColumn) checkWip(board, tasks, id, firstColumn);
    const placed = target === firstColumn ? withFields : planMove(board, tasks, withFields, { to: target, changes: {}, actor, now }, ctx);
    const task: Task = { ...placed, history: [{ at: now, by: actor, from: null, to: placed.column }] };
    assertTaskValid(board, task, ctx);
    await writeFileAtomic(taskPath(root, id), serializeTask(task));
    return task;
  });
}

type Mutation = (task: Task, tasks: readonly Task[], ctx: ValidationContext, now: string) => Task;

async function mutate(root: string, board: Board, id: string, clock: Clock, fn: Mutation): Promise<Task> {
  return withLock(root, async () => {
    const loaded = await loadAll(root, board);
    const entry = loaded.find((l) => l.id === id);
    if (!entry) throw new DeskError('NOT_FOUND', `Задача ${id} не найдена`, { field: 'id' });
    if (!entry.task) {
      throw new DeskError('BAD_REQUEST', `Файл задачи ${id} не читается: ${entry.errors.join('; ')}. Исправь файл вручную.`);
    }
    const ctx = contextFor(loaded);
    const next = fn(entry.task, readableTasks(loaded), ctx, isoNow(clock));
    if (next === entry.task) return next;
    assertTaskValid(board, next, ctx);
    await writeFileAtomic(taskPath(root, id), serializeTask(next));
    return next;
  });
}

export async function updateTask(
  root: string,
  board: Board,
  id: string,
  input: UpdateInput,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  checkActor(actorRaw);
  const title = input.title === undefined ? undefined : checkTitle(input.title);
  const description = input.description === undefined ? undefined : checkText(input.description, 'description').trim();
  return mutate(root, board, id, clock, (task, _tasks, ctx, now) => ({
    ...applyChanges(board, task, input.fields ?? {}, ctx),
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    updatedAt: now,
  }));
}

export async function moveTask(
  root: string,
  board: Board,
  id: string,
  to: string,
  fields: Record<string, unknown>,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  return mutate(root, board, id, clock, (task, tasks, ctx, now) =>
    planMove(board, tasks, task, { to, changes: fields, actor, now }, ctx),
  );
}

export async function addNote(
  root: string,
  board: Board,
  id: string,
  textRaw: unknown,
  actorRaw: unknown,
  clock: Clock = systemClock,
): Promise<Task> {
  const actor = checkActor(actorRaw);
  const text = checkText(textRaw, 'text').replace(/\s+/g, ' ').trim();
  if (text === '' || text.length > MAX_NOTE) {
    throw new DeskError('BAD_REQUEST', `text: заметка 1–${MAX_NOTE} символов`);
  }
  return mutate(root, board, id, clock, (task, _tasks, _ctx, now) => ({
    ...task,
    updatedAt: now,
    notes: [...task.notes, { at: now, by: actor, text }],
  }));
}
```

- [ ] **Step 8: Запустить тесты**

Run: `npx vitest run tests/unit tests/integration/task-store.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/core/query.ts src/core/present.ts src/core/task-store.ts tests/unit/query.test.ts tests/unit/present.test.ts tests/integration/task-store.test.ts
git commit -m "feat: add file-backed task store with filtering and JSON presentation"
```

---

### Task 8: Тесты конкурентности

**Files:**
- Create: `tests/helpers/worker.ts`
- Test: `tests/integration/concurrency.test.ts`

**Interfaces:**
- Consumes: `loadBoard` (Task 3), `createTask`, `addNote`, `loadAll` (Task 7)
- Produces: — (только тесты; падение здесь означает баг в `lock.ts` или `task-store.ts`, чинить там)

- [ ] **Step 1: Написать воркер**

`tests/helpers/worker.ts` (запускается отдельным процессом через `node --import tsx`):
```ts
import { loadBoard } from '../../src/core/board-loader.js';
import { addNote, createTask } from '../../src/core/task-store.js';

const [op, root, n] = process.argv.slice(2);
if (!op || !root || !n) throw new Error('usage: worker.ts <create|note> <root> <n>');

const board = await loadBoard(root);
if (op === 'create') {
  await createTask(root, board, { title: `Задача ${n}` }, `worker-${n}`);
} else if (op === 'note') {
  await addNote(root, board, 'T-001', `заметка ${n}`, `worker-${n}`);
} else {
  throw new Error(`неизвестная операция ${op}`);
}
```

- [ ] **Step 2: Написать тест**

`tests/integration/concurrency.test.ts`:
```ts
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
```

- [ ] **Step 3: Запустить**

Run: `npx vitest run tests/integration/concurrency.test.ts`
Expected: PASS. Если тест даёт меньше 20 задач или дубликаты — это баг: проверь, что `nextId` и запись идут внутри одного `withLock`, а не до него.

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/worker.ts tests/integration/concurrency.test.ts
git commit -m "test: cover concurrent task writes across processes"
```
