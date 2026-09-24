# Часть 6. UI: drag-and-drop и E2E (задачи 16–17)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: разделы 6.5 и 9.

---

### Task 16: UI — drag-and-drop и окно `requires`

**Files:**
- Modify (заменить целиком): `ui/src/board/Board.tsx`, `ui/src/board/Column.tsx`, `ui/src/board/TaskCard.tsx`, `ui/src/App.tsx`
- Create: `ui/src/task-panel/RequiresDialog.tsx`

**Interfaces:**
- Consumes: `allowedTargets`, `missingForMove`, `groupByColumn`, `isEmptyValue` (Task 14); `ColumnFrame`, `DropState`, `TaskCardView` (Task 14); `Modal`, `FieldRow`, `fieldInfo`, `compactFields`, `Draft` (Task 15); `api.move`, `FieldChanges`, `errorMessage`
- Produces:
  - `Board({ board, tasks, onOpen, onMove(task: TaskItem, to: string) })`
  - `Column({ column, tasks, board, dropState, onOpen })` — droppable с `id = column.id`
  - `TaskCard({ task, board, onOpen })` — draggable с `id = task.id`
  - `RequiresDialog({ board, task, to, missing, onCancel, onSubmit(fields: FieldChanges): Promise<void> })`

Логику переходов проверяют unit-тесты Task 14 (`transitions.test.ts`), поведение перетаскивания — E2E в Task 17. Здесь TDD-цикл через E2E был бы слишком медленным, поэтому шаг проверки — ручной прогон и сборка; Task 17 закрепляет поведение тестами.

- [ ] **Step 1: Заменить `TaskCard.tsx`**

```tsx
import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityTone } from '../lib/priority';

export interface TaskCardProps {
  task: TaskItem;
  board: BoardInfo;
  onOpen(id: string): void;
}

export function TaskCardView({ task, board, onOpen, lifted = false }: TaskCardProps & { lifted?: boolean }) {
  const tone = priorityTone(board, task.fields.priority);
  const priority = task.fields.priority;
  return (
    <article
      className="card"
      data-testid={`card-${task.id}`}
      data-tone={tone ?? undefined}
      data-invalid={task.invalid || undefined}
      data-lifted={lifted || undefined}
    >
      <header className="card-head">
        <span className="card-id">{task.id}</span>
        {task.invalid && (
          <span className="card-flag" title={task.errors.join('\n')}>
            ошибка схемы
          </span>
        )}
      </header>
      <button type="button" className="card-title" onClick={() => onOpen(task.id)}>
        {task.title}
      </button>
      <footer className="card-meta">
        {typeof priority === 'string' && (
          <span className="badge" data-tone={tone ?? undefined}>
            {priority}
          </span>
        )}
        {task.assignee && (
          <span className="assignee" style={{ '--agent-color': agentColor(task.assignee) } as CSSProperties}>
            {task.assignee}
          </span>
        )}
      </footer>
    </article>
  );
}

export function TaskCard({ task, board, onOpen }: TaskCardProps) {
  // role group, а не button по умолчанию: внутри есть кнопка названия, а вложенные интерактивные роли axe считает ошибкой.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    attributes: { role: 'group', roleDescription: 'перетаскиваемая задача' },
  });
  return (
    <div
      ref={setNodeRef}
      className="draggable"
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-label={`${task.id}: ${task.title}`}
    >
      <TaskCardView task={task} board={board} onOpen={onOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Заменить `Column.tsx`**

```tsx
import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import { TaskCard } from './TaskCard';

export type DropState = 'idle' | 'origin' | 'allowed' | 'blocked' | 'over';

export interface ColumnFrameProps {
  column: ColumnInfo;
  dropState: DropState;
  setNodeRef?: (element: HTMLElement | null) => void;
  children: ReactNode;
}

export function ColumnFrame({ column, dropState, setNodeRef, children }: ColumnFrameProps) {
  const limit = column.wip_limit;
  const limitState = limit === null ? undefined : column.count > limit ? 'over' : column.count >= limit ? 'full' : undefined;
  return (
    <section ref={setNodeRef} className="column" aria-label={column.title} data-drop={dropState} data-limit={limitState}>
      <header className="column-head">
        <h2 className="column-title">{column.title}</h2>
        <span className="column-count" title={limit === null ? 'Задач в колонке' : 'Задач / WIP-лимит'}>
          {limit === null ? column.count : `${column.count}/${limit}`}
        </span>
      </header>
      {column.guide && <p className="column-guide">{column.guide}</p>}
      <div className="column-body">{children}</div>
    </section>
  );
}

export interface ColumnProps {
  column: ColumnInfo;
  tasks: TaskItem[];
  board: BoardInfo;
  dropState: DropState;
  onOpen(id: string): void;
}

export function Column({ column, tasks, board, dropState, onOpen }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const state: DropState = isOver && dropState === 'allowed' ? 'over' : dropState;
  return (
    <ColumnFrame column={column} dropState={state} setNodeRef={setNodeRef}>
      {tasks.length === 0 ? (
        <p className="column-empty">пусто</p>
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} board={board} onOpen={onOpen} />)
      )}
    </ColumnFrame>
  );
}
```

- [ ] **Step 3: Заменить `Board.tsx`**

```tsx
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { BoardInfo, TaskItem } from '../api/types';
import { allowedTargets, groupByColumn } from '../lib/transitions';
import { Column, type DropState } from './Column';
import { TaskCardView } from './TaskCard';

export interface BoardProps {
  board: BoardInfo;
  tasks: TaskItem[];
  onOpen(id: string): void;
  onMove(task: TaskItem, to: string): void;
}

const DRAG_ACTIVATION_PX = 5;
// Enter оставлен кнопке названия (открыть панель); перетаскивание с клавиатуры — Пробел.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space'] };

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

const announcements: Announcements = {
  onDragStart: ({ active }) => `Взята задача ${active.id}`,
  onDragOver: ({ active, over }) => (over ? `Задача ${active.id} над колонкой ${over.id}` : `Задача ${active.id} вне колонок`),
  onDragEnd: ({ active, over }) => (over ? `Задача ${active.id} отпущена в колонку ${over.id}` : `Задача ${active.id} отпущена вне колонок`),
  onDragCancel: ({ active }) => `Перенос задачи ${active.id} отменён`,
};

const accessibility = {
  announcements,
  screenReaderInstructions: { draggable: 'Пробел — взять задачу, стрелки — двигать, Пробел — отпустить, Escape — отмена.' },
};

export function Board({ board, tasks, onOpen, onMove }: BoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_PX } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES }),
  );
  const [active, setActive] = useState<TaskItem | null>(null);
  const byColumn = groupByColumn(board, tasks);
  const allowed = active ? new Set(allowedTargets(board, active.column)) : null;

  const dropStateFor = (columnId: string): DropState => {
    if (!active || !allowed) return 'idle';
    if (columnId === active.column) return 'origin';
    return allowed.has(columnId) ? 'allowed' : 'blocked';
  };

  const handleStart = ({ active: dragged }: DragStartEvent): void => {
    setActive(tasks.find((t) => t.id === dragged.id) ?? null);
  };

  const handleEnd = ({ over }: DragEndEvent): void => {
    const task = active;
    setActive(null);
    // Запрещённую колонку тоже отдаём серверу: его ответ с причиной покажет toast, карточка останется на месте.
    if (task && over && typeof over.id === 'string' && over.id !== task.column) onMove(task, over.id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={accessibility}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="board">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={byColumn.get(column.id) ?? []}
            board={board}
            dropState={dropStateFor(column.id)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <TaskCardView task={active} board={board} onOpen={() => undefined} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 4: Написать `RequiresDialog.tsx`**

```tsx
import { useState } from 'react';
import { errorMessage, type FieldChanges } from '../api/client';
import type { BoardInfo, TaskItem } from '../api/types';
import { compactFields, fieldInfo, type Draft } from '../lib/fields';
import { isEmptyValue } from '../lib/transitions';
import { Modal } from '../ui/Modal';
import { FieldRow } from './FieldInput';

export interface RequiresDialogProps {
  board: BoardInfo;
  task: TaskItem;
  to: string;
  missing: string[];
  onCancel(): void;
  onSubmit(fields: FieldChanges): Promise<void>;
}

export function RequiresDialog({ board, task, to, missing, onCancel, onSubmit }: RequiresDialogProps) {
  const [values, setValues] = useState<Draft>(() => Object.fromEntries(missing.map((id) => [id, null])));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = board.columns.find((c) => c.id === to)?.title ?? to;
  const complete = missing.every((id) => !isEmptyValue(values[id]));

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit(compactFields(values));
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${task.id} → ${target}`}
      description="Этот переход требует заполнить поля."
      onClose={onCancel}
      onSubmit={() => void submit()}
      footer={
        <>
          <button type="button" className="button" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={!complete || saving}>
            Перенести
          </button>
        </>
      }
    >
      {missing.map((id) => {
        const def = fieldInfo(board, id);
        return def ? (
          <FieldRow key={id} def={def} value={values[id] ?? undefined} onChange={(v) => setValues((prev) => ({ ...prev, [id]: v }))} />
        ) : null;
      })}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
```

- [ ] **Step 5: Заменить `App.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { api, errorMessage, type FieldChanges } from './api/client';
import type { TaskItem } from './api/types';
import { Board } from './board/Board';
import { FilterBar } from './filters/FilterBar';
import { useBoardData } from './hooks/useBoardData';
import { useUrlFilters } from './hooks/useUrlFilters';
import { applyFilters } from './lib/filters';
import { missingForMove } from './lib/transitions';
import { CreateTaskDialog } from './task-panel/CreateTaskDialog';
import { RequiresDialog } from './task-panel/RequiresDialog';
import { TaskPanel } from './task-panel/TaskPanel';
import { Banners } from './ui/Banners';
import { ToastStack, useToasts } from './ui/Toast';

interface PendingMove {
  task: TaskItem;
  to: string;
  missing: string[];
}

export function App() {
  const { board, list, error, version, refresh } = useBoardData();
  const [filters, setFilters] = useUrlFilters();
  const { items: toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const [creating, setCreating] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const openTask = useCallback((id: string) => setFilters({ task: id }), [setFilters]);
  const closeTask = useCallback(() => setFilters({ task: null }), [setFilters]);

  const performMove = useCallback(
    async (id: string, to: string, fields: FieldChanges) => {
      await api.move(id, to, fields);
      await refresh();
    },
    [refresh],
  );

  const handleMove = useCallback(
    (task: TaskItem, to: string) => {
      if (!board) return;
      const missing = missingForMove(board, task, to);
      if (missing.length > 0) {
        setPendingMove({ task, to, missing });
        return;
      }
      performMove(task.id, to, {}).catch((e: unknown) => pushToast(errorMessage(e)));
    },
    [board, performMove, pushToast],
  );

  if (!board || !list) return <main className="app-state">{error ?? 'Загрузка доски…'}</main>;
  const visible = applyFilters(list.tasks, filters);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-mark" aria-hidden="true">▦</span>
          <h1>{board.name}</h1>
        </div>
        <FilterBar board={board} tasks={list.tasks} filters={filters} onChange={setFilters} onCreate={() => setCreating(true)} />
      </header>
      <Banners board={board} list={list} error={error} onOpen={openTask} />
      <main className="app-main">
        <Board board={board} tasks={visible} onOpen={openTask} onMove={handleMove} />
      </main>
      {filters.task && <TaskPanel board={board} taskId={filters.task} version={version} onClose={closeTask} onError={pushToast} />}
      {creating && (
        <CreateTaskDialog
          board={board}
          onClose={() => setCreating(false)}
          onCreated={(task) => {
            setCreating(false);
            void refresh();
            openTask(task.id);
          }}
        />
      )}
      {pendingMove && (
        <RequiresDialog
          board={board}
          task={pendingMove.task}
          to={pendingMove.to}
          missing={pendingMove.missing}
          onCancel={() => setPendingMove(null)}
          onSubmit={async (fields) => {
            await performMove(pendingMove.task.id, pendingMove.to, fields);
            setPendingMove(null);
          }}
        />
      )}
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
```

- [ ] **Step 6: Проверить сборку и руками**

Run: `npx vitest run ui/src/lib && npm run typecheck && npm run build`
Expected: PASS. Запусти `desk ui` в демо-проекте и проверь: при перетаскивании запрещённые колонки тускнеют; бросок в In progress без assignee открывает окно с полем `assignee`; бросок в Done из Backlog возвращает карточку и показывает toast «Переход backlog → done запрещён…».

- [ ] **Step 7: Commit**

```bash
git add ui
git commit -m "feat: add drag-and-drop with transition hints and requires dialog"
```

---

### Task 17: E2E, визуальная регрессия, доступность, кросс-браузер

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/start-server.mjs`, `tests/e2e/fixtures.ts`, `tests/e2e/board.spec.ts`, `tests/e2e/visual.spec.ts`
- Create (генерируются): `tests/e2e/visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: собранный `dist/` (Task 13–16), шаблон доски `BOARD_TEMPLATE` (колонки Backlog / In progress (WIP 3) / Review / Done; `backlog → in_progress` требует `assignee`; `area` — enum `backend, frontend, infra, docs`)
- Produces: E2E-набор `npm run test:e2e`

- [ ] **Step 1: Установить Playwright и axe**

Run:
```bash
npm install -D @playwright/test@^1 @axe-core/playwright@^4
npx playwright install chromium firefox webkit
```

- [ ] **Step 2: Написать конфиг и запуск сервера**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = 4799;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/e2e/start-server.mjs',
    url: `http://127.0.0.1:${PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

`tests/e2e/start-server.mjs`:
```js
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./.tmp-project/', import.meta.url));
const cli = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
// Без глобального git-конфига actor детерминирован: human.
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };

rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });

const init = spawnSync(process.execPath, [cli, 'init'], { cwd: root, stdio: 'inherit', env });
if (init.status !== 0) process.exit(init.status ?? 1);

const server = spawn(process.execPath, [cli, 'ui', '--port', '4799'], { cwd: root, stdio: 'inherit', env });
const stop = () => server.kill('SIGTERM');
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
server.on('exit', (code) => process.exit(code ?? 0));
```

- [ ] **Step 3: Написать фикстуры**

`tests/e2e/fixtures.ts`:
```ts
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';

export const PROJECT_ROOT = fileURLToPath(new URL('./.tmp-project/', import.meta.url));
const TASKS_DIR = join(PROJECT_ROOT, '.desk', 'tasks');

export interface SeedTask {
  id: string;
  title: string;
  column: string;
  priority?: string;
  assignee?: string;
  area?: string;
  createdAt?: string;
}

export function taskMarkdown(task: SeedTask): string {
  const at = task.createdAt ?? '2026-09-24T10:00:00Z';
  return [
    '---',
    `id: ${task.id}`,
    `title: ${task.title}`,
    `column: ${task.column}`,
    ...(task.assignee ? [`assignee: ${task.assignee}`] : []),
    'created_by: seed',
    `created_at: ${at}`,
    `updated_at: ${at}`,
    `priority: ${task.priority ?? 'p2'}`,
    ...(task.area ? [`area: ${task.area}`] : []),
    'history:',
    `  - { at: ${at}, by: seed, from: null, to: ${task.column} }`,
    '---',
    '',
  ].join('\n');
}

export async function seed(tasks: SeedTask[]): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
  const existing = (await readdir(TASKS_DIR)).filter((name) => name.endsWith('.md'));
  await Promise.all(existing.map((name) => rm(join(TASKS_DIR, name))));
  await Promise.all(tasks.map((task) => writeFile(join(TASKS_DIR, `${task.id}.md`), taskMarkdown(task))));
}

export const writeTask = (task: SeedTask): Promise<void> => writeFile(join(TASKS_DIR, `${task.id}.md`), taskMarkdown(task));
export const readTask = (id: string): Promise<string> => readFile(join(TASKS_DIR, `${id}.md`), 'utf8');

export const column = (page: Page, title: string): Locator => page.getByRole('region', { name: title, exact: true });
export const card = (page: Page, id: string): Locator => page.locator('.board').getByTestId(`card-${id}`);

export async function openBoard(page: Page, tasks: SeedTask[]): Promise<void> {
  await seed(tasks);
  await page.goto('/');
  for (const task of tasks) await expect(card(page, task.id)).toBeVisible();
}

/** Перетаскивание мышью по шагам: dnd-kit стартует после 5px движения. */
export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Нет boundingBox у источника или цели перетаскивания');
  const startX = from.x + from.width / 2;
  const startY = from.y + 12;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 10, startY + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 20 });
  await page.mouse.up();
}
```

- [ ] **Step 4: Написать функциональные E2E-тесты**

`tests/e2e/board.spec.ts`:
```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { card, column, dragTo, openBoard, readTask, writeTask } from './fixtures';

test.describe.configure({ mode: 'serial' });

test('доска показывает колонки из board.yaml и карточки в них', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Первая', column: 'backlog', priority: 'p0' },
    { id: 'T-002', title: 'В работе', column: 'in_progress', assignee: 'backend-agent' },
  ]);
  for (const title of ['Backlog', 'In progress', 'Review', 'Done']) await expect(column(page, title)).toBeVisible();
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-002')).toContainText('backend-agent');
  await expect(column(page, 'In progress')).toContainText('1/3');
});

test('перенос без assignee открывает окно requires и записывает поле в файл', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Нужен исполнитель', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  const dialog = page.getByRole('dialog', { name: 'T-001 → In progress' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('assignee').fill('e2e-agent');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect.poll(() => readTask('T-001')).toContain('assignee: e2e-agent');
});

test('запрещённый переход: карточка остаётся, toast объясняет причину', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Сразу в Done нельзя', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'Done'));
  await expect(page.getByRole('status')).toContainText('запрещён');
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
});

test('WIP-лимит: четвёртая задача не попадает в In progress', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'A', column: 'in_progress', assignee: 'a' },
    { id: 'T-002', title: 'B', column: 'in_progress', assignee: 'b' },
    { id: 'T-003', title: 'C', column: 'in_progress', assignee: 'c' },
    { id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' },
  ]);
  await dragTo(page, card(page, 'T-004'), column(page, 'In progress'));
  await expect(page.getByRole('status')).toContainText('3 из 3');
  await expect(column(page, 'Backlog').getByTestId('card-T-004')).toBeVisible();
});

test('задача, которую агент записал в файл, появляется без перезагрузки', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Есть', column: 'backlog' }]);
  await writeTask({ id: 'T-050', title: 'Создал агент', column: 'backlog', assignee: 'planner' });
  await expect(card(page, 'T-050')).toBeVisible();
});

test('поиск фильтрует карточки и переживает перезагрузку через URL', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Rate limit на логин', column: 'backlog' },
    { id: 'T-002', title: 'Кнопка экспорта', column: 'backlog' },
  ]);
  await page.getByRole('searchbox', { name: 'Поиск по ID и названию' }).fill('логин');
  await expect(card(page, 'T-002')).toBeHidden();
  await expect(page).toHaveURL(/q=/);
  await page.reload();
  await expect(card(page, 'T-001')).toBeVisible();
  await expect(card(page, 'T-002')).toBeHidden();
  await expect(page.getByRole('searchbox', { name: 'Поиск по ID и названию' })).toHaveValue('логин');
});

test('панель: правка названия сохраняется в файл', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Старое название', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Старое название' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Название').fill('Новое название');
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  await expect.poll(() => readTask('T-001')).toContain('title: Новое название');
  await page.keyboard.press('Escape');
  await expect(card(page, 'T-001')).toContainText('Новое название');
});

test('клавиатура: Enter открывает панель, выбор колонки переносит задачу', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'На проверке', column: 'review' }]);
  await card(page, 'T-001').getByRole('button', { name: 'На проверке' }).focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Колонка').selectOption('done');
  await page.keyboard.press('Escape');
  await expect(column(page, 'Done').getByTestId('card-T-001')).toBeVisible();
});

test('axe: нет нарушений доступности на доске', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Пожар', column: 'backlog', priority: 'p0', assignee: 'backend-agent' },
    { id: 'T-002', title: 'Обычная', column: 'in_progress', assignee: 'frontend-agent' },
  ]);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

- [ ] **Step 5: Написать визуальные тесты**

`tests/e2e/visual.spec.ts`:
```ts
import { expect, test } from '@playwright/test';
import { openBoard, type SeedTask } from './fixtures';

const VISUAL_TASKS: SeedTask[] = [
  { id: 'T-001', title: 'Прод отвечает 502 на /api/login', column: 'in_progress', priority: 'p0', assignee: 'backend-agent', area: 'backend' },
  { id: 'T-002', title: 'Добавить rate limit на логин', column: 'backlog', priority: 'p1', area: 'backend' },
  { id: 'T-003', title: 'Экспорт доски в CSV', column: 'backlog', priority: 'p2', area: 'frontend' },
  { id: 'T-004', title: 'Обновить README с примерами board.yaml', column: 'review', priority: 'p3', assignee: 'docs-agent', area: 'docs' },
  { id: 'T-005', title: 'Кэш сборки в CI', column: 'done', priority: 'p2', assignee: 'devops-agent', area: 'infra' },
];

const WIDTHS = [320, 768, 1024, 1440];

for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`доска ${width}px, ${scheme}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'эталонные снимки ведём только для Chromium');
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await openBoard(page, VISUAL_TASKS);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`board-${width}-${scheme}.png`, { animations: 'disabled' });
    });
  }
}

for (const width of [320, 375]) {
  test(`нет горизонтальной прокрутки страницы на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openBoard(page, VISUAL_TASKS);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}
```

- [ ] **Step 6: Сгенерировать эталонные снимки и проверить их глазами**

Run: `npm run build && npx playwright test tests/e2e/visual.spec.ts --project=chromium --update-snapshots`
Expected: 8 PNG в `tests/e2e/visual.spec.ts-snapshots/`. Открой каждый (Read tool по пути PNG) и проверь: нет обрезанного текста, колонки не перекрываются, у In progress видно `1/3`, полоса приоритета слева у карточек, в тёмной теме текст читается. Если что-то сломано — чини CSS, пересоздавай снимки.

- [ ] **Step 7: Полный прогон E2E**

Run: `npm run test:e2e`
Expected: все тесты PASS в chromium, firefox и webkit (визуальные в firefox и webkit — skipped). Если `axe` находит нарушения контраста — поправь токены цвета в `tokens.css`, не отключай правило. Если правило `region` срабатывает на скрытую live-region dnd-kit, передай в `DndContext` `accessibility.container` — элемент внутри `<main>`. Если drag в firefox или webkit нестабилен — увеличь число `steps` в `dragTo`, не добавляй `waitForTimeout`.

- [ ] **Step 8: Проверить размер бандла**

Run: `npx gzip-size-cli dist/ui/assets/*.js 2>/dev/null || (for f in dist/ui/assets/*.js; do gzip -c "$f" | wc -c; done)`
Expected: суммарно JS < 300 КБ gzip (бюджет app page). CSS < 50 КБ.

- [ ] **Step 9: Финальная проверка всего набора**

Run: `npm run typecheck && npm run test:coverage && npm run test:e2e`
Expected: всё PASS, покрытие ≥ 80% по всем метрикам.

- [ ] **Step 10: Commit**

```bash
git add playwright.config.ts tests/e2e package.json package-lock.json
git commit -m "test: add Playwright e2e, visual regression and axe checks"
```
