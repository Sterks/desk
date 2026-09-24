# Часть 5. UI: основа и панели (задачи 14–15)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: разделы 6.4, 6.6, 6.7.

Визуальное направление — «операторская консоль»: светлая сетка-миллиметровка на фоне, колонки как панели с толстой верхней линейкой, моноширинные ID и счётчики, цвет только со смыслом (приоритет — полоса слева на карточке, агент — цветная точка, ошибка — красный). Шрифты: IBM Plex Sans + IBM Plex Mono (одна семья, два начертания), локально через `@fontsource`, поэтому доска работает без интернета.

---

### Task 14: UI — сборка, токены, данные, доска

**Files:**
- Modify: `package.json` (скрипт `typecheck`)
- Create: `ui/index.html`, `ui/vite.config.ts`, `ui/tsconfig.json`, `ui/src/main.tsx`, `ui/src/App.tsx`
- Create: `ui/src/api/types.ts`, `ui/src/api/client.ts`, `ui/src/hooks/useBoardData.ts`
- Create: `ui/src/lib/transitions.ts`, `ui/src/lib/agentColor.ts`, `ui/src/lib/priority.ts`, `ui/src/lib/test-fixtures.ts`
- Create: `ui/src/board/Board.tsx`, `ui/src/board/Column.tsx`, `ui/src/board/TaskCard.tsx`, `ui/src/ui/Banners.tsx`
- Create: `ui/src/styles/tokens.css`, `ui/src/styles/global.css`, `ui/src/styles/board.css`
- Test: `ui/src/lib/transitions.test.ts`, `ui/src/lib/agentColor.test.ts`, `ui/src/lib/priority.test.ts`

**Interfaces:**
- Consumes: HTTP API из Task 12 (`/api/board`, `/api/tasks`, `/api/tasks/:id`, `/move`, `/notes`, `/api/events`); JSON-формы из `src/core/present.ts` (Task 7)
- Produces:
  - `ui/src/api/types.ts`: `FieldType`, `FieldValue`, `FieldInfo`, `ColumnInfo`, `TransitionInfo`, `BoardInfo`, `TaskItem`, `TaskFull`, `NoteInfo`, `HistoryInfo`, `TaskList`, `ApiError`
  - `api` (`board`, `tasks`, `task`, `create`, `update`, `move`, `addNote`), `ApiRequestError`, `errorMessage(e)`, `type FieldChanges = Record<string, FieldValue | null>`
  - `useBoardData(): { board; list; error; version; refresh() }`
  - `allowedTargets(board, from)`, `requiredFor(board, from, to)`, `isEmptyValue(v)`, `missingForMove(board, task, to)`, `groupByColumn(board, tasks)`, `orphanTasks(board, tasks)`
  - `agentHue(name)`, `agentColor(name)`; `priorityTone(board, value): PriorityTone | null`
  - `TaskCardView({ task, board, onOpen, lifted? })`, `TaskCard({ task, board, onOpen })`
  - `ColumnFrame({ column, dropState, setNodeRef?, children })`, `type DropState = 'idle' | 'origin' | 'allowed' | 'blocked' | 'over'`, `Column({ column, tasks, board, onOpen })`
  - `Board({ board, tasks, onOpen })`; `Banners({ board, list, error, onOpen })`
  - тестовые фабрики `boardInfo()`, `taskItem(overrides?)`

- [ ] **Step 1: Установить зависимости UI и настроить сборку**

Run:
```bash
npm install -D react@^19 react-dom@^19 @types/react@^19 @types/react-dom@^19 vite@^6 @vitejs/plugin-react@^4 @dnd-kit/core@^6 markdown-it@^14 @types/markdown-it@^14 @fontsource/ibm-plex-sans@^5 @fontsource/ibm-plex-mono@^5
```
UI-зависимости идут в `devDependencies`: они попадают в бандл `dist/ui`, серверу в рантайме не нужны.

В `package.json` замени скрипт `typecheck`:
```json
"typecheck": "tsc --noEmit && tsc --noEmit -p ui/tsconfig.json"
```

`ui/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`ui/vite.config.ts`:
```ts
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// dev-режим: `desk ui` на 4717 + `npm run dev:ui`; прокси подменяет Origin, иначе сервер ответит 403.
const DESK_UI = 'http://127.0.0.1:4717';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('../dist/ui', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: DESK_UI,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.setHeader('origin', DESK_UI));
        },
      },
    },
  },
});
```

`ui/index.html`:
```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>desk</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Написать типы API и тестовые фабрики**

`ui/src/api/types.ts`:
```ts
export type FieldType = 'string' | 'text' | 'number' | 'bool' | 'date' | 'url' | 'enum' | 'multi_enum' | 'task_ref';
export type FieldValue = string | number | boolean | string[];

export interface FieldInfo {
  id: string;
  type: FieldType;
  required: boolean;
  values: string[] | null;
  default: FieldValue | null;
  min: number | null;
  max: number | null;
  guide: string | null;
}

export interface ColumnInfo {
  id: string;
  title: string;
  guide: string | null;
  wip_limit: number | null;
  count: number;
}

export interface TransitionInfo {
  from: string;
  to: string[];
  requires: string[];
}

export interface BoardInfo {
  name: string;
  guide: string | null;
  columns: ColumnInfo[];
  fields: FieldInfo[];
  transitions: TransitionInfo[] | null;
}

export interface TaskItem {
  id: string;
  title: string;
  column: string;
  assignee: string | null;
  fields: Record<string, FieldValue>;
  created_at: string;
  invalid: boolean;
  errors: string[];
}

export interface NoteInfo {
  at: string;
  by: string;
  text: string;
}

export interface HistoryInfo {
  at: string;
  by: string;
  from: string | null;
  to: string;
}

export interface TaskFull extends TaskItem {
  created_by: string;
  updated_at: string;
  description: string;
  notes: NoteInfo[];
  history: HistoryInfo[];
}

export interface TaskList {
  tasks: TaskItem[];
  invalid_files: { id: string; errors: string[] }[];
  duplicate_ids: string[][];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  field: string | null;
  guide: string | null;
  allowed: unknown[] | null;
}
```

`ui/src/lib/test-fixtures.ts` (только для тестов; приложение этот файл не импортирует):
```ts
import type { BoardInfo, TaskItem } from '../api/types';

export function boardInfo(overrides: Partial<BoardInfo> = {}): BoardInfo {
  return {
    name: 'desk',
    guide: null,
    columns: [
      { id: 'backlog', title: 'Backlog', guide: null, wip_limit: null, count: 0 },
      { id: 'in_progress', title: 'In progress', guide: null, wip_limit: 3, count: 0 },
      { id: 'review', title: 'Review', guide: null, wip_limit: null, count: 0 },
      { id: 'done', title: 'Done', guide: null, wip_limit: null, count: 0 },
    ],
    fields: [
      { id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'], default: 'p2', min: null, max: null, guide: null },
      { id: 'area', type: 'multi_enum', required: false, values: ['backend', 'frontend'], default: null, min: null, max: null, guide: null },
      { id: 'pr_url', type: 'url', required: false, values: null, default: null, min: null, max: null, guide: 'Ссылка на PR.' },
    ],
    transitions: [
      { from: 'backlog', to: ['in_progress'], requires: ['assignee'] },
      { from: 'in_progress', to: ['review'], requires: ['pr_url'] },
      { from: 'review', to: ['in_progress', 'done'], requires: [] },
    ],
    ...overrides,
  };
}

export function taskItem(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 'T-001',
    title: 'Задача',
    column: 'backlog',
    assignee: null,
    fields: { priority: 'p2' },
    created_at: '2026-09-24T10:00:00Z',
    invalid: false,
    errors: [],
    ...overrides,
  };
}
```

- [ ] **Step 3: Написать падающие тесты логики UI**

`ui/src/lib/transitions.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { boardInfo, taskItem } from './test-fixtures';
import { allowedTargets, groupByColumn, isEmptyValue, missingForMove, orphanTasks, requiredFor } from './transitions';

const board = boardInfo();

describe('правила переходов в UI', () => {
  it('allowedTargets повторяет логику сервера', () => {
    expect(allowedTargets(board, 'backlog')).toEqual(['in_progress']);
    expect(allowedTargets(board, 'done')).toEqual([]);
    expect(allowedTargets(boardInfo({ transitions: null }), 'done')).toEqual(['backlog', 'in_progress', 'review']);
    expect(allowedTargets(board, 'archived')).toEqual(['backlog', 'in_progress', 'review', 'done']);
  });

  it('requiredFor и missingForMove', () => {
    expect(requiredFor(board, 'in_progress', 'review')).toEqual(['pr_url']);
    expect(missingForMove(board, taskItem(), 'in_progress')).toEqual(['assignee']);
    expect(missingForMove(board, taskItem({ assignee: 'dev' }), 'in_progress')).toEqual([]);
    expect(missingForMove(board, taskItem({ column: 'in_progress', fields: { pr_url: 'https://x.y' } }), 'review')).toEqual([]);
  });

  it('isEmptyValue', () => {
    expect([undefined, null, '', []].every(isEmptyValue)).toBe(true);
    expect([0, false, 'x'].some(isEmptyValue)).toBe(false);
  });

  it('groupByColumn сохраняет порядок; orphanTasks — задачи вне колонок', () => {
    const tasks = [taskItem({ id: 'T-2' }), taskItem({ id: 'T-1' }), taskItem({ id: 'T-3', column: 'archived' })];
    expect(groupByColumn(board, tasks).get('backlog')?.map((t) => t.id)).toEqual(['T-2', 'T-1']);
    expect(groupByColumn(board, tasks).get('done')).toEqual([]);
    expect(orphanTasks(board, tasks).map((t) => t.id)).toEqual(['T-3']);
  });
});
```

`ui/src/lib/agentColor.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { agentColor, agentHue } from './agentColor';

describe('agentColor', () => {
  it('детерминирован и в диапазоне 0–359', () => {
    expect(agentHue('backend-agent')).toBe(agentHue('backend-agent'));
    for (const name of ['a', 'planner', 'Denis Runov', 'очень-длинное-имя-агента']) {
      const hue = agentHue(name);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
  it('возвращает oklch-цвет', () => expect(agentColor('qa')).toMatch(/^oklch\(0\.64 0\.13 \d+\)$/));
});
```

`ui/src/lib/priority.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { priorityTone } from './priority';
import { boardInfo } from './test-fixtures';

describe('priorityTone', () => {
  const board = boardInfo();
  it.each([
    ['p0', 'critical'],
    ['p1', 'high'],
    ['p2', 'normal'],
    ['p3', 'low'],
    ['p9', null],
    [undefined, null],
  ])('%s → %s', (value, tone) => expect(priorityTone(board, value)).toBe(tone));

  it('без поля priority — null', () => expect(priorityTone(boardInfo({ fields: [] }), 'p0')).toBeNull());
});
```

- [ ] **Step 4: Запустить и убедиться, что падает**

Run: `npx vitest run ui/src/lib`
Expected: FAIL — модули `transitions`, `agentColor`, `priority` не найдены.

- [ ] **Step 5: Реализовать логику**

`ui/src/lib/transitions.ts`:
```ts
import type { BoardInfo, TaskItem } from '../api/types';

// Подсказка для UI. Решает сервер (src/core/transitions.ts); логика должна совпадать.
export function allowedTargets(board: BoardInfo, from: string): string[] {
  const known = board.columns.some((c) => c.id === from);
  const others = board.columns.map((c) => c.id).filter((id) => id !== from);
  if (board.transitions === null || !known) return others;
  const targets = new Set(board.transitions.filter((t) => t.from === from).flatMap((t) => t.to));
  return others.filter((id) => targets.has(id));
}

export function requiredFor(board: BoardInfo, from: string, to: string): string[] {
  if (board.transitions === null) return [];
  return [...new Set(board.transitions.filter((t) => t.from === from && t.to.includes(to)).flatMap((t) => t.requires))];
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function missingForMove(board: BoardInfo, task: TaskItem, to: string): string[] {
  return requiredFor(board, task.column, to).filter((id) =>
    isEmptyValue(id === 'assignee' ? task.assignee : task.fields[id]),
  );
}

export function groupByColumn(board: BoardInfo, tasks: readonly TaskItem[]): Map<string, TaskItem[]> {
  return new Map(board.columns.map((c) => [c.id, tasks.filter((t) => t.column === c.id)]));
}

export function orphanTasks(board: BoardInfo, tasks: readonly TaskItem[]): TaskItem[] {
  const ids = new Set(board.columns.map((c) => c.id));
  return tasks.filter((t) => !ids.has(t.column));
}
```

`ui/src/lib/agentColor.ts`:
```ts
const HUE_SEED = 7;

export function agentHue(name: string): number {
  return [...name].reduce((hue, ch) => (hue * 31 + (ch.codePointAt(0) ?? 0)) % 360, HUE_SEED);
}

export function agentColor(name: string): string {
  return `oklch(0.64 0.13 ${agentHue(name)})`;
}
```

`ui/src/lib/priority.ts`:
```ts
import type { BoardInfo } from '../api/types';

export type PriorityTone = 'critical' | 'high' | 'normal' | 'low';

export function priorityTone(board: BoardInfo, value: unknown): PriorityTone | null {
  const field = board.fields.find((f) => f.id === 'priority' && f.type === 'enum');
  const values = field?.values ?? [];
  if (typeof value !== 'string') return null;
  const index = values.indexOf(value);
  if (index === -1) return null;
  if (index === 0) return 'critical';
  if (values.length > 2 && index === 1) return 'high';
  if (values.length > 2 && index === values.length - 1) return 'low';
  return 'normal';
}
```

- [ ] **Step 6: Запустить тесты логики**

Run: `npx vitest run ui/src/lib`
Expected: PASS.

- [ ] **Step 7: Написать клиент API и хук данных**

`ui/src/api/client.ts`:
```ts
import type { ApiError, BoardInfo, FieldValue, TaskFull, TaskList } from './types';

export class ApiRequestError extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.error = error;
  }
}

export type FieldChanges = Record<string, FieldValue | null>;
type Envelope<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const localError = (code: string, message: string): ApiError => ({ code, message, field: null, guide: null, allowed: null });

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(localError('NETWORK', 'Нет связи с desk ui. Сервер запущен?'));
  }
  let envelope: Envelope<T>;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiRequestError(localError('INTERNAL', `desk ui ответил ${res.status} без JSON`));
  }
  if (!envelope.ok) throw new ApiRequestError(envelope.error);
  return envelope.data;
}

const taskUrl = (id: string, suffix = ''): string => `/api/tasks/${encodeURIComponent(id)}${suffix}`;

export const api = {
  board: () => request<BoardInfo>('GET', '/api/board'),
  tasks: () => request<TaskList>('GET', '/api/tasks'),
  task: (id: string) => request<TaskFull>('GET', taskUrl(id)),
  create: (input: { title: string; description?: string; column?: string; fields?: FieldChanges }) =>
    request<TaskFull>('POST', '/api/tasks', input),
  update: (id: string, input: { title?: string; description?: string; fields?: FieldChanges }) =>
    request<TaskFull>('PATCH', taskUrl(id), input),
  move: (id: string, to: string, fields: FieldChanges = {}) => request<TaskFull>('POST', taskUrl(id, '/move'), { to, fields }),
  addNote: (id: string, text: string) => request<TaskFull>('POST', taskUrl(id, '/notes'), { text }),
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
```

`ui/src/hooks/useBoardData.ts`:
```ts
import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskList } from '../api/types';

const EVENT_TYPES = ['task_changed', 'task_removed', 'board_changed'] as const;

export interface BoardData {
  board: BoardInfo | null;
  list: TaskList | null;
  error: string | null;
  /** Растёт на каждом успешном обновлении: открытые панели по нему перечитывают задачу. */
  version: number;
  refresh(): Promise<void>;
}

export function useBoardData(): BoardData {
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [list, setList] = useState<TaskList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [nextBoard, nextList] = await Promise.all([api.board(), api.tasks()]);
      setBoard(nextBoard);
      setList(nextList);
      setError(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const source = new EventSource('/api/events');
    const onChange = (): void => void refresh();
    EVENT_TYPES.forEach((type) => source.addEventListener(type, onChange));
    source.onopen = onChange;
    source.onerror = () => setError('Нет связи с desk ui. Переподключение…');
    return () => source.close();
  }, [refresh]);

  return { board, list, error, version, refresh };
}
```

- [ ] **Step 8: Написать компоненты доски**

`ui/src/board/TaskCard.tsx`:
```tsx
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

export function TaskCard(props: TaskCardProps) {
  return <TaskCardView {...props} />;
}
```

`ui/src/board/Column.tsx`:
```tsx
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
  onOpen(id: string): void;
}

export function Column({ column, tasks, board, onOpen }: ColumnProps) {
  return (
    <ColumnFrame column={column} dropState="idle">
      {tasks.length === 0 ? (
        <p className="column-empty">пусто</p>
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} board={board} onOpen={onOpen} />)
      )}
    </ColumnFrame>
  );
}
```

`ui/src/board/Board.tsx`:
```tsx
import type { BoardInfo, TaskItem } from '../api/types';
import { groupByColumn } from '../lib/transitions';
import { Column } from './Column';

export interface BoardProps {
  board: BoardInfo;
  tasks: TaskItem[];
  onOpen(id: string): void;
}

export function Board({ board, tasks, onOpen }: BoardProps) {
  const byColumn = groupByColumn(board, tasks);
  return (
    <div className="board">
      {board.columns.map((column) => (
        <Column key={column.id} column={column} tasks={byColumn.get(column.id) ?? []} board={board} onOpen={onOpen} />
      ))}
    </div>
  );
}
```

`ui/src/ui/Banners.tsx`:
```tsx
import type { BoardInfo, TaskList } from '../api/types';
import { orphanTasks } from '../lib/transitions';

export interface BannersProps {
  board: BoardInfo;
  list: TaskList;
  error: string | null;
  onOpen(id: string): void;
}

export function Banners({ board, list, error, onOpen }: BannersProps) {
  const orphans = orphanTasks(board, list.tasks);
  const hasAny = error || list.duplicate_ids.length > 0 || list.invalid_files.length > 0 || orphans.length > 0;
  if (!hasAny) return null;
  return (
    <div className="banners">
      {error && (
        <p className="banner banner-error" role="alert">
          {error}
        </p>
      )}
      {list.duplicate_ids.length > 0 && (
        <p className="banner banner-warn">
          Дубликаты ID: {list.duplicate_ids.map((group) => group.join(' = ')).join('; ')}. Переименуй файлы в .desk/tasks.
        </p>
      )}
      {list.invalid_files.length > 0 && (
        <p className="banner banner-error">
          Не читаются файлы: {list.invalid_files.map((f) => `${f.id} (${f.errors.join('; ')})`).join(', ')}. Запусти desk validate.
        </p>
      )}
      {orphans.length > 0 && (
        <p className="banner banner-warn">
          Задачи в колонках, которых нет в board.yaml:{' '}
          {orphans.map((task) => (
            <button key={task.id} type="button" onClick={() => onOpen(task.id)}>
              {task.id}
            </button>
          ))}
          . Перенеси их в существующую колонку.
        </p>
      )}
    </div>
  );
}
```

`ui/src/App.tsx` (версия задачи 14; в 15 и 16 заменяется целиком):
```tsx
import { Board } from './board/Board';
import { useBoardData } from './hooks/useBoardData';
import { Banners } from './ui/Banners';

export function App() {
  const { board, list, error } = useBoardData();
  if (!board || !list) return <main className="app-state">{error ?? 'Загрузка доски…'}</main>;
  const noop = (): void => undefined;
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-mark" aria-hidden="true">▦</span>
          <h1>{board.name}</h1>
        </div>
      </header>
      <Banners board={board} list={list} error={error} onOpen={noop} />
      <main className="app-main">
        <Board board={board} tasks={list.tasks} onOpen={noop} />
      </main>
    </div>
  );
}
```

`ui/src/main.tsx` (версия задачи 14):
```tsx
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/board.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root не найден в index.html');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Написать стили**

`ui/src/styles/tokens.css`:
```css
:root {
  color-scheme: light dark;
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;

  --color-bg: oklch(96.5% 0.006 250);
  --color-grid: oklch(91% 0.008 250);
  --color-surface: oklch(99.5% 0.002 250);
  --color-surface-sunken: oklch(94% 0.007 250);
  --color-border: oklch(86% 0.01 250);
  --color-border-strong: oklch(72% 0.012 250);
  --color-text: oklch(21% 0.02 262);
  --color-text-muted: oklch(45% 0.018 262);
  --color-accent: oklch(52% 0.2 256);
  --color-accent-tint: oklch(52% 0.2 256 / 0.1);
  --color-on-accent: oklch(99% 0 0);
  --color-critical: oklch(53% 0.21 27);
  --color-high: oklch(60% 0.15 62);
  --color-normal: oklch(55% 0.1 250);
  --color-low: oklch(62% 0.02 262);
  --color-danger-bg: oklch(95% 0.035 27);
  --color-warn-bg: oklch(95.5% 0.05 85);
  --shadow-card: 0 1px 0 oklch(20% 0.02 262 / 0.05), 0 1px 2px oklch(20% 0.02 262 / 0.06);
  --shadow-lift: 0 18px 40px -12px oklch(20% 0.02 262 / 0.35);
  --shadow-panel: -24px 0 60px -30px oklch(20% 0.02 262 / 0.45);

  --text-2xs: 0.6875rem;
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-base: 0.9375rem;
  --text-lg: 1.125rem;
  --text-display: clamp(1.375rem, 1.1rem + 1vw, 1.875rem);
  --tracking-caps: 0.08em;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;

  --radius-card: 2px;
  --radius-control: 4px;
  --radius-panel: 10px;
  --column-width: min(19rem, calc(100vw - 2rem));

  --duration-fast: 120ms;
  --duration-normal: 240ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(17% 0.012 262);
    --color-grid: oklch(21.5% 0.012 262);
    --color-surface: oklch(22.5% 0.014 262);
    --color-surface-sunken: oklch(19.5% 0.012 262);
    --color-border: oklch(31% 0.014 262);
    --color-border-strong: oklch(44% 0.016 262);
    --color-text: oklch(93% 0.008 250);
    --color-text-muted: oklch(72% 0.014 250);
    --color-accent: oklch(72% 0.15 256);
    --color-accent-tint: oklch(72% 0.15 256 / 0.14);
    --color-on-accent: oklch(17% 0.012 262);
    --color-critical: oklch(70% 0.19 27);
    --color-high: oklch(80% 0.14 70);
    --color-normal: oklch(72% 0.09 250);
    --color-low: oklch(60% 0.02 262);
    --color-danger-bg: oklch(28% 0.06 27);
    --color-warn-bg: oklch(29% 0.05 80);
    --shadow-card: 0 1px 0 oklch(0% 0 0 / 0.3);
    --shadow-lift: 0 18px 40px -12px oklch(0% 0 0 / 0.7);
    --shadow-panel: -24px 0 60px -30px oklch(0% 0 0 / 0.8);
  }
}
```

`ui/src/styles/global.css`:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  overflow-x: hidden;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.45;
  color: var(--color-text);
  background-color: var(--color-bg);
  background-image:
    linear-gradient(var(--color-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: -1px -1px;
  -webkit-font-smoothing: antialiased;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.app {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 100%;
}

.app-state {
  display: grid;
  place-items: center;
  min-height: 100%;
  padding: var(--space-4);
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  text-align: center;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in oklch, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.app-brand {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.app-mark {
  font-size: var(--text-lg);
  color: var(--color-accent);
}

.app-brand h1 {
  margin: 0;
  font-size: var(--text-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.app-main {
  min-width: 0;
}

.banners {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) 0;
}

.banner {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border-left: 3px solid;
  border-radius: 0 var(--radius-control) var(--radius-control) 0;
}

.banner-error {
  background: var(--color-danger-bg);
  border-color: var(--color-critical);
}

.banner-warn {
  background: var(--color-warn-bg);
  border-color: var(--color-high);
}

.banner button {
  margin: 0 0.25em;
  padding: 0;
  font-family: var(--font-mono);
  text-decoration: underline;
  background: none;
  border: 0;
  cursor: pointer;
}

.button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast),
    transform var(--duration-fast);
}

.button:hover {
  border-color: var(--color-text-muted);
}

.button:active {
  transform: translateY(1px);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  color: var(--color-on-accent);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.button-primary:hover {
  background: color-mix(in oklch, var(--color-accent) 86%, black);
  border-color: transparent;
}

.control {
  width: 100%;
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
}

.control:hover {
  border-color: var(--color-border-strong);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

`ui/src/styles/board.css`:
```css
.board {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  min-height: calc(100vh - 5rem);
  padding: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x proximity;
}

.column {
  flex: 0 0 var(--column-width);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 7rem);
  background: var(--color-surface-sunken);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-text);
  border-radius: 0 0 var(--radius-panel) var(--radius-panel);
  scroll-snap-align: start;
  transition:
    opacity var(--duration-normal) var(--ease-out-expo),
    background-color var(--duration-fast),
    border-color var(--duration-fast);
}

.column-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-1);
}

.column-title {
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
}

.column-count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.column[data-limit='full'] .column-count {
  color: var(--color-high);
}

.column[data-limit='over'] .column-count {
  font-weight: 500;
  color: var(--color-critical);
}

.column-guide {
  margin: 0;
  padding: 0 var(--space-3) var(--space-2);
  font-size: var(--text-xs);
  line-height: 1.35;
  color: var(--color-text-muted);
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 4rem;
  padding: var(--space-2);
  overflow-y: auto;
}

.column-empty {
  margin: 0;
  padding: var(--space-4) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-control);
}

.column[data-drop='blocked'] {
  opacity: 0.38;
}

.column[data-drop='allowed'] {
  border-color: var(--color-accent);
  border-top-color: var(--color-accent);
}

.column[data-drop='over'] {
  background: var(--color-accent-tint);
  border-color: var(--color-accent);
  border-top-color: var(--color-accent);
}

.card {
  position: relative;
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 2px);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--duration-fast) var(--ease-out-expo),
    box-shadow var(--duration-fast),
    border-color var(--duration-fast);
}

.card::before {
  content: '';
  position: absolute;
  inset: -1px auto -1px -1px;
  width: 3px;
  background: var(--card-tone, transparent);
  border-radius: var(--radius-card) 0 0 var(--radius-card);
}

.card[data-tone='critical'] { --card-tone: var(--color-critical); }
.card[data-tone='high'] { --card-tone: var(--color-high); }
.card[data-tone='normal'] { --card-tone: var(--color-normal); }
.card[data-tone='low'] { --card-tone: var(--color-low); }

.card:hover {
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
}

.card[data-invalid] {
  background: var(--color-danger-bg);
  border-color: var(--color-critical);
}

.card[data-lifted] {
  box-shadow: var(--shadow-lift);
  transform: rotate(-1.5deg) scale(1.02);
  cursor: grabbing;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.card-id {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}

.card-flag {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-critical);
}

.card-title {
  all: unset;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.card-title:hover {
  color: var(--color-accent);
}

.card-title:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.badge {
  padding: 0 var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 500;
  color: var(--color-text-muted);
  border: 1px solid currentColor;
  border-radius: 2px;
}

.badge[data-tone='critical'] { color: var(--color-critical); }
.badge[data-tone='high'] { color: var(--color-high); }
.badge[data-tone='normal'] { color: var(--color-normal); }

.assignee {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.assignee::before {
  content: '';
  width: 0.55rem;
  height: 0.55rem;
  background: var(--agent-color);
  border-radius: 50%;
}

.draggable {
  touch-action: none;
  border-radius: var(--radius-card);
}

.draggable[data-dragging] {
  opacity: 0.35;
}
```

- [ ] **Step 10: Собрать и проверить в браузере**

Run:
```bash
npm run typecheck && npm run build
DEMO=$(mktemp -d) && cd "$DEMO" && node ~/projects/desk/dist/cli/index.js init >/dev/null
node ~/projects/desk/dist/cli/index.js ui --port 4717 &
sleep 1; curl -s -H 'host: 127.0.0.1:4717' http://127.0.0.1:4717/ | head -5
```
Expected: `typecheck` и `build` без ошибок; `curl` выводит HTML со скриптом из `/assets/`. Открой `http://127.0.0.1:4717` в браузере: видно 4 колонки с заголовками и счётчиком `0/3` у In progress. Останови сервер (`kill %1`).

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json ui
git commit -m "feat: add web board UI with live updates"
```

---

### Task 15: UI — панель задачи, создание, фильтры, markdown, toast

**Files:**
- Create: `ui/src/lib/filters.ts`, `ui/src/lib/fields.ts`, `ui/src/lib/markdown.ts`, `ui/src/lib/format.ts`
- Create: `ui/src/hooks/useUrlFilters.ts`
- Create: `ui/src/ui/Modal.tsx`, `ui/src/ui/Toast.tsx`, `ui/src/ui/Markdown.tsx`
- Create: `ui/src/task-panel/FieldInput.tsx`, `ui/src/task-panel/TaskPanel.tsx`, `ui/src/task-panel/CreateTaskDialog.tsx`
- Create: `ui/src/filters/FilterBar.tsx`, `ui/src/styles/panel.css`
- Modify: `ui/src/App.tsx`, `ui/src/main.tsx` (заменить целиком)
- Test: `ui/src/lib/filters.test.ts`, `ui/src/lib/fields.test.ts`, `ui/src/lib/markdown.test.ts`

**Interfaces:**
- Consumes: всё из Task 14
- Produces:
  - `interface Filters { q: string; assignee: string; fields: Record<string, string>; task: string | null }`; `EMPTY_FILTERS`; `filtersFromSearch(search)`, `filtersToSearch(filters)`, `applyFilters(tasks, filters)`
  - `type Draft = Record<string, FieldValue | null>`; `interface TaskDraft { title; description; assignee: string; fields: Draft }`; `ASSIGNEE_FIELD`; `fieldInfo(board, id)`; `defaultsFor(board)`; `compactFields(draft)`; `diffFields(original, draft)`; `toDraft(task)`; `buildUpdate(task, draft)`; `isDirty(task, draft)`
  - `renderMarkdown(source): string`; `formatTime(iso): string`
  - `useUrlFilters(): [Filters, (patch: Partial<Filters>) => void]`
  - `Modal({ title, description?, onClose, onSubmit, footer, children })`; `useToasts(): { items; push(text, kind?); dismiss(id) }`; `ToastStack({ items, onDismiss })`; `Markdown({ source })`
  - `FieldInput`, `FieldRow({ def, value, onChange })`; `TaskPanel({ board, taskId, version, onClose, onError })`; `CreateTaskDialog({ board, onClose, onCreated })`; `FilterBar({ board, tasks, filters, onChange, onCreate })`

- [ ] **Step 1: Написать падающие тесты**

`ui/src/lib/filters.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, applyFilters, filtersFromSearch, filtersToSearch } from './filters';
import { taskItem } from './test-fixtures';

describe('фильтры в URL', () => {
  it('round-trip', () => {
    const filters = { q: 'логин', assignee: 'dev', fields: { priority: 'p0' }, task: 'T-012' };
    expect(filtersFromSearch(filtersToSearch(filters))).toEqual(filters);
  });
  it('пустые фильтры — пустая строка', () => expect(filtersToSearch(EMPTY_FILTERS)).toBe(''));
  it('пустые значения f.* отбрасываются', () => expect(filtersFromSearch('?f.priority=&q=x').fields).toEqual({}));
});

describe('applyFilters', () => {
  const tasks = [
    taskItem({ id: 'T-001', title: 'Rate limit на логин', assignee: 'dev', fields: { priority: 'p0', area: ['backend'] } }),
    taskItem({ id: 'T-002', title: 'Кнопка', fields: { priority: 'p2', area: ['frontend'] } }),
  ];
  const run = (patch: Partial<typeof EMPTY_FILTERS>) => applyFilters(tasks, { ...EMPTY_FILTERS, ...patch }).map((t) => t.id);

  it('q ищет по ID и названию без регистра', () => {
    expect(run({ q: 'ЛОГИН' })).toEqual(['T-001']);
    expect(run({ q: 't-002' })).toEqual(['T-002']);
  });
  it('assignee', () => expect(run({ assignee: 'dev' })).toEqual(['T-001']));
  it('поле: точное значение и вхождение в массив', () => {
    expect(run({ fields: { priority: 'p2' } })).toEqual(['T-002']);
    expect(run({ fields: { area: 'backend' } })).toEqual(['T-001']);
  });
});
```

`ui/src/lib/fields.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { TaskFull } from '../api/types';
import { buildUpdate, compactFields, defaultsFor, diffFields, fieldInfo, isDirty, toDraft } from './fields';
import { boardInfo, taskItem } from './test-fixtures';

const task: TaskFull = {
  ...taskItem({ assignee: 'dev', fields: { priority: 'p2', area: ['backend'] } }),
  created_by: 'planner',
  updated_at: '2026-09-24T10:00:00Z',
  description: 'Описание',
  notes: [],
  history: [],
};

describe('fields', () => {
  it('defaultsFor и compactFields', () => {
    expect(defaultsFor(boardInfo())).toEqual({ priority: 'p2' });
    expect(compactFields({ a: 1, b: null, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('diffFields: только изменённые, null для очищенных', () => {
    expect(diffFields({ priority: 'p2', area: ['backend'] }, { priority: 'p0', area: null })).toEqual({ priority: 'p0', area: null });
    expect(diffFields({ area: ['backend'] }, { area: ['backend'] })).toEqual({});
  });

  it('fieldInfo знает assignee', () => {
    expect(fieldInfo(boardInfo(), 'assignee')?.type).toBe('string');
    expect(fieldInfo(boardInfo(), 'pr_url')?.type).toBe('url');
    expect(fieldInfo(boardInfo(), 'ghost')).toBeUndefined();
  });

  it('buildUpdate и isDirty', () => {
    const draft = toDraft(task);
    expect(isDirty(task, draft)).toBe(false);
    expect(buildUpdate(task, { ...draft, title: 'Новое' })).toEqual({ title: 'Новое', fields: {} });
    expect(buildUpdate(task, { ...draft, assignee: '  ' })).toEqual({ fields: { assignee: null } });
    expect(buildUpdate(task, { ...draft, fields: { ...draft.fields, priority: 'p1' } })).toEqual({ fields: { priority: 'p1' } });
    expect(isDirty(task, { ...draft, description: 'x' })).toBe(true);
  });
});
```

`ui/src/lib/markdown.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('экранирует сырой HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('не делает ссылки из javascript: и data:', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href');
    expect(renderMarkdown('[x](data:text/html,hi)')).not.toContain('href');
  });

  it('http(s)-ссылки открываются безопасно', () => {
    const html = renderMarkdown('[PR](https://github.com/org/repo/pull/1)');
    expect(html).toContain('href="https://github.com/org/repo/pull/1"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('рендерит markdown', () => expect(renderMarkdown('**жирный**')).toContain('<strong>жирный</strong>'));
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run ui/src/lib/filters.test.ts ui/src/lib/fields.test.ts ui/src/lib/markdown.test.ts`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать логику**

`ui/src/lib/filters.ts`:
```ts
import type { TaskItem } from '../api/types';

export interface Filters {
  q: string;
  assignee: string;
  fields: Record<string, string>;
  task: string | null;
}

export const EMPTY_FILTERS: Filters = { q: '', assignee: '', fields: {}, task: null };
const FIELD_PREFIX = 'f.';

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const fields = Object.fromEntries(
    [...params.entries()]
      .filter(([key, value]) => key.startsWith(FIELD_PREFIX) && value !== '')
      .map(([key, value]) => [key.slice(FIELD_PREFIX.length), value]),
  );
  return { q: params.get('q') ?? '', assignee: params.get('assignee') ?? '', fields, task: params.get('task') || null };
}

export function filtersToSearch(filters: Filters): string {
  const entries: [string, string][] = [
    ['q', filters.q],
    ['assignee', filters.assignee],
    ...Object.entries(filters.fields).map(([key, value]): [string, string] => [`${FIELD_PREFIX}${key}`, value]),
    ['task', filters.task ?? ''],
  ];
  const search = new URLSearchParams(entries.filter(([, value]) => value !== '')).toString();
  return search === '' ? '' : `?${search}`;
}

export function applyFilters(tasks: readonly TaskItem[], filters: Filters): TaskItem[] {
  const q = filters.q.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (!q || task.id.toLowerCase().includes(q) || task.title.toLowerCase().includes(q)) &&
      (!filters.assignee || task.assignee === filters.assignee) &&
      Object.entries(filters.fields).every(([key, expected]) => {
        if (!expected) return true;
        const actual = task.fields[key];
        return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '') === expected;
      }),
  );
}
```

`ui/src/lib/fields.ts`:
```ts
import type { BoardInfo, FieldInfo, FieldValue, TaskFull } from '../api/types';

export type Draft = Record<string, FieldValue | null>;

export interface TaskDraft {
  title: string;
  description: string;
  assignee: string;
  fields: Draft;
}

export const ASSIGNEE_FIELD: FieldInfo = {
  id: 'assignee',
  type: 'string',
  required: false,
  values: null,
  default: null,
  min: null,
  max: null,
  guide: 'Имя агента или человека, который выполняет задачу.',
};

export function fieldInfo(board: BoardInfo, id: string): FieldInfo | undefined {
  return id === 'assignee' ? ASSIGNEE_FIELD : board.fields.find((f) => f.id === id);
}

export function defaultsFor(board: BoardInfo): Draft {
  return Object.fromEntries(board.fields.filter((f) => f.default !== null).map((f) => [f.id, f.default]));
}

export function compactFields(draft: Draft): Record<string, FieldValue> {
  return Object.fromEntries(Object.entries(draft).filter((entry): entry is [string, FieldValue] => entry[1] !== null));
}

export function diffFields(original: Record<string, FieldValue>, draft: Draft): Draft {
  return Object.fromEntries(
    Object.entries(draft)
      .filter(([key, value]) => JSON.stringify(original[key] ?? null) !== JSON.stringify(value ?? null))
      .map(([key, value]) => [key, value ?? null]),
  );
}

export function toDraft(task: TaskFull): TaskDraft {
  return { title: task.title, description: task.description, assignee: task.assignee ?? '', fields: { ...task.fields } };
}

export function buildUpdate(task: TaskFull, draft: TaskDraft): { title?: string; description?: string; fields: Draft } {
  const fields = diffFields(task.fields, draft.fields);
  const assignee = draft.assignee.trim() === '' ? null : draft.assignee.trim();
  return {
    ...(draft.title !== task.title ? { title: draft.title } : {}),
    ...(draft.description !== task.description ? { description: draft.description } : {}),
    fields: assignee === task.assignee ? fields : { ...fields, assignee },
  };
}

export function isDirty(task: TaskFull, draft: TaskDraft): boolean {
  const update = buildUpdate(task, draft);
  return update.title !== undefined || update.description !== undefined || Object.keys(update.fields).length > 0;
}
```

`ui/src/lib/markdown.ts`:
```ts
import MarkdownIt from 'markdown-it';

// Описание и notes пишут агенты: это недоверенный ввод. html: false — сырой HTML экранируется.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
md.validateLink = (url: string) => /^https?:\/\//i.test(url.trim());

const renderToken: NonNullable<typeof md.renderer.rules.link_open> = (tokens, idx, options, _env, self) =>
  self.renderToken(tokens, idx, options);
const defaultLinkOpen = md.renderer.rules.link_open ?? renderToken;

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token?.attrSet('target', '_blank');
  token?.attrSet('rel', 'noopener noreferrer');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}
```

`ui/src/lib/format.ts`:
```ts
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
```

- [ ] **Step 4: Запустить тесты логики**

Run: `npx vitest run ui/src/lib`
Expected: PASS.

- [ ] **Step 5: Написать хук и общие компоненты**

`ui/src/hooks/useUrlFilters.ts`:
```ts
import { useCallback, useEffect, useState } from 'react';
import { filtersFromSearch, filtersToSearch, type Filters } from '../lib/filters';

export function useUrlFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(window.location.search));

  useEffect(() => {
    const onPop = (): void => setFilters(filtersFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const search = filtersToSearch(filters);
    if (search !== window.location.search) window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }, [filters]);

  const update = useCallback((patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch })), []);
  return [filters, update];
}
```

`ui/src/ui/Modal.tsx`:
```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: string;
  description?: string;
  onClose(): void;
  onSubmit(): void;
  footer: ReactNode;
  children: ReactNode;
}

export function Modal({ title, description, onClose, onSubmit, footer, children }: ModalProps) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-foot">{footer}</footer>
      </form>
    </div>
  );
}
```

`ui/src/ui/Toast.tsx`:
```tsx
import { useCallback, useRef, useState } from 'react';

export interface ToastItem {
  id: number;
  kind: 'error' | 'info';
  text: string;
}

const TOAST_MS = 6000;

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (text: string, kind: ToastItem['kind'] = 'error') => {
      const id = nextId.current;
      nextId.current += 1;
      setItems((prev) => [...prev, { id, kind, text }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );
  return { items, push, dismiss };
}

export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss(id: number): void }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((toast) => (
        <div key={toast.id} className="toast" data-kind={toast.kind}>
          <span>{toast.text}</span>
          <button type="button" aria-label="Закрыть уведомление" onClick={() => onDismiss(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

`ui/src/ui/Markdown.tsx`:
```tsx
import { renderMarkdown } from '../lib/markdown';

export function Markdown({ source }: { source: string }) {
  // renderMarkdown экранирует HTML (html: false) и пропускает только http(s)-ссылки — см. markdown.test.ts.
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
```

- [ ] **Step 6: Написать поля, панель, диалог создания, фильтры**

`ui/src/task-panel/FieldInput.tsx`:
```tsx
import type { FieldInfo, FieldValue } from '../api/types';

export interface FieldInputProps {
  def: FieldInfo;
  value: FieldValue | undefined;
  onChange(value: FieldValue | null): void;
  inputId: string;
}

const textValue = (value: FieldValue | undefined): string => (typeof value === 'string' ? value : '');
const orNull = (text: string): string | null => (text === '' ? null : text);

export function FieldInput({ def, value, onChange, inputId }: FieldInputProps) {
  switch (def.type) {
    case 'enum':
      return (
        <select id={inputId} className="control" value={textValue(value)} onChange={(e) => onChange(orNull(e.target.value))}>
          <option value="">—</option>
          {def.values?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    case 'multi_enum': {
      const current = Array.isArray(value) ? value : [];
      return (
        <fieldset id={inputId} className="multi">
          {def.values?.map((v) => (
            <label key={v}>
              <input
                type="checkbox"
                checked={current.includes(v)}
                onChange={(e) => {
                  const next = e.target.checked ? [...current, v] : current.filter((x) => x !== v);
                  onChange(next.length > 0 ? next : null);
                }}
              />
              {v}
            </label>
          ))}
        </fieldset>
      );
    }
    case 'bool':
      return <input id={inputId} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
    case 'number':
      return (
        <input
          id={inputId}
          className="control"
          type="number"
          value={typeof value === 'number' ? value : ''}
          min={def.min ?? undefined}
          max={def.max ?? undefined}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );
    case 'text':
      return <textarea id={inputId} className="control" rows={4} value={textValue(value)} onChange={(e) => onChange(orNull(e.target.value))} />;
    default:
      return (
        <input
          id={inputId}
          className="control"
          type={def.type === 'url' ? 'url' : def.type === 'date' ? 'date' : 'text'}
          value={textValue(value)}
          onChange={(e) => onChange(orNull(e.target.value))}
        />
      );
  }
}

export function FieldRow({ def, value, onChange }: Omit<FieldInputProps, 'inputId'>) {
  const inputId = `field-${def.id}`;
  return (
    <div className="field-row">
      <label htmlFor={inputId}>
        {def.id}
        {def.required && <span className="field-required" aria-label="обязательное"> *</span>}
      </label>
      <FieldInput def={def} value={value} onChange={onChange} inputId={inputId} />
      {def.guide && <p className="field-guide">{def.guide}</p>}
    </div>
  );
}
```

`ui/src/task-panel/TaskPanel.tsx`:
```tsx
import { useEffect, useId, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, FieldValue, TaskFull } from '../api/types';
import { ASSIGNEE_FIELD, buildUpdate, isDirty, toDraft, type TaskDraft } from '../lib/fields';
import { formatTime } from '../lib/format';
import { Markdown } from '../ui/Markdown';
import { FieldRow } from './FieldInput';

interface PanelState {
  task: TaskFull;
  draft: TaskDraft;
}

export interface TaskPanelProps {
  board: BoardInfo;
  taskId: string;
  version: number;
  onClose(): void;
  onError(message: string): void;
}

/** Новая версия задачи с сервера не затирает несохранённые правки. */
const mergeFresh = (prev: PanelState | null, next: TaskFull): PanelState =>
  prev && prev.task.id === next.id && isDirty(prev.task, prev.draft)
    ? { task: next, draft: prev.draft }
    : { task: next, draft: toDraft(next) };

export function TaskPanel({ board, taskId, version, onClose, onError }: TaskPanelProps) {
  const [state, setState] = useState<PanelState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const titleId = useId();

  useEffect(() => {
    let alive = true;
    api.task(taskId).then(
      (next) => {
        if (!alive) return;
        setLoadError(null);
        setState((prev) => mergeFresh(prev, next));
      },
      (e: unknown) => {
        if (alive) setLoadError(errorMessage(e));
      },
    );
    return () => {
      alive = false;
    };
  }, [taskId, version]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setDraft = (patch: Partial<TaskDraft>): void =>
    setState((prev) => prev && { ...prev, draft: { ...prev.draft, ...patch } });
  const setField = (id: string, value: FieldValue | null): void =>
    setState((prev) => prev && { ...prev, draft: { ...prev.draft, fields: { ...prev.draft.fields, [id]: value } } });

  const run = async (action: () => Promise<TaskFull>): Promise<void> => {
    setSaving(true);
    try {
      const updated = await action();
      setState((prev) => mergeFresh(prev, updated));
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const save = (): void => {
    if (!state) return;
    const update = buildUpdate(state.task, state.draft);
    void run(async () => {
      const updated = await api.update(state.task.id, update);
      setState({ task: updated, draft: toDraft(updated) });
      setEditingDescription(false);
      return updated;
    });
  };

  const submitNote = (e: FormEvent): void => {
    e.preventDefault();
    if (!state || note.trim() === '') return;
    void run(async () => {
      const updated = await api.addNote(state.task.id, note);
      setNote('');
      return updated;
    });
  };

  const moveTo = (to: string): void => {
    if (!state || to === state.task.column) return;
    void run(() => api.move(state.task.id, to));
  };

  const column = state ? board.columns.find((c) => c.id === state.task.column) : undefined;

  return (
    <>
      <div className="panel-backdrop" onMouseDown={onClose} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="panel-head">
          <span id={titleId} className="panel-id">
            {taskId}
          </span>
          {state && (
            <select
              className="control panel-move"
              aria-label="Колонка"
              value={state.task.column}
              disabled={saving}
              onChange={(e) => moveTo(e.target.value)}
            >
              {!column && <option value={state.task.column}>{state.task.column} (нет в board.yaml)</option>}
              {board.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="button" onClick={onClose} aria-label="Закрыть панель">
            Esc
          </button>
        </header>
        {loadError && <p className="banner banner-error">{loadError}</p>}
        {state && (
          <>
            <div className="panel-body">
              {state.task.errors.length > 0 && (
                <ul className="error-list">
                  {state.task.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
              <input className="panel-title" aria-label="Название" value={state.draft.title} onChange={(e) => setDraft({ title: e.target.value })} />
              <section className="panel-section">
                <h3>Поля</h3>
                <div className="fields-grid">
                  <FieldRow
                    def={ASSIGNEE_FIELD}
                    value={state.draft.assignee || undefined}
                    onChange={(v) => setDraft({ assignee: typeof v === 'string' ? v : '' })}
                  />
                  {board.fields.map((f) => (
                    <FieldRow key={f.id} def={f} value={state.draft.fields[f.id] ?? undefined} onChange={(v) => setField(f.id, v)} />
                  ))}
                </div>
              </section>
              <section className="panel-section">
                <h3>
                  Описание{' '}
                  <button type="button" className="link-button" onClick={() => setEditingDescription((v) => !v)}>
                    {editingDescription ? 'просмотр' : 'редактировать'}
                  </button>
                </h3>
                {editingDescription ? (
                  <textarea
                    className="control"
                    rows={10}
                    aria-label="Описание"
                    value={state.draft.description}
                    onChange={(e) => setDraft({ description: e.target.value })}
                  />
                ) : state.draft.description ? (
                  <Markdown source={state.draft.description} />
                ) : (
                  <p className="description-empty">Описания нет.</p>
                )}
              </section>
              <section className="panel-section">
                <h3>Notes</h3>
                {state.task.notes.length === 0 ? (
                  <p className="description-empty">Заметок нет.</p>
                ) : (
                  <ol className="timeline">
                    {state.task.notes.map((n, i) => (
                      <li key={`${n.at}-${i}`}>
                        <time dateTime={n.at}>{formatTime(n.at)}</time>
                        <span>
                          <strong>{n.by}</strong>: {n.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                <form className="note-form" onSubmit={submitNote}>
                  <input className="control" aria-label="Новая заметка" placeholder="Заметка" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="button" type="submit" disabled={saving || note.trim() === ''}>
                    Добавить
                  </button>
                </form>
              </section>
              <section className="panel-section">
                <h3>История</h3>
                <ol className="timeline">
                  {state.task.history.map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      <time dateTime={h.at}>{formatTime(h.at)}</time>
                      <span>
                        <strong>{h.by}</strong>: {h.from === null ? `создал в ${h.to}` : `${h.from} → ${h.to}`}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <footer className="panel-foot">
              <button type="button" className="button button-primary" disabled={saving || !isDirty(state.task, state.draft)} onClick={save}>
                Сохранить
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
```

Выбор колонки в шапке панели — клавиатурная альтернатива drag-and-drop и способ вытащить задачу из удалённой колонки.

`ui/src/task-panel/CreateTaskDialog.tsx`:
```tsx
import { useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskFull } from '../api/types';
import { ASSIGNEE_FIELD, compactFields, defaultsFor, type Draft } from '../lib/fields';
import { Modal } from '../ui/Modal';
import { FieldRow } from './FieldInput';

export interface CreateTaskDialogProps {
  board: BoardInfo;
  onClose(): void;
  onCreated(task: TaskFull): void;
}

export function CreateTaskDialog({ board, onClose, onCreated }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState(board.columns[0]?.id ?? '');
  const [assignee, setAssignee] = useState('');
  const [fields, setFields] = useState<Draft>(() => defaultsFor(board));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const created = await api.create({
        title,
        description,
        column,
        fields: { ...compactFields(fields), ...(assignee.trim() ? { assignee: assignee.trim() } : {}) },
      });
      onCreated(created);
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Новая задача"
      onClose={onClose}
      onSubmit={() => void submit()}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={saving || title.trim() === ''}>
            Создать
          </button>
        </>
      }
    >
      <div className="field-row">
        <label htmlFor="new-title">
          title <span className="field-required">*</span>
        </label>
        <input id="new-title" className="control" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field-row">
        <label htmlFor="new-column">column</label>
        <select id="new-column" className="control" value={column} onChange={(e) => setColumn(e.target.value)}>
          {board.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <FieldRow def={ASSIGNEE_FIELD} value={assignee || undefined} onChange={(v) => setAssignee(typeof v === 'string' ? v : '')} />
      {board.fields.map((f) => (
        <FieldRow key={f.id} def={f} value={fields[f.id] ?? undefined} onChange={(v) => setFields((prev) => ({ ...prev, [f.id]: v }))} />
      ))}
      <div className="field-row">
        <label htmlFor="new-description">description</label>
        <textarea id="new-description" className="control" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
```

`ui/src/filters/FilterBar.tsx`:
```tsx
import type { BoardInfo, TaskItem } from '../api/types';
import type { Filters } from '../lib/filters';

export interface FilterBarProps {
  board: BoardInfo;
  tasks: TaskItem[];
  filters: Filters;
  onChange(patch: Partial<Filters>): void;
  onCreate(): void;
}

export function FilterBar({ board, tasks, filters, onChange, onCreate }: FilterBarProps) {
  const assignees = [...new Set(tasks.flatMap((t) => (t.assignee ? [t.assignee] : [])))].sort();
  const enumFields = board.fields.filter((f) => (f.type === 'enum' || f.type === 'multi_enum') && f.values);
  return (
    <form role="search" className="filter-bar" onSubmit={(e) => e.preventDefault()}>
      <input
        type="search"
        className="control filter-search"
        aria-label="Поиск по ID и названию"
        placeholder="Поиск: T-012 или слово из названия"
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
      />
      <select className="control" aria-label="Исполнитель" value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })}>
        <option value="">все исполнители</option>
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      {enumFields.map((f) => (
        <select
          key={f.id}
          className="control"
          aria-label={f.id}
          value={filters.fields[f.id] ?? ''}
          onChange={(e) => onChange({ fields: { ...filters.fields, [f.id]: e.target.value } })}
        >
          <option value="">{f.id}: все</option>
          {f.values?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ))}
      <button type="button" className="button button-primary" onClick={onCreate}>
        Новая задача
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Написать `panel.css` и обновить `main.tsx`, `App.tsx`**

`ui/src/styles/panel.css`:
```css
.filter-bar { display: flex; flex: 1 1 24rem; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.filter-bar .control { width: auto; min-width: 8rem; font-size: var(--text-sm); }
.filter-search { flex: 1 1 12rem; }
.filter-bar .button-primary { margin-left: auto; }

.panel-backdrop { position: fixed; inset: 0; z-index: 20; background: oklch(20% 0.02 262 / 0.25); animation: fade-in var(--duration-normal) var(--ease-out-expo); }
.panel { position: fixed; inset: 0 0 0 auto; z-index: 21; display: flex; flex-direction: column; width: min(34rem, 100vw); background: var(--color-surface); border-left: 1px solid var(--color-border); box-shadow: var(--shadow-panel); animation: slide-in var(--duration-normal) var(--ease-out-expo); }
.panel-head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.panel-id { font-family: var(--font-mono); font-size: var(--text-sm); }
.panel-move { width: auto; margin-left: auto; font-size: var(--text-sm); }
.panel-body { flex: 1; display: grid; align-content: start; gap: var(--space-5); padding: var(--space-4); overflow-y: auto; }
.panel-title { width: 100%; padding: var(--space-1) 0; font-size: var(--text-lg); font-weight: 600; background: none; border: 0; border-bottom: 1px solid transparent; }
.panel-title:hover, .panel-title:focus { border-bottom-color: var(--color-border-strong); outline: none; }
.panel-section h3 { margin: 0 0 var(--space-2); font-size: var(--text-2xs); font-weight: 600; letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--color-text-muted); }
.panel-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }

.error-list { margin: 0; padding: var(--space-2) var(--space-3) var(--space-2) var(--space-5); font-size: var(--text-sm); background: var(--color-danger-bg); }
.fields-grid { display: grid; gap: var(--space-3); }
.field-row { display: grid; grid-template-columns: 8rem 1fr; gap: var(--space-1) var(--space-3); align-items: start; }
.field-row > label { padding-top: var(--space-2); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }
.field-guide { grid-column: 2; margin: 0; font-size: var(--text-xs); color: var(--color-text-muted); }
.field-required { color: var(--color-critical); }
.multi { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-3); margin: 0; padding: var(--space-2) 0; border: 0; }
.multi label { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); }
@media (max-width: 30rem) {
  .field-row { grid-template-columns: 1fr; }
  .field-guide { grid-column: 1; }
}

.timeline { display: grid; gap: var(--space-2); margin: 0; padding: 0; font-size: var(--text-sm); list-style: none; }
.timeline li { display: grid; grid-template-columns: auto 1fr; gap: var(--space-1) var(--space-2); }
.timeline time { padding-top: 0.15rem; font-family: var(--font-mono); font-size: var(--text-2xs); color: var(--color-text-muted); }
.note-form { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
.markdown { font-size: var(--text-sm); overflow-wrap: anywhere; }
.markdown > :first-child { margin-top: 0; }
.markdown > :last-child { margin-bottom: 0; }
.markdown code { padding: 0 0.25em; font-family: var(--font-mono); font-size: 0.9em; background: var(--color-surface-sunken); border-radius: 2px; }
.markdown pre { padding: var(--space-3); overflow-x: auto; background: var(--color-surface-sunken); border-radius: var(--radius-control); }
.markdown a { color: var(--color-accent); }
.description-empty { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }
.link-button { padding: 0; font-size: var(--text-xs); font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--color-accent); background: none; border: 0; cursor: pointer; }

.modal-backdrop { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: var(--space-4); background: oklch(20% 0.02 262 / 0.35); animation: fade-in var(--duration-normal) var(--ease-out-expo); }
.modal { width: min(32rem, 100%); max-height: calc(100vh - 2rem); overflow-y: auto; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-panel); box-shadow: var(--shadow-lift); animation: rise-in var(--duration-normal) var(--ease-out-expo); }
.modal-head { padding: var(--space-4) var(--space-4) 0; }
.modal-head h2 { margin: 0; font-size: var(--text-lg); }
.modal-head p { margin: var(--space-1) 0 0; font-size: var(--text-sm); color: var(--color-text-muted); }
.modal-body { display: grid; gap: var(--space-3); padding: var(--space-4); }
.modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: 0 var(--space-4) var(--space-4); }
.form-error { margin: 0; font-size: var(--text-sm); color: var(--color-critical); }

.toasts { position: fixed; right: var(--space-4); bottom: var(--space-4); z-index: 40; display: grid; gap: var(--space-2); width: min(24rem, calc(100vw - 2rem)); }
.toast { display: flex; align-items: start; justify-content: space-between; gap: var(--space-3); padding: var(--space-3); font-size: var(--text-sm); color: var(--color-bg); background: var(--color-text); border-left: 3px solid var(--color-accent); border-radius: var(--radius-control); box-shadow: var(--shadow-lift); animation: rise-in var(--duration-normal) var(--ease-out-expo); }
.toast[data-kind='error'] { border-left-color: var(--color-critical); }
.toast button { color: inherit; background: none; border: 0; opacity: 0.7; cursor: pointer; }

@keyframes fade-in { from { opacity: 0; } }
@keyframes slide-in { from { transform: translateX(100%); } }
@keyframes rise-in { from { opacity: 0; transform: translateY(8px); } }
```

`ui/src/main.tsx` — добавь импорт `./styles/panel.css` после `./styles/board.css`; остальное без изменений:
```tsx
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/board.css';
import './styles/panel.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root не найден в index.html');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`ui/src/App.tsx` (версия задачи 15):
```tsx
import { useCallback, useState } from 'react';
import { Board } from './board/Board';
import { FilterBar } from './filters/FilterBar';
import { useBoardData } from './hooks/useBoardData';
import { useUrlFilters } from './hooks/useUrlFilters';
import { applyFilters } from './lib/filters';
import { CreateTaskDialog } from './task-panel/CreateTaskDialog';
import { TaskPanel } from './task-panel/TaskPanel';
import { Banners } from './ui/Banners';
import { ToastStack, useToasts } from './ui/Toast';

export function App() {
  const { board, list, error, version, refresh } = useBoardData();
  const [filters, setFilters] = useUrlFilters();
  const { items: toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const [creating, setCreating] = useState(false);
  const openTask = useCallback((id: string) => setFilters({ task: id }), [setFilters]);
  const closeTask = useCallback(() => setFilters({ task: null }), [setFilters]);

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
        <Board board={board} tasks={visible} onOpen={openTask} />
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
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
```

- [ ] **Step 8: Проверить сборку и вручную в браузере**

Run: `npx vitest run ui/src/lib && npm run typecheck && npm run build`
Expected: PASS, сборка без ошибок.

Запусти `desk ui` в демо-проекте (как в Task 14, Step 10) и проверь руками: «Новая задача» создаёт карточку; клик по названию открывает панель; правка поля и «Сохранить» меняют файл в `.desk/tasks/`; поиск меняет `?q=` в URL; Esc закрывает панель; ссылка `[x](javascript:alert(1))` в описании не становится ссылкой.

- [ ] **Step 9: Commit**

```bash
git add ui
git commit -m "feat: add task panel, creation dialog, URL filters and safe markdown"
```
