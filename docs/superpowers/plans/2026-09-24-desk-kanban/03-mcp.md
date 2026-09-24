# Часть 3. MCP (задачи 9–11)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: `docs/superpowers/specs/2026-09-24-desk-kanban-design.md`, раздел 5.

---

### Task 9: BoardHolder и наблюдатель за `.desk/`

**Files:**
- Create: `src/core/board-holder.ts`, `src/core/watch.ts`
- Test: `tests/integration/board-holder.test.ts`, `tests/integration/watch.test.ts`

**Interfaces:**
- Consumes: `findRoot`, `boardPath`, `deskDir`, `TASK_FILE_RE` (Task 1); `loadBoard` (Task 3); `DeskError`, `isDeskError`
- Produces:
  - `type ReloadResult = 'changed' | 'unchanged' | 'invalid'`
  - `interface BoardHolder { readonly root: string | null; current(): Board | null; read(): Board; write(): Board; requireRoot(): string; reload(): Promise<ReloadResult> }`
    - `read()` — последняя валидная доска (для чтения), иначе бросает текущую ошибку
    - `write()` — бросает `INVALID_BOARD`, если текущий `board.yaml` невалиден, даже если есть прежняя доска
  - `createBoardHolder(cwd: string, env?: NodeJS.ProcessEnv): Promise<BoardHolder>`
  - `type DeskEvent = { type: 'task_changed'; id: string } | { type: 'task_removed'; id: string } | { type: 'board_changed' }`
  - `watchDesk(root: string, onEvent: (e: DeskEvent) => void, debounceMs?: number): { ready: Promise<void>; close(): Promise<void> }`

- [ ] **Step 1: Написать падающие тесты**

`tests/integration/board-holder.test.ts`:
```ts
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
```

`tests/integration/watch.test.ts`:
```ts
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardPath, taskPath } from '../../src/core/paths.js';
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
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/integration/board-holder.test.ts tests/integration/watch.test.ts`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать**

`src/core/board-holder.ts`:
```ts
import { loadBoard } from './board-loader.js';
import { DeskError, isDeskError } from './errors.js';
import { findRoot } from './paths.js';
import type { Board } from './types.js';

export type ReloadResult = 'changed' | 'unchanged' | 'invalid';

export interface BoardHolder {
  readonly root: string | null;
  current(): Board | null;
  read(): Board;
  write(): Board;
  requireRoot(): string;
  reload(): Promise<ReloadResult>;
}

export async function createBoardHolder(cwd: string, env: NodeJS.ProcessEnv = process.env): Promise<BoardHolder> {
  let root: string | null = null;
  let current: Board | null = null;
  let error: DeskError | null = null;

  try {
    root = findRoot(cwd, env);
  } catch (e) {
    if (!isDeskError(e)) throw e;
    error = e;
  }

  const fallbackError = (): DeskError => error ?? new DeskError('INVALID_BOARD', 'board.yaml ещё не загружен');

  const reload = async (): Promise<ReloadResult> => {
    if (root === null) return 'invalid';
    try {
      const next = await loadBoard(root);
      const changed = JSON.stringify(next) !== JSON.stringify(current);
      current = next;
      error = null;
      return changed ? 'changed' : 'unchanged';
    } catch (e) {
      if (!isDeskError(e)) throw e;
      error = e;
      return 'invalid';
    }
  };

  await reload();

  return {
    get root() {
      return root;
    },
    current: () => current,
    read: () => {
      if (current) return current;
      throw fallbackError();
    },
    write: () => {
      if (error) throw error;
      if (!current) throw fallbackError();
      return current;
    },
    requireRoot: () => {
      if (root === null) throw fallbackError();
      return root;
    },
    reload,
  };
}
```

`src/core/watch.ts`:
```ts
import { basename, dirname } from 'node:path';
import chokidar from 'chokidar';
import { DESK_DIR, TASK_FILE_RE, deskDir } from './paths.js';

export type DeskEvent =
  | { type: 'task_changed'; id: string }
  | { type: 'task_removed'; id: string }
  | { type: 'board_changed' };

export interface DeskWatcher {
  ready: Promise<void>;
  close(): Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 50;

export function watchDesk(
  root: string,
  onEvent: (event: DeskEvent) => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): DeskWatcher {
  const timers = new Map<string, NodeJS.Timeout>();
  const schedule = (key: string, event: DeskEvent): void => {
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        onEvent(event);
      }, debounceMs),
    );
  };

  const watcher = chokidar.watch(deskDir(root), {
    ignoreInitial: true,
    ignored: (path: string) => path.endsWith('.tmp') || path.endsWith('.lock'),
  });

  const handle = (kind: 'add' | 'change' | 'unlink') => (path: string): void => {
    const name = basename(path);
    const parent = basename(dirname(path));
    if (name === 'board.yaml' && parent === DESK_DIR) {
      schedule('board.yaml', { type: 'board_changed' });
      return;
    }
    const match = TASK_FILE_RE.exec(name);
    if (!match?.[1] || parent !== 'tasks') return;
    const id = match[1];
    schedule(id, kind === 'unlink' ? { type: 'task_removed', id } : { type: 'task_changed', id });
  };

  watcher.on('add', handle('add')).on('change', handle('change')).on('unlink', handle('unlink'));
  const ready = new Promise<void>((resolve) => watcher.once('ready', () => resolve()));

  return {
    ready,
    close: async () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      await watcher.close();
    },
  };
}
```

Примечание: пути сравниваются по имени файла и имени родительской папки, а не полностью: на macOS `chokidar` может вернуть `/private/var/...` вместо `/var/...`.

- [ ] **Step 4: Запустить тесты**

Run: `npx vitest run tests/integration/board-holder.test.ts tests/integration/watch.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/board-holder.ts src/core/watch.ts tests/integration/board-holder.test.ts tests/integration/watch.test.ts
git commit -m "feat: add board holder with hot reload and .desk file watcher"
```

---

### Task 10: MCP — схемы tools и обработчики

**Files:**
- Create: `src/mcp/input-schema.ts`, `src/mcp/tools.ts`
- Test: `tests/unit/input-schema.test.ts`, `tests/integration/tools.test.ts`

**Interfaces:**
- Consumes: `BoardHolder`, `createBoardHolder` (Task 9); `loadAll`, `readableTasks`, `getTask`, `createTask`, `updateTask`, `moveTask`, `addNote` (Task 7); `presentBoard`, `presentTask`, `presentLoaded`, `presentTaskList` (Task 7); `ASSIGNEE_GUIDE` (Task 2); `DeskError`
- Produces:
  - `toolDefinitions(board: Board | null): Tool[]` — 7 tools, JSON Schema строится из `board.yaml`
  - `fieldJsonSchema(field: FieldDef, nullable: boolean): Record<string, unknown>`
  - `interface ToolContext { holder: BoardHolder; clock?: Clock }`
  - `callTool(ctx: ToolContext, name: string, args: unknown): Promise<unknown>` — возвращает JSON-данные или бросает `DeskError`
  - константы `TOOL_NAMES`, `DEFAULT_LIMIT = 50`, `MAX_LIMIT = 200`

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/input-schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fieldJsonSchema, toolDefinitions } from '../../src/mcp/input-schema.js';
import { testBoard } from '../helpers/board.js';

const board = testBoard();
const tool = (name: string) => {
  const found = toolDefinitions(board).find((t) => t.name === name);
  if (!found) throw new Error(`нет tool ${name}`);
  return found;
};
type Props = Record<string, Record<string, unknown>>;
const props = (name: string): Props => tool(name).inputSchema.properties as Props;

describe('toolDefinitions', () => {
  it('7 tools', () => {
    expect(toolDefinitions(board).map((t) => t.name)).toEqual([
      'get_board', 'list_tasks', 'get_task', 'create_task', 'update_task', 'move_task', 'add_note',
    ]);
  });

  it('create_task: enum колонок и полей, guide в description, обязательные параметры', () => {
    expect(props('create_task').column).toMatchObject({ enum: ['backlog', 'in_progress', 'review', 'done'] });
    const fields = props('create_task').fields as { properties: Props; additionalProperties: boolean };
    expect(fields.additionalProperties).toBe(false);
    expect(fields.properties.priority).toMatchObject({ type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] });
    expect(String(fields.properties.priority?.description)).toContain('p0 — прод лежит.');
    expect(String(fields.properties.priority?.description)).toContain('Обязательное');
    expect(fields.properties.assignee).toMatchObject({ type: 'string' });
    expect(tool('create_task').inputSchema.required).toEqual(['actor', 'title']);
  });

  it('move_task: to — enum колонок; поля допускают null', () => {
    expect(props('move_task').to).toMatchObject({ enum: ['backlog', 'in_progress', 'review', 'done'] });
    const fields = props('move_task').fields as { properties: Props };
    expect(fields.properties.estimate).toMatchObject({ anyOf: [{ type: 'number', minimum: 0, maximum: 100 }, { type: 'null' }] });
    expect(tool('move_task').inputSchema.required).toEqual(['actor', 'id', 'to']);
  });

  it('без доски — общие схемы без enum', () => {
    const defs = toolDefinitions(null);
    expect(defs).toHaveLength(7);
    const create = defs.find((t) => t.name === 'create_task');
    expect((create?.inputSchema.properties as Props).column).toEqual({ type: 'string' });
  });
});

describe('fieldJsonSchema', () => {
  it.each([
    ['summary', { type: 'string', maxLength: 200 }],
    ['acceptance', { type: 'string' }],
    ['flaky', { type: 'boolean' }],
    ['due', { type: 'string', format: 'date' }],
    ['pr_url', { type: 'string', format: 'uri' }],
    ['area', { type: 'array', items: { type: 'string', enum: ['backend', 'frontend'] }, uniqueItems: true }],
    ['blocked_by', { type: 'string', pattern: '^[A-Za-z]+-\\d+$' }],
  ])('%s', (id, expected) => {
    const field = board.fields.find((f) => f.id === id);
    if (!field) throw new Error(id);
    expect(fieldJsonSchema(field, false)).toMatchObject(expected);
  });

  it('default попадает в description', () => {
    const priority = board.fields[0];
    if (!priority) throw new Error('priority');
    expect(String(fieldJsonSchema(priority, false).description)).toContain('По умолчанию: "p2"');
  });
});
```

`tests/integration/tools.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoardHolder } from '../../src/core/board-holder.js';
import { callTool, type ToolContext } from '../../src/mcp/tools.js';
import { catchErrorAsync } from '../helpers/errors.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';

let ctx: ToolContext;
beforeEach(async () => {
  ctx = { holder: await createBoardHolder(await makeProject(), {}), clock: fixedClock() };
});

const create = (args: Record<string, unknown> = {}) =>
  callTool(ctx, 'create_task', { actor: 'planner', title: 'Задача', ...args }) as Promise<{ id: string; column: string }>;

describe('callTool', () => {
  it('get_board: guide, колонки со счётчиками, поля', async () => {
    await create();
    const board = (await callTool(ctx, 'get_board', {})) as { guide: string; columns: { id: string; count: number }[] };
    expect(board.guide).toBe('Общие правила.');
    expect(board.columns[0]).toMatchObject({ id: 'backlog', count: 1 });
  });

  it('create_task → get_task', async () => {
    const created = await create({ description: 'Описание', fields: { priority: 'p0' } });
    expect(created).toMatchObject({ id: 'T-001', column: 'backlog' });
    const full = (await callTool(ctx, 'get_task', { id: 'T-001' })) as { description: string; fields: object };
    expect(full).toMatchObject({ description: 'Описание', fields: { priority: 'p0' } });
  });

  it('list_tasks: фильтр where и limit по умолчанию', async () => {
    for (let i = 0; i < 3; i++) await create({ fields: { priority: i === 0 ? 'p0' : 'p2' } });
    const list = (await callTool(ctx, 'list_tasks', { where: { priority: 'p0' } })) as { tasks: { id: string }[]; total: number };
    expect(list.tasks.map((t) => t.id)).toEqual(['T-001']);
    expect(list.total).toBe(1);
  });

  it('list_tasks: limit больше 200 — BAD_REQUEST', async () => {
    expect((await catchErrorAsync(() => callTool(ctx, 'list_tasks', { limit: 500 }))).code).toBe('BAD_REQUEST');
  });

  it('move_task с fields закрывает requires; add_note', async () => {
    await create();
    const moved = (await callTool(ctx, 'move_task', { actor: 'dev', id: 'T-001', to: 'in_progress', fields: { assignee: 'dev' } })) as { column: string; assignee: string };
    expect(moved).toMatchObject({ column: 'in_progress', assignee: 'dev' });
    const noted = (await callTool(ctx, 'add_note', { actor: 'dev', id: 'T-001', text: 'готово' })) as { notes: { text: string }[] };
    expect(noted.notes[0]?.text).toBe('готово');
  });

  it('update_task: null удаляет поле', async () => {
    await create({ fields: { estimate: 3 } });
    const updated = (await callTool(ctx, 'update_task', { actor: 'dev', id: 'T-001', fields: { estimate: null } })) as { fields: object };
    expect(updated.fields).toEqual({ priority: 'p2' });
  });

  it.each([
    ['без actor', 'create_task', { title: 'X' }],
    ['лишний ключ на верхнем уровне', 'create_task', { actor: 'a', title: 'X', priority: 'p0' }],
    ['fields не объект', 'create_task', { actor: 'a', title: 'X', fields: 'p0' }],
    ['неизвестный tool', 'delete_task', {}],
    ['без id', 'get_task', {}],
  ])('%s → BAD_REQUEST', async (_name, tool, args) => {
    expect((await catchErrorAsync(() => callTool(ctx, tool, args))).code).toBe('BAD_REQUEST');
  });

  it('ошибки ядра проходят как есть', async () => {
    await create();
    const err = await catchErrorAsync(() => callTool(ctx, 'move_task', { actor: 'dev', id: 'T-001', to: 'done' }));
    expect(err.toJSON()).toMatchObject({ code: 'TRANSITION_FORBIDDEN', allowed: ['in_progress'] });
  });

  it('без .desk — INVALID_BOARD', async () => {
    const empty: ToolContext = { holder: await createBoardHolder(await makeEmptyDir(), {}) };
    expect((await catchErrorAsync(() => callTool(empty, 'get_board', {}))).code).toBe('INVALID_BOARD');
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/input-schema.test.ts tests/integration/tools.test.ts`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать `src/mcp/input-schema.ts`**

```ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Board, FieldDef } from '../core/types.js';
import { ASSIGNEE_GUIDE } from '../core/validate.js';

type JsonSchema = Record<string, unknown>;

function baseSchema(field: FieldDef): JsonSchema {
  switch (field.type) {
    case 'string':
      return { type: 'string', maxLength: 200 };
    case 'text':
      return { type: 'string' };
    case 'number':
      return {
        type: 'number',
        ...(field.min === undefined ? {} : { minimum: field.min }),
        ...(field.max === undefined ? {} : { maximum: field.max }),
      };
    case 'bool':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'url':
      return { type: 'string', format: 'uri' };
    case 'enum':
      return { type: 'string', enum: field.values ?? [] };
    case 'multi_enum':
      return { type: 'array', items: { type: 'string', enum: field.values ?? [] }, uniqueItems: true };
    case 'task_ref':
      return { type: 'string', pattern: '^[A-Za-z]+-\\d+$' };
  }
}

export function fieldJsonSchema(field: FieldDef, nullable: boolean): JsonSchema {
  const description = [
    field.guide,
    field.required ? 'Обязательное поле.' : null,
    field.default === undefined ? null : `По умолчанию: ${JSON.stringify(field.default)}.`,
    nullable && !field.required ? 'null удаляет значение.' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const base = baseSchema(field);
  const described = description === '' ? {} : { description };
  return nullable ? { anyOf: [base, { type: 'null' }], ...described } : { ...base, ...described };
}

function fieldsSchema(board: Board | null, nullable: boolean): JsonSchema {
  if (!board) return { type: 'object', description: 'Поля задачи. Схему смотри в get_board.' };
  const assignee = nullable
    ? { anyOf: [{ type: 'string' }, { type: 'null' }], description: `${ASSIGNEE_GUIDE} null снимает исполнителя.` }
    : { type: 'string', description: ASSIGNEE_GUIDE };
  return {
    type: 'object',
    description: 'Поля задачи из board.yaml.',
    properties: {
      ...Object.fromEntries(board.fields.map((f) => [f.id, fieldJsonSchema(f, nullable)])),
      assignee,
    },
    additionalProperties: false,
  };
}

const object = (properties: Record<string, JsonSchema>, required: string[] = []): Tool['inputSchema'] => ({
  type: 'object',
  properties,
  ...(required.length > 0 ? { required } : {}),
  additionalProperties: false,
});

export function toolDefinitions(board: Board | null): Tool[] {
  const column: JsonSchema = board ? { type: 'string', enum: board.columns.map((c) => c.id) } : { type: 'string' };
  const actor = { type: 'string', description: 'Твоё имя агента, например backend-agent. Пишется в историю.' };
  const id = { type: 'string', description: 'ID задачи, например T-012.' };

  return [
    {
      name: 'get_board',
      description: 'Схема доски: общие правила (guide), колонки с guide и WIP-лимитами, поля с типами и guide, разрешённые переходы, число задач в колонках. Вызывай первым.',
      inputSchema: object({}),
    },
    {
      name: 'list_tasks',
      description: 'Список задач, отсортированный по priority и дате создания. Фильтры объединяются через И. Перед созданием задачи ищи дубликаты через query.',
      inputSchema: object({
        column,
        assignee: { type: 'string' },
        query: { type: 'string', description: 'Подстрока в title или описании, без учёта регистра.' },
        where: { type: 'object', description: 'Точное совпадение по полям, например {"priority":"p0"}. Для multi_enum — значение содержится в массиве.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      }),
    },
    {
      name: 'get_task',
      description: 'Вся задача: поля, описание, notes, history и ошибки валидности.',
      inputSchema: object({ id }, ['id']),
    },
    {
      name: 'create_task',
      description: 'Создать задачу. Без column задача попадает в первую колонку. Поля проверяются по board.yaml; при ошибке придут code, guide и allowed — исправь и повтори.',
      inputSchema: object(
        {
          actor,
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', description: 'Markdown.' },
          column,
          fields: fieldsSchema(board, false),
        },
        ['actor', 'title'],
      ),
    },
    {
      name: 'update_task',
      description: 'Изменить title, описание или поля. Колонку меняет только move_task.',
      inputSchema: object(
        { actor, id, title: { type: 'string', maxLength: 200 }, description: { type: 'string' }, fields: fieldsSchema(board, true) },
        ['actor', 'id'],
      ),
    },
    {
      name: 'move_task',
      description: 'Перенести задачу в колонку to. Поля, которые требует переход (requires), передай в fields этим же вызовом.',
      inputSchema: object({ actor, id, to: column, fields: fieldsSchema(board, true) }, ['actor', 'id', 'to']),
    },
    {
      name: 'add_note',
      description: 'Добавить заметку в раздел Notes задачи: решение, находку, причину блокировки. Одна строка.',
      inputSchema: object({ actor, id, text: { type: 'string', maxLength: 2000 } }, ['actor', 'id', 'text']),
    },
  ];
}
```

- [ ] **Step 4: Реализовать `src/mcp/tools.ts`**

```ts
import { z } from 'zod';
import type { BoardHolder } from '../core/board-holder.js';
import { DeskError } from '../core/errors.js';
import { presentBoard, presentLoaded, presentTask, presentTaskList } from '../core/present.js';
import { addNote, createTask, getTask, loadAll, moveTask, readableTasks, updateTask } from '../core/task-store.js';
import type { Clock } from '../core/types.js';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export interface ToolContext {
  holder: BoardHolder;
  clock?: Clock;
}

const actor = z.string({ required_error: 'передай имя агента' });
const id = z.string({ required_error: 'передай ID задачи' });
const fields = z.record(z.unknown()).optional();

const argSchemas = {
  get_board: z.object({}).strict(),
  list_tasks: z
    .object({
      column: z.string().optional(),
      assignee: z.string().optional(),
      query: z.string().optional(),
      where: z.record(z.unknown()).optional(),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    })
    .strict(),
  get_task: z.object({ id }).strict(),
  create_task: z
    .object({ actor, title: z.string(), description: z.string().optional(), column: z.string().optional(), fields })
    .strict(),
  update_task: z
    .object({ actor, id, title: z.string().optional(), description: z.string().optional(), fields })
    .strict(),
  move_task: z.object({ actor, id, to: z.string(), fields }).strict(),
  add_note: z.object({ actor, id, text: z.string() }).strict(),
};

export type ToolName = keyof typeof argSchemas;
export const TOOL_NAMES = Object.keys(argSchemas) as ToolName[];

function parseArgs<N extends ToolName>(name: N, raw: unknown): z.infer<(typeof argSchemas)[N]> {
  const result = argSchemas[name].safeParse(raw ?? {});
  if (!result.success) {
    const [issue] = result.error.issues;
    const where = issue?.path.length ? issue.path.join('.') : 'аргументы';
    throw new DeskError('BAD_REQUEST', `${name}: ${where}: ${issue?.message ?? 'неверные аргументы'}`);
  }
  return result.data as z.infer<(typeof argSchemas)[N]>;
}

function isToolName(name: string): name is ToolName {
  return (TOOL_NAMES as string[]).includes(name);
}

export async function callTool(ctx: ToolContext, name: string, raw: unknown): Promise<unknown> {
  if (!isToolName(name)) {
    throw new DeskError('BAD_REQUEST', `Неизвестный tool: ${name}. Доступны: ${TOOL_NAMES.join(', ')}`);
  }
  const { holder } = ctx;
  const clock = ctx.clock ?? (() => new Date());

  switch (name) {
    case 'get_board': {
      parseArgs(name, raw);
      const board = holder.read();
      return presentBoard(board, readableTasks(await loadAll(holder.requireRoot(), board)));
    }
    case 'list_tasks': {
      const args = parseArgs(name, raw);
      const board = holder.read();
      return presentTaskList(board, await loadAll(holder.requireRoot(), board), { ...args, limit: args.limit ?? DEFAULT_LIMIT });
    }
    case 'get_task': {
      const args = parseArgs(name, raw);
      const board = holder.read();
      return presentLoaded(await getTask(holder.requireRoot(), board, args.id));
    }
    case 'create_task': {
      const args = parseArgs(name, raw);
      const task = await createTask(
        holder.requireRoot(),
        holder.write(),
        { title: args.title, description: args.description, column: args.column, fields: args.fields },
        args.actor,
        clock,
      );
      return presentTask(task, []);
    }
    case 'update_task': {
      const args = parseArgs(name, raw);
      const task = await updateTask(
        holder.requireRoot(),
        holder.write(),
        args.id,
        { title: args.title, description: args.description, fields: args.fields },
        args.actor,
        clock,
      );
      return presentTask(task, []);
    }
    case 'move_task': {
      const args = parseArgs(name, raw);
      const task = await moveTask(holder.requireRoot(), holder.write(), args.id, args.to, args.fields ?? {}, args.actor, clock);
      return presentTask(task, []);
    }
    case 'add_note': {
      const args = parseArgs(name, raw);
      const task = await addNote(holder.requireRoot(), holder.write(), args.id, args.text, args.actor, clock);
      return presentTask(task, []);
    }
  }
}
```

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run tests/unit/input-schema.test.ts tests/integration/tools.test.ts && npx tsc --noEmit`
Expected: PASS. Если `tsc` ругается на тип `Tool['inputSchema']` (в новых версиях SDK он строже), приведи `object()` к `as Tool['inputSchema']` — форма JSON Schema при этом не меняется.

- [ ] **Step 6: Commit**

```bash
git add src/mcp/input-schema.ts src/mcp/tools.ts tests/unit/input-schema.test.ts tests/integration/tools.test.ts
git commit -m "feat: add MCP tool schemas generated from board.yaml and tool handlers"
```

---

### Task 11: MCP — сервер, stdio, `list_changed`

**Files:**
- Create: `src/mcp/server.ts`
- Test: `tests/integration/mcp.test.ts` (stdio-тест — в Task 13, когда появится `src/cli/index.ts`)

**Interfaces:**
- Consumes: `toolDefinitions` (Task 10), `callTool` (Task 10), `createBoardHolder`, `watchDesk` (Task 9), `isDeskError`, `VERSION`
- Produces:
  - `INSTRUCTIONS: string`
  - `interface DeskMcp { server: Server; holder: BoardHolder; ready: Promise<void>; close(): Promise<void> }`
  - `createDeskMcp(opts: { cwd: string; env?: NodeJS.ProcessEnv; watch?: boolean; clock?: Clock }): Promise<DeskMcp>`
  - `runStdio(cwd: string, env: NodeJS.ProcessEnv): Promise<void>` — используется в CLI (Task 13)

- [ ] **Step 1: Проверить API SDK**

Run: `node -e "import('@modelcontextprotocol/sdk/server/index.js').then(m => console.log(typeof m.Server.prototype.sendToolListChanged))"`
Expected: `function`. Если выводит `undefined`, открой документацию SDK через context7 (`/modelcontextprotocol/typescript-sdk`) и найди текущее имя метода отправки `notifications/tools/list_changed`; замени вызов в Step 3.

- [ ] **Step 2: Написать падающие тесты**

`tests/integration/mcp.test.ts`:
```ts
import { readFile, writeFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardPath } from '../../src/core/paths.js';
import { INSTRUCTIONS, createDeskMcp, type DeskMcp } from '../../src/mcp/server.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';

const open: DeskMcp[] = [];
afterEach(async () => {
  await Promise.all(open.splice(0).map((m) => m.close()));
});

async function connect(cwd: string): Promise<{ client: Client; mcp: DeskMcp }> {
  const mcp = await createDeskMcp({ cwd, env: {}, clock: fixedClock() });
  open.push(mcp);
  await mcp.ready;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcp.server.connect(serverTransport);
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(clientTransport);
  return { client, mcp };
}

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
const payload = (result: unknown): Record<string, unknown> => JSON.parse((result as ToolResult).content[0]?.text ?? 'null');

describe('desk MCP server', () => {
  it('отдаёт instructions и 7 tools', async () => {
    const { client } = await connect(await makeProject());
    expect(client.getInstructions()).toBe(INSTRUCTIONS);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain('move_task');
  });

  it('успех — JSON в text content', async () => {
    const { client } = await connect(await makeProject());
    const result = await client.callTool({ name: 'create_task', arguments: { actor: 'planner', title: 'Через MCP' } });
    expect((result as ToolResult).isError).toBeFalsy();
    expect(payload(result)).toMatchObject({ id: 'T-001', title: 'Через MCP' });
  });

  it('ошибка — isError и JSON ошибки с guide', async () => {
    const { client } = await connect(await makeProject());
    await client.callTool({ name: 'create_task', arguments: { actor: 'planner', title: 'X' } });
    const result = await client.callTool({ name: 'move_task', arguments: { actor: 'dev', id: 'T-001', to: 'in_progress' } });
    expect((result as ToolResult).isError).toBe(true);
    expect(payload(result)).toMatchObject({ code: 'TRANSITION_REQUIRES', field: 'assignee' });
  });

  it('правка board.yaml → notifications/tools/list_changed и новая схема', async () => {
    const root = await makeProject();
    const { client } = await connect(root);
    const notified = vi.fn();
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => notified());
    const text = await readFile(boardPath(root), 'utf8');
    await writeFile(boardPath(root), text.replace('values: [p0, p1, p2, p3]', 'values: [p0, p1, p2, p3, p4]'));
    await vi.waitFor(() => expect(notified).toHaveBeenCalled(), { timeout: 3000 });
    const { tools } = await client.listTools();
    const create = tools.find((t) => t.name === 'create_task');
    const fields = (create?.inputSchema.properties as Record<string, { properties: Record<string, { enum: string[] }> }>).fields;
    expect(fields?.properties.priority?.enum).toContain('p4');
  });

  it('сломанный board.yaml после старта: запись INVALID_BOARD, чтение работает', async () => {
    const root = await makeProject();
    const { client, mcp } = await connect(root);
    await writeFile(boardPath(root), 'version: 1\ncolumns: [\n');
    await vi.waitFor(async () => {
      await mcp.holder.reload();
      const result = await client.callTool({ name: 'create_task', arguments: { actor: 'a', title: 'X' } });
      expect(payload(result)).toMatchObject({ code: 'INVALID_BOARD' });
    }, { timeout: 3000 });
    const list = await client.callTool({ name: 'list_tasks', arguments: {} });
    expect((list as ToolResult).isError).toBeFalsy();
  });

  it('без .desk: tools есть, вызовы — INVALID_BOARD с подсказкой', async () => {
    const { client } = await connect(await makeEmptyDir());
    expect((await client.listTools()).tools).toHaveLength(7);
    const result = await client.callTool({ name: 'get_board', arguments: {} });
    expect(payload(result)).toMatchObject({ code: 'INVALID_BOARD' });
    expect(String(payload(result).message)).toContain('desk init');
  });
});
```

- [ ] **Step 3: Запустить и убедиться, что падает**

Run: `npx vitest run tests/integration/mcp.test.ts`
Expected: FAIL — модуль `server.js` не найден.

- [ ] **Step 4: Реализовать `src/mcp/server.ts`**

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createBoardHolder, type BoardHolder } from '../core/board-holder.js';
import { isDeskError } from '../core/errors.js';
import type { Clock } from '../core/types.js';
import { watchDesk } from '../core/watch.js';
import { VERSION } from '../version.js';
import { toolDefinitions } from './input-schema.js';
import { callTool } from './tools.js';

export const INSTRUCTIONS =
  'Это канбан-доска проекта. Сначала вызови get_board и следуй guide доски, колонок и полей. ' +
  'В actor передавай своё имя агента. При ошибке читай code, guide и allowed и исправляй вызов.';

export interface DeskMcp {
  server: Server;
  holder: BoardHolder;
  ready: Promise<void>;
  close(): Promise<void>;
}

export interface DeskMcpOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  watch?: boolean;
  clock?: Clock;
}

const text = (value: unknown): { type: 'text'; text: string } => ({ type: 'text', text: JSON.stringify(value, null, 2) });

export async function createDeskMcp(opts: DeskMcpOptions): Promise<DeskMcp> {
  const holder = await createBoardHolder(opts.cwd, opts.env ?? process.env);
  const server = new Server(
    { name: 'desk', version: VERSION },
    { capabilities: { tools: { listChanged: true } }, instructions: INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions(holder.current()) }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const data = await callTool({ holder, clock: opts.clock }, request.params.name, request.params.arguments);
      return { content: [text(data)] };
    } catch (e) {
      if (isDeskError(e)) return { isError: true, content: [text(e.toJSON())] };
      process.stderr.write(`desk mcp: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
      throw e;
    }
  });

  const watcher =
    opts.watch !== false && holder.root !== null
      ? watchDesk(holder.root, (event) => {
          if (event.type !== 'board_changed') return;
          void holder
            .reload()
            .then((result) => (result === 'changed' ? server.sendToolListChanged() : undefined))
            .catch((e: unknown) => {
              process.stderr.write(`desk mcp: не удалось перечитать board.yaml: ${String(e)}\n`);
            });
        })
      : null;

  return {
    server,
    holder,
    ready: watcher?.ready ?? Promise.resolve(),
    close: async () => {
      await watcher?.close();
      await server.close();
    },
  };
}

export async function runStdio(cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  const mcp = await createDeskMcp({ cwd, env });
  await mcp.server.connect(new StdioServerTransport());
}
```

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run tests/integration/mcp.test.ts && npx tsc --noEmit`
Expected: PASS (6 тестов).

- [ ] **Step 6: Commit**

```bash
git add src/mcp/server.ts tests/integration/mcp.test.ts
git commit -m "feat: add desk MCP server with hot schema reload"
```
