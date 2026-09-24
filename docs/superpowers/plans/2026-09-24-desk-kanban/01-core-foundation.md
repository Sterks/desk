# Часть 1. Ядро: основа (задачи 1–4)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: `docs/superpowers/specs/2026-09-24-desk-kanban-design.md`.

---

### Task 1: Каркас проекта, ошибки, типы, поиск корня

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `.gitignore`
- Create: `src/version.ts`, `src/core/errors.ts`, `src/core/types.ts`, `src/core/paths.ts`
- Create: `tests/helpers/project.ts`, `tests/helpers/errors.ts`
- Test: `tests/unit/errors.test.ts`, `tests/unit/paths.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `DeskError(code: ErrorCode, message: string, details?: { field?: string; guide?: string; allowed?: unknown[] })`, `.code`, `.details`, `.toJSON(): DeskErrorJson`; `isDeskError(e: unknown): e is DeskError`
  - типы `Board`, `ColumnDef`, `Transition`, `FieldDef`, `FieldType`, `FieldValue`, `Task`, `HistoryEntry`, `Note`, `LoadedTask`, `Clock`; константы `FIELD_TYPES`, `BUILTIN_FIELDS`
  - `findRoot(cwd: string, env?: NodeJS.ProcessEnv): string`; `deskDir`, `boardPath`, `tasksDir`, `lockPath`, `taskPath(root, id)`; `TASK_FILE_RE`
  - тест-хелперы `makeProject(boardYaml?: string): Promise<string>`, `TEST_BOARD`, `fixedClock(iso?)`, `catchError(fn)`, `catchErrorAsync(fn)`

- [ ] **Step 1: Создать package.json и конфиги**

`package.json`:
```json
{
  "name": "desk",
  "version": "0.1.0",
  "description": "Kanban board for AI agents with an MCP server",
  "type": "module",
  "bin": { "desk": "dist/cli/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "npm run build:server && npm run build:ui",
    "build:server": "tsc -p tsconfig.build.json",
    "build:ui": "vite build --config ui/vite.config.ts",
    "dev:ui": "vite --config ui/vite.config.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "npm run build && playwright test"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "tests/unit", "tests/integration", "tests/helpers", "vitest.config.ts"]
}
```

`tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": false, "outDir": "dist", "rootDir": "src", "sourceMap": true },
  "include": ["src"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'ui/src/**/*.test.ts'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/mcp/**', 'src/http/**'],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
```

`.gitignore`:
```
node_modules/
dist/
coverage/
test-results/
playwright-report/
tests/e2e/.tmp-project/
```

- [ ] **Step 2: Установить зависимости**

Run:
```bash
npm install @modelcontextprotocol/sdk@^1 zod@^3.25 yaml@^2 chokidar@^4
npm install -D typescript@^5 @types/node@^20 vitest@^3 @vitest/coverage-v8@^3 tsx@^4
```
Expected: `package.json` получил `dependencies` и `devDependencies`, создан `package-lock.json`.

- [ ] **Step 3: Написать тест-хелперы**

`tests/helpers/project.ts`:
```ts
import { mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const TEST_BOARD = `version: 1
name: test
id_prefix: T
guide: Общие правила.
columns:
  - id: backlog
    title: Backlog
    guide: Новые задачи.
  - id: in_progress
    title: In progress
    wip_limit: 2
    guide: В работе.
  - id: review
    title: Review
  - id: done
    title: Done
transitions:
  - from: backlog
    to: in_progress
    requires: [assignee]
  - from: in_progress
    to: review
    requires: [pr_url]
  - from: in_progress
    to: backlog
  - from: review
    to: [in_progress, done]
fields:
  - id: priority
    type: enum
    values: [p0, p1, p2, p3]
    required: true
    default: p2
    guide: p0 — прод лежит.
  - id: area
    type: multi_enum
    values: [backend, frontend]
  - id: pr_url
    type: url
    guide: Ссылка на PR.
  - id: estimate
    type: number
    min: 0
    max: 100
  - id: due
    type: date
  - id: blocked_by
    type: task_ref
  - id: flaky
    type: bool
  - id: summary
    type: string
  - id: acceptance
    type: text
`;

/** Временная папка проекта с `.desk/board.yaml` и пустой `.desk/tasks/`. Путь уже через realpath. */
export async function makeProject(boardYaml: string = TEST_BOARD): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'desk-')));
  await mkdir(join(root, '.desk', 'tasks'), { recursive: true });
  await writeFile(join(root, '.desk', 'board.yaml'), boardYaml);
  return root;
}

/** Пустая временная папка без `.desk/`. */
export async function makeEmptyDir(): Promise<string> {
  return realpath(await mkdtemp(join(tmpdir(), 'desk-empty-')));
}

export function fixedClock(iso = '2026-09-24T10:00:00Z'): () => Date {
  return () => new Date(iso);
}
```

`tests/helpers/errors.ts`:
```ts
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
```

- [ ] **Step 4: Написать падающие тесты**

`tests/unit/errors.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DeskError, isDeskError } from '../../src/core/errors.js';

describe('DeskError', () => {
  it('сериализуется в JSON с null для отсутствующих деталей', () => {
    const err = new DeskError('NOT_FOUND', 'Задача T-001 не найдена');
    expect(err.toJSON()).toEqual({
      code: 'NOT_FOUND',
      message: 'Задача T-001 не найдена',
      field: null,
      guide: null,
      allowed: null,
    });
  });

  it('переносит field, guide и allowed', () => {
    const err = new DeskError('INVALID_VALUE', 'плохо', { field: 'priority', guide: 'p0 — прод', allowed: ['p0', 'p1'] });
    expect(err.toJSON()).toMatchObject({ field: 'priority', guide: 'p0 — прод', allowed: ['p0', 'p1'] });
  });

  it('isDeskError отличает DeskError от Error', () => {
    expect(isDeskError(new DeskError('BAD_REQUEST', 'x'))).toBe(true);
    expect(isDeskError(new Error('x'))).toBe(false);
  });
});
```

`tests/unit/paths.test.ts`:
```ts
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
```

- [ ] **Step 5: Запустить тесты и убедиться, что они падают**

Run: `npx vitest run tests/unit/errors.test.ts tests/unit/paths.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/errors.js'`.

- [ ] **Step 6: Реализовать модули**

`src/version.ts`:
```ts
export const VERSION = '0.1.0';
```

`src/core/errors.ts`:
```ts
export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNKNOWN_FIELD'
  | 'INVALID_VALUE'
  | 'REQUIRED_MISSING'
  | 'TRANSITION_FORBIDDEN'
  | 'TRANSITION_REQUIRES'
  | 'WIP_LIMIT'
  | 'INVALID_BOARD'
  | 'LOCK_TIMEOUT'
  | 'BAD_REQUEST';

export interface DeskErrorJson {
  code: ErrorCode;
  message: string;
  field: string | null;
  guide: string | null;
  allowed: unknown[] | null;
}

export interface DeskErrorDetails {
  field?: string;
  guide?: string;
  allowed?: unknown[];
}

export class DeskError extends Error {
  readonly code: ErrorCode;
  readonly details: DeskErrorDetails;

  constructor(code: ErrorCode, message: string, details: DeskErrorDetails = {}) {
    super(message);
    this.name = 'DeskError';
    this.code = code;
    this.details = details;
  }

  toJSON(): DeskErrorJson {
    return {
      code: this.code,
      message: this.message,
      field: this.details.field ?? null,
      guide: this.details.guide ?? null,
      allowed: this.details.allowed ?? null,
    };
  }
}

export function isDeskError(e: unknown): e is DeskError {
  return e instanceof DeskError;
}
```

`src/core/types.ts`:
```ts
export const FIELD_TYPES = [
  'string',
  'text',
  'number',
  'bool',
  'date',
  'url',
  'enum',
  'multi_enum',
  'task_ref',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
export type FieldValue = string | number | boolean | string[];

export interface FieldDef {
  id: string;
  type: FieldType;
  required: boolean;
  values?: string[];
  default?: FieldValue;
  min?: number;
  max?: number;
  guide?: string;
}

export interface ColumnDef {
  id: string;
  title: string;
  wipLimit?: number;
  guide?: string;
}

export interface Transition {
  from: string;
  to: string[];
  requires: string[];
}

export interface Board {
  version: 1;
  name: string;
  idPrefix: string;
  guide?: string;
  columns: ColumnDef[];
  /** null — секции transitions нет, разрешён любой переход. */
  transitions: Transition[] | null;
  fields: FieldDef[];
}

export interface HistoryEntry {
  at: string;
  by: string;
  from: string | null;
  to: string;
}

export interface Note {
  at: string;
  by: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  column: string;
  assignee?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, FieldValue>;
  history: HistoryEntry[];
  description: string;
  notes: Note[];
}

/** Задача, прочитанная с диска. task = null, если файл не читается вообще. */
export interface LoadedTask {
  id: string;
  task: Task | null;
  errors: string[];
}

export type Clock = () => Date;

export const BUILTIN_FIELDS = [
  'id',
  'title',
  'column',
  'assignee',
  'created_by',
  'created_at',
  'updated_at',
  'history',
] as const;
```

`src/core/paths.ts`:
```ts
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DeskError } from './errors.js';

export const DESK_DIR = '.desk';
export const TASK_FILE_RE = /^([A-Za-z]+-\d+)\.md$/;

export const deskDir = (root: string): string => join(root, DESK_DIR);
export const boardPath = (root: string): string => join(root, DESK_DIR, 'board.yaml');
export const tasksDir = (root: string): string => join(root, DESK_DIR, 'tasks');
export const lockPath = (root: string): string => join(root, DESK_DIR, '.lock');
export const taskPath = (root: string, id: string): string => join(tasksDir(root), `${id}.md`);

/** Корень проекта: DESK_ROOT, иначе первая папка с `.desk/` вверх от cwd. */
export function findRoot(cwd: string, env: NodeJS.ProcessEnv = process.env): string {
  if (env.DESK_ROOT) {
    const root = resolve(env.DESK_ROOT);
    if (isDirectory(deskDir(root))) return root;
    throw notFound(root);
  }
  let dir = resolve(cwd);
  for (;;) {
    if (isDirectory(deskDir(dir))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw notFound(resolve(cwd));
    dir = parent;
  }
}

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function notFound(from: string): DeskError {
  return new DeskError(
    'INVALID_BOARD',
    `Папка .desk не найдена (поиск от ${from}). Запусти desk init в корне проекта.`,
  );
}
```

- [ ] **Step 7: Запустить тесты и typecheck**

Run: `npx vitest run tests/unit/errors.test.ts tests/unit/paths.test.ts && npx tsc --noEmit`
Expected: PASS, 9 тестов; tsc без ошибок.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .gitignore src tests
git commit -m "chore: scaffold desk package with core errors, types and root lookup"
```

---

### Task 2: Проверка значений полей

**Files:**
- Create: `src/core/validate.ts`
- Create: `tests/helpers/board.ts`
- Test: `tests/unit/validate.test.ts`

**Interfaces:**
- Consumes: `DeskError`, `isDeskError`, типы `Board`, `FieldDef`, `FieldValue`, `Task` (Task 1)
- Produces:
  - `interface ValidationContext { taskExists(id: string): boolean }`
  - `checkValue(field: FieldDef, value: unknown, ctx?: ValidationContext): FieldValue` — бросает `INVALID_VALUE`
  - `isEmptyValue(value: unknown): boolean`
  - `checkTitle(title: unknown): string`, `checkActor(actor: unknown): string`, `checkText(value: unknown, name: string): string`
  - `fieldDef(board: Board, id: string): FieldDef | undefined`
  - `applyDefaults(board: Board, fields: Record<string, FieldValue>): Record<string, FieldValue>`
  - `applyChanges(board: Board, task: Task, changes: Record<string, unknown>, ctx: ValidationContext): Task` — новый объект, ключ `assignee` особый, `null` удаляет
  - `validateTask(board: Board, task: Task, ctx: ValidationContext): DeskError[]`, `assertTaskValid(board, task, ctx): void`
  - константа `ASSIGNEE_GUIDE`
  - тест-хелперы `testBoard(overrides?)`, `testTask(overrides?)`

- [ ] **Step 1: Написать хелперы доски и задачи**

`tests/helpers/board.ts` (эквивалент `TEST_BOARD` из `project.ts`; Task 3 проверяет, что `parseBoard(TEST_BOARD)` даёт ровно этот объект):
```ts
import type { Board, Task } from '../../src/core/types.js';

export function testBoard(overrides: Partial<Board> = {}): Board {
  return {
    version: 1,
    name: 'test',
    idPrefix: 'T',
    guide: 'Общие правила.',
    columns: [
      { id: 'backlog', title: 'Backlog', guide: 'Новые задачи.' },
      { id: 'in_progress', title: 'In progress', wipLimit: 2, guide: 'В работе.' },
      { id: 'review', title: 'Review' },
      { id: 'done', title: 'Done' },
    ],
    transitions: [
      { from: 'backlog', to: ['in_progress'], requires: ['assignee'] },
      { from: 'in_progress', to: ['review'], requires: ['pr_url'] },
      { from: 'in_progress', to: ['backlog'], requires: [] },
      { from: 'review', to: ['in_progress', 'done'], requires: [] },
    ],
    fields: [
      { id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'], default: 'p2', guide: 'p0 — прод лежит.' },
      { id: 'area', type: 'multi_enum', required: false, values: ['backend', 'frontend'] },
      { id: 'pr_url', type: 'url', required: false, guide: 'Ссылка на PR.' },
      { id: 'estimate', type: 'number', required: false, min: 0, max: 100 },
      { id: 'due', type: 'date', required: false },
      { id: 'blocked_by', type: 'task_ref', required: false },
      { id: 'flaky', type: 'bool', required: false },
      { id: 'summary', type: 'string', required: false },
      { id: 'acceptance', type: 'text', required: false },
    ],
    ...overrides,
  };
}

export function testTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'T-001',
    title: 'Задача',
    column: 'backlog',
    createdBy: 'planner',
    createdAt: '2026-09-24T10:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
    fields: { priority: 'p2' },
    history: [{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'backlog' }],
    description: '',
    notes: [],
    ...overrides,
  };
}
```

- [ ] **Step 2: Написать падающие тесты**

`tests/unit/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  applyChanges,
  applyDefaults,
  assertTaskValid,
  checkActor,
  checkTitle,
  checkValue,
  isEmptyValue,
  validateTask,
} from '../../src/core/validate.js';
import type { FieldDef } from '../../src/core/types.js';
import { testBoard, testTask } from '../helpers/board.js';
import { catchError } from '../helpers/errors.js';

const board = testBoard();
const def = (id: string): FieldDef => {
  const found = board.fields.find((f) => f.id === id);
  if (!found) throw new Error(`нет поля ${id}`);
  return found;
};
const ctx = { taskExists: (id: string) => id === 'T-001' };

describe('checkValue', () => {
  it.each([
    ['summary', 'коротко'],
    ['summary', 'a'.repeat(200)],
    ['acceptance', 'много\nстрок'],
    ['estimate', 0],
    ['estimate', 42.5],
    ['flaky', false],
    ['due', '2026-10-01'],
    ['pr_url', 'https://github.com/org/repo/pull/1'],
    ['priority', 'p1'],
    ['area', ['backend', 'frontend']],
    ['blocked_by', 'T-001'],
  ])('принимает %s = %j', (id, value) => {
    expect(checkValue(def(id), value, ctx)).toEqual(value);
  });

  it.each([
    ['summary', 'две\nстроки'],
    ['summary', 'a'.repeat(201)],
    ['summary', 5],
    ['acceptance', 5],
    ['estimate', '5'],
    ['estimate', -1],
    ['estimate', 101],
    ['estimate', Number.POSITIVE_INFINITY],
    ['flaky', 'true'],
    ['due', '2026-02-30'],
    ['due', '01.10.2026'],
    ['pr_url', 'ftp://example.com'],
    ['pr_url', '/relative/path'],
    ['priority', 'p9'],
    ['area', 'backend'],
    ['area', ['backend', 'backend']],
    ['area', ['mobile']],
    ['blocked_by', 'T-999'],
    ['blocked_by', 'not-an-id'],
  ])('отклоняет %s = %j', (id, value) => {
    const err = catchError(() => checkValue(def(id), value, ctx));
    expect(err.code).toBe('INVALID_VALUE');
    expect(err.details.field).toBe(id);
  });

  it('для enum возвращает guide и allowed', () => {
    const err = catchError(() => checkValue(def('priority'), 'urgent', ctx));
    expect(err.toJSON()).toMatchObject({ guide: 'p0 — прод лежит.', allowed: ['p0', 'p1', 'p2', 'p3'] });
  });

  it('task_ref без контекста проверяет только формат', () => {
    expect(checkValue(def('blocked_by'), 'T-777')).toBe('T-777');
  });
});

describe('isEmptyValue', () => {
  it.each([[undefined], [null], [''], [[]]])('%j пустое', (v) => expect(isEmptyValue(v)).toBe(true));
  it.each([[0], [false], ['x'], [['a']]])('%j не пустое', (v) => expect(isEmptyValue(v)).toBe(false));
});

describe('checkTitle и checkActor', () => {
  it('обрезает пробелы в title', () => expect(checkTitle('  Задача  ')).toBe('Задача'));
  it.each([[''], ['   '], ['a\nb'], ['a'.repeat(201)], [5]])('title %j отклоняется', (t) => {
    expect(catchError(() => checkTitle(t)).code).toBe('INVALID_VALUE');
  });
  it('actor обязателен', () => expect(catchError(() => checkActor('')).code).toBe('BAD_REQUEST'));
  it.each([['a:b'], ['a · b'], ['a\nb'], ['x'.repeat(65)], [undefined]])('actor %j отклоняется', (a) => {
    expect(catchError(() => checkActor(a)).code).toBe('BAD_REQUEST');
  });
  it('actor с пробелом допустим', () => expect(checkActor(' Denis Runov ')).toBe('Denis Runov'));
});

describe('applyDefaults', () => {
  it('подставляет default только для отсутствующих полей', () => {
    expect(applyDefaults(board, {})).toEqual({ priority: 'p2' });
    expect(applyDefaults(board, { priority: 'p0' })).toEqual({ priority: 'p0' });
  });
});

describe('applyChanges', () => {
  it('ставит значение и не меняет исходную задачу', () => {
    const task = testTask();
    const next = applyChanges(board, task, { estimate: 3, area: ['backend'] }, ctx);
    expect(next.fields).toEqual({ priority: 'p2', estimate: 3, area: ['backend'] });
    expect(task.fields).toEqual({ priority: 'p2' });
  });

  it('null удаляет значение', () => {
    const next = applyChanges(board, testTask({ fields: { priority: 'p2', estimate: 3 } }), { estimate: null }, ctx);
    expect(next.fields).toEqual({ priority: 'p2' });
  });

  it('assignee ставится и снимается', () => {
    const withAssignee = applyChanges(board, testTask(), { assignee: 'backend-agent' }, ctx);
    expect(withAssignee.assignee).toBe('backend-agent');
    const cleared = applyChanges(board, withAssignee, { assignee: null }, ctx);
    expect('assignee' in cleared).toBe(false);
  });

  it('неверный assignee — INVALID_VALUE', () => {
    expect(catchError(() => applyChanges(board, testTask(), { assignee: 5 }, ctx)).code).toBe('INVALID_VALUE');
  });

  it('неизвестное поле — UNKNOWN_FIELD со списком полей', () => {
    const err = catchError(() => applyChanges(board, testTask(), { severity: 'high' }, ctx));
    expect(err.code).toBe('UNKNOWN_FIELD');
    expect(err.details.allowed).toContain('priority');
    expect(err.details.allowed).toContain('assignee');
  });

  it('null для поля, удалённого из board.yaml, чистит устаревшее значение', () => {
    const stale = testTask({ fields: { priority: 'p2', severity: 'high' } });
    const next = applyChanges(board, stale, { severity: null }, ctx);
    expect(next.fields).toEqual({ priority: 'p2' });
  });

  it('ошибка значения несёт guide поля', () => {
    const err = catchError(() => applyChanges(board, testTask(), { pr_url: 'nope' }, ctx));
    expect(err.toJSON()).toMatchObject({ code: 'INVALID_VALUE', field: 'pr_url', guide: 'Ссылка на PR.' });
  });
});

describe('validateTask', () => {
  it('валидная задача — пустой список', () => {
    expect(validateTask(board, testTask(), ctx)).toEqual([]);
  });

  it('находит неизвестную колонку, лишнее поле, плохое значение и пропущенное обязательное', () => {
    const task = testTask({ column: 'archived', fields: { severity: 'high', estimate: -5 } });
    const codes = validateTask(board, task, ctx).map((e) => e.code);
    expect(codes).toEqual(['INVALID_VALUE', 'UNKNOWN_FIELD', 'INVALID_VALUE', 'REQUIRED_MISSING']);
  });

  it('assertTaskValid бросает первую ошибку', () => {
    const err = catchError(() => assertTaskValid(board, testTask({ fields: {} }), ctx));
    expect(err.code).toBe('REQUIRED_MISSING');
    expect(err.details.guide).toBe('p0 — прод лежит.');
  });
});
```

- [ ] **Step 3: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/validate.js'`.

- [ ] **Step 4: Реализовать `src/core/validate.ts`**

```ts
import { DeskError, isDeskError } from './errors.js';
import type { Board, FieldDef, FieldValue, Task } from './types.js';

export interface ValidationContext {
  taskExists(id: string): boolean;
}

export const ASSIGNEE_GUIDE = 'Имя агента или человека, который выполняет задачу.';

const MAX_STRING = 200;
const MAX_ACTOR = 64;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TASK_ID_RE = /^[A-Za-z]+-\d+$/;
const ACTOR_FORBIDDEN_RE = /[:·\n\r]/;

export function checkValue(field: FieldDef, value: unknown, ctx?: ValidationContext): FieldValue {
  const fail = (message: string, allowed?: unknown[]): DeskError =>
    new DeskError('INVALID_VALUE', `Поле ${field.id}: ${message}`, {
      field: field.id,
      guide: field.guide,
      allowed,
    });
  const values = field.values ?? [];

  switch (field.type) {
    case 'string':
      if (typeof value !== 'string' || value.includes('\n') || value.length > MAX_STRING) {
        throw fail(`ожидается строка без переносов, до ${MAX_STRING} символов`);
      }
      return value;
    case 'text':
      if (typeof value !== 'string') throw fail('ожидается строка');
      return value;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) throw fail('ожидается конечное число');
      if (field.min !== undefined && value < field.min) throw fail(`минимум ${field.min}`);
      if (field.max !== undefined && value > field.max) throw fail(`максимум ${field.max}`);
      return value;
    case 'bool':
      if (typeof value !== 'boolean') throw fail('ожидается true или false');
      return value;
    case 'date':
      if (typeof value !== 'string' || !isValidDate(value)) throw fail('ожидается дата YYYY-MM-DD');
      return value;
    case 'url':
      if (typeof value !== 'string' || !isHttpUrl(value)) throw fail('ожидается абсолютный http(s) URL');
      return value;
    case 'enum':
      if (typeof value !== 'string' || !values.includes(value)) {
        throw fail(`допустимые значения: ${values.join(', ')}`, values);
      }
      return value;
    case 'multi_enum':
      if (
        !Array.isArray(value) ||
        value.some((v) => typeof v !== 'string' || !values.includes(v)) ||
        new Set(value).size !== value.length
      ) {
        throw fail(`ожидается массив уникальных значений из: ${values.join(', ')}`, values);
      }
      return [...(value as string[])];
    case 'task_ref':
      if (typeof value !== 'string' || !TASK_ID_RE.test(value)) throw fail('ожидается ID задачи, например T-001');
      if (ctx && !ctx.taskExists(value)) throw fail(`задача ${value} не найдена`);
      return value;
  }
}

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function checkTitle(title: unknown): string {
  if (typeof title !== 'string' || title.includes('\n') || title.trim() === '' || title.trim().length > MAX_STRING) {
    throw new DeskError('INVALID_VALUE', `title: ожидается строка 1–${MAX_STRING} символов без переносов`, {
      field: 'title',
    });
  }
  return title.trim();
}

export function checkActor(actor: unknown): string {
  if (typeof actor !== 'string' || actor.trim() === '' || actor.trim().length > MAX_ACTOR || ACTOR_FORBIDDEN_RE.test(actor)) {
    throw new DeskError(
      'BAD_REQUEST',
      `actor: обязательная строка до ${MAX_ACTOR} символов без ":", "·" и переносов — твоё имя агента`,
    );
  }
  return actor.trim();
}

export function checkText(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new DeskError('BAD_REQUEST', `${name}: ожидается строка`);
  return value;
}

function checkAssignee(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > MAX_ACTOR || ACTOR_FORBIDDEN_RE.test(value)) {
    throw new DeskError('INVALID_VALUE', `assignee: строка до ${MAX_ACTOR} символов без ":", "·" и переносов`, {
      field: 'assignee',
      guide: ASSIGNEE_GUIDE,
    });
  }
  return value.trim();
}

export function fieldDef(board: Board, id: string): FieldDef | undefined {
  return board.fields.find((f) => f.id === id);
}

export function applyDefaults(board: Board, fields: Record<string, FieldValue>): Record<string, FieldValue> {
  const defaults = board.fields
    .filter((f) => f.default !== undefined && fields[f.id] === undefined)
    .map((f) => [f.id, f.default as FieldValue] as const);
  return { ...Object.fromEntries(defaults), ...fields };
}

function withoutKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as T;
}

export function applyChanges(
  board: Board,
  task: Task,
  changes: Record<string, unknown>,
  ctx: ValidationContext,
): Task {
  let fields = task.fields;
  let assignee = task.assignee;

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'assignee') {
      assignee = value === null ? undefined : checkAssignee(value);
      continue;
    }
    const def = fieldDef(board, key);
    if (!def) {
      if (value === null && key in fields) {
        fields = withoutKey(fields, key);
        continue;
      }
      throw new DeskError('UNKNOWN_FIELD', `Поле ${key} не объявлено в board.yaml`, {
        field: key,
        allowed: [...board.fields.map((f) => f.id), 'assignee'],
      });
    }
    fields = value === null ? withoutKey(fields, key) : { ...fields, [key]: checkValue(def, value, ctx) };
  }

  const base = withoutKey(task as unknown as Record<string, unknown>, 'assignee') as unknown as Task;
  return assignee === undefined ? { ...base, fields } : { ...base, fields, assignee };
}

function requiredError(field: FieldDef): DeskError {
  return new DeskError('REQUIRED_MISSING', `Поле ${field.id} обязательно`, { field: field.id, guide: field.guide });
}

export function validateTask(board: Board, task: Task, ctx: ValidationContext): DeskError[] {
  const titleErrors = (() => {
    try {
      checkTitle(task.title);
      return [];
    } catch (e) {
      if (isDeskError(e)) return [e];
      throw e;
    }
  })();
  const columnErrors = board.columns.some((c) => c.id === task.column)
    ? []
    : [
        new DeskError('INVALID_VALUE', `Колонка ${task.column} не существует в board.yaml`, {
          field: 'column',
          allowed: board.columns.map((c) => c.id),
        }),
      ];
  const fieldErrors = Object.entries(task.fields).flatMap(([key, value]) => {
    const def = fieldDef(board, key);
    if (!def) {
      return [
        new DeskError('UNKNOWN_FIELD', `Поле ${key} не объявлено в board.yaml. Удали его: fields {"${key}": null}`, {
          field: key,
        }),
      ];
    }
    try {
      checkValue(def, value, ctx);
      return [];
    } catch (e) {
      if (isDeskError(e)) return [e];
      throw e;
    }
  });
  const requiredErrors = board.fields.filter((f) => f.required && isEmptyValue(task.fields[f.id])).map(requiredError);
  return [...titleErrors, ...columnErrors, ...fieldErrors, ...requiredErrors];
}

export function assertTaskValid(board: Board, task: Task, ctx: ValidationContext): void {
  const [first] = validateTask(board, task, ctx);
  if (first) throw first;
}
```

Примечание: `let fields` и `let assignee` — локальные аккумуляторы внутри функции; вход (`task`) не мутируется, тест «не меняет исходную задачу» это закрепляет.

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run tests/unit/validate.test.ts && npx tsc --noEmit`
Expected: PASS; tsc без ошибок.

- [ ] **Step 6: Commit**

```bash
git add src/core/validate.ts tests/helpers/board.ts tests/unit/validate.test.ts
git commit -m "feat: add field value validation and change application"
```

---

### Task 3: Схема и загрузка `board.yaml`

**Files:**
- Create: `src/core/board-schema.ts`, `src/core/board-loader.ts`
- Test: `tests/unit/board-loader.test.ts`

**Interfaces:**
- Consumes: `checkValue` (Task 2), `DeskError`, `FIELD_TYPES`, `BUILTIN_FIELDS`, `Board`, `FieldDef` (Task 1), `boardPath` (Task 1)
- Produces:
  - `parseBoard(text: string): Board` — бросает `INVALID_BOARD` с путём и строкой
  - `loadBoard(root: string): Promise<Board>`
  - `formatPath(path: (string | number)[]): string` (`fields[2].values`, пустой путь → `корень`)

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/board-loader.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatPath, loadBoard, parseBoard } from '../../src/core/board-loader.js';
import { testBoard } from '../helpers/board.js';
import { catchError, catchErrorAsync } from '../helpers/errors.js';
import { TEST_BOARD, makeEmptyDir, makeProject } from '../helpers/project.js';

const base = (extra = ''): string => `version: 1\ncolumns:\n  - id: todo\n  - id: done\n${extra}`;

describe('parseBoard', () => {
  it('TEST_BOARD даёт ровно testBoard()', () => {
    expect(parseBoard(TEST_BOARD)).toEqual(testBoard());
  });

  it('подставляет значения по умолчанию', () => {
    expect(parseBoard(base())).toEqual({
      version: 1,
      name: 'desk',
      idPrefix: 'T',
      columns: [
        { id: 'todo', title: 'todo' },
        { id: 'done', title: 'done' },
      ],
      transitions: null,
      fields: [],
    });
  });

  it('to строкой превращается в массив, requires по умолчанию пустой', () => {
    const board = parseBoard(base('transitions:\n  - from: todo\n    to: done\n'));
    expect(board.transitions).toEqual([{ from: 'todo', to: ['done'], requires: [] }]);
  });

  it.each([
    ['синтаксис YAML', 'version: 1\ncolumns: [\n', 'строка'],
    ['пустой файл', '', 'корень'],
    ['version 2', 'version: 2\ncolumns:\n  - id: todo\n', 'version'],
    ['дубликат колонки', 'version: 1\ncolumns:\n  - id: todo\n  - id: todo\n', 'строка 4: columns[1].id'],
    ['плохой id колонки', 'version: 1\ncolumns:\n  - id: To Do\n', 'строка 3: columns[0].id'],
    ['wip_limit 0', 'version: 1\ncolumns:\n  - id: todo\n    wip_limit: 0\n', 'columns[0].wip_limit'],
    ['лишний ключ', 'version: 1\ncolums: []\ncolumns:\n  - id: todo\n', 'colums'],
    ['enum без values', base('fields:\n  - id: prio\n    type: enum\n'), 'строка 6: fields[0].values'],
    ['values у string', base('fields:\n  - id: s\n    type: string\n    values: [a]\n'), 'fields[0].values'],
    ['повтор values', base('fields:\n  - id: e\n    type: enum\n    values: [a, a]\n'), 'fields[0].values'],
    ['встроенное поле', base('fields:\n  - id: title\n    type: string\n'), 'строка 6: fields[0].id'],
    ['дубликат поля', base('fields:\n  - id: a\n    type: bool\n  - id: a\n    type: bool\n'), 'fields[1].id'],
    ['неизвестный тип', base('fields:\n  - id: a\n    type: money\n'), 'fields[0].type'],
    ['min больше max', base('fields:\n  - id: n\n    type: number\n    min: 5\n    max: 1\n'), 'fields[0].min'],
    ['min у string', base('fields:\n  - id: s\n    type: string\n    min: 1\n'), 'fields[0].min'],
    ['плохой default', base('fields:\n  - id: prio\n    type: enum\n    values: [a, b]\n    default: c\n'), 'строка 9: fields[0].default'],
    ['переход в несуществующую колонку', base('transitions:\n  - from: todo\n    to: nowhere\n'), 'строка 7: transitions[0].to'],
    ['переход из несуществующей колонки', base('transitions:\n  - from: ghost\n    to: done\n'), 'transitions[0].from'],
    ['несуществующая колонка в списке to', base('transitions:\n  - from: todo\n    to: [done, ghost]\n'), 'transitions[0].to[1]'],
    ['requires на неизвестное поле', base('transitions:\n  - from: todo\n    to: done\n    requires: [ghost]\n'), 'строка 8: transitions[0].requires[0]'],
  ])('%s → INVALID_BOARD', (_name, yaml, expected) => {
    const err = catchError(() => parseBoard(yaml));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain(expected);
  });

  it('requires: [assignee] допустим без объявления поля', () => {
    const board = parseBoard(base('transitions:\n  - from: todo\n    to: done\n    requires: [assignee]\n'));
    expect(board.transitions?.[0]?.requires).toEqual(['assignee']);
  });
});

describe('formatPath', () => {
  it('форматирует пути zod', () => {
    expect(formatPath(['fields', 2, 'values'])).toBe('fields[2].values');
    expect(formatPath([])).toBe('корень');
  });
});

describe('loadBoard', () => {
  it('читает .desk/board.yaml', async () => {
    const root = await makeProject();
    expect((await loadBoard(root)).name).toBe('test');
  });

  it('INVALID_BOARD с подсказкой, если файла нет', async () => {
    const dir = await makeEmptyDir();
    const err = await catchErrorAsync(() => loadBoard(dir));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain('desk init');
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/board-loader.test.ts`
Expected: FAIL — модуль `board-loader.js` не найден.

- [ ] **Step 3: Реализовать `src/core/board-schema.ts`**

```ts
import { z } from 'zod';
import { BUILTIN_FIELDS, FIELD_TYPES, type Board, type FieldDef, type FieldValue } from './types.js';
import { checkValue } from './validate.js';

const ID = z.string().regex(/^[a-z][a-z0-9_]*$/, 'id: латиница в нижнем регистре, цифры и _, начинается с буквы');
const BUILTIN = new Set<string>(BUILTIN_FIELDS);

const columnSchema = z
  .object({
    id: ID,
    title: z.string().min(1).optional(),
    wip_limit: z.number().int().positive().optional(),
    guide: z.string().optional(),
  })
  .strict();

const transitionSchema = z
  .object({
    from: ID,
    to: z.union([ID, z.array(ID).min(1)]),
    requires: z.array(z.string()).optional(),
  })
  .strict();

const fieldSchema = z
  .object({
    id: ID,
    type: z.enum(FIELD_TYPES),
    required: z.boolean().optional(),
    values: z.array(z.string().min(1)).min(1).optional(),
    default: z.unknown().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    guide: z.string().optional(),
  })
  .strict();

type RawField = z.infer<typeof fieldSchema>;

function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function toFieldDef(raw: RawField): FieldDef {
  return omitUndefined({
    id: raw.id,
    type: raw.type,
    required: raw.required ?? false,
    values: raw.values,
    default: raw.default as FieldValue | undefined,
    min: raw.min,
    max: raw.max,
    guide: raw.guide,
  });
}

export const rawBoardSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1).optional(),
    id_prefix: z.string().regex(/^[A-Za-z]+$/, 'id_prefix: только латинские буквы').optional(),
    guide: z.string().optional(),
    columns: z.array(columnSchema).min(1),
    transitions: z.array(transitionSchema).optional(),
    fields: z.array(fieldSchema).optional(),
  })
  .strict()
  .superRefine((b, ctx) => {
    const issue = (path: (string | number)[], message: string): void =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const columnIds = new Set<string>();
    b.columns.forEach((c, i) => {
      if (columnIds.has(c.id)) issue(['columns', i, 'id'], `колонка ${c.id} объявлена дважды`);
      columnIds.add(c.id);
    });

    const fieldIds = new Set<string>();
    (b.fields ?? []).forEach((f, i) => {
      if (BUILTIN.has(f.id)) issue(['fields', i, 'id'], `${f.id} — встроенное поле, его нельзя объявлять`);
      else if (fieldIds.has(f.id)) issue(['fields', i, 'id'], `поле ${f.id} объявлено дважды`);
      fieldIds.add(f.id);

      const needsValues = f.type === 'enum' || f.type === 'multi_enum';
      if (needsValues && !f.values) issue(['fields', i, 'values'], `для типа ${f.type} нужен список values`);
      if (!needsValues && f.values) issue(['fields', i, 'values'], 'values допустим только для enum и multi_enum');
      if (f.values && new Set(f.values).size !== f.values.length) issue(['fields', i, 'values'], 'значения values повторяются');
      if (f.type !== 'number' && f.min !== undefined) issue(['fields', i, 'min'], 'min допустим только для number');
      if (f.type !== 'number' && f.max !== undefined) issue(['fields', i, 'max'], 'max допустим только для number');
      if (f.min !== undefined && f.max !== undefined && f.min > f.max) issue(['fields', i, 'min'], 'min больше max');
      if (f.default !== undefined && (!needsValues || f.values)) {
        try {
          checkValue(toFieldDef(f), f.default);
        } catch (e) {
          issue(['fields', i, 'default'], e instanceof Error ? e.message : String(e));
        }
      }
    });

    (b.transitions ?? []).forEach((t, i) => {
      if (!columnIds.has(t.from)) issue(['transitions', i, 'from'], `колонка ${t.from} не существует`);
      if (Array.isArray(t.to)) {
        t.to.forEach((to, j) => {
          if (!columnIds.has(to)) issue(['transitions', i, 'to', j], `колонка ${to} не существует`);
        });
      } else if (!columnIds.has(t.to)) {
        issue(['transitions', i, 'to'], `колонка ${t.to} не существует`);
      }
      (t.requires ?? []).forEach((r, j) => {
        if (r !== 'assignee' && !fieldIds.has(r)) issue(['transitions', i, 'requires', j], `поле ${r} не объявлено в fields`);
      });
    });
  });

export type RawBoard = z.infer<typeof rawBoardSchema>;

export function toBoard(raw: RawBoard): Board {
  return omitUndefined({
    version: 1 as const,
    name: raw.name ?? 'desk',
    idPrefix: raw.id_prefix ?? 'T',
    guide: raw.guide,
    columns: raw.columns.map((c) =>
      omitUndefined({ id: c.id, title: c.title ?? c.id, wipLimit: c.wip_limit, guide: c.guide }),
    ),
    transitions: raw.transitions
      ? raw.transitions.map((t) => ({
          from: t.from,
          to: Array.isArray(t.to) ? t.to : [t.to],
          requires: t.requires ?? [],
        }))
      : null,
    fields: (raw.fields ?? []).map(toFieldDef),
  });
}
```

- [ ] **Step 4: Реализовать `src/core/board-loader.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { LineCounter, isNode, parseDocument, type Document } from 'yaml';
import { rawBoardSchema, toBoard } from './board-schema.js';
import { DeskError } from './errors.js';
import { boardPath } from './paths.js';
import type { Board } from './types.js';

export async function loadBoard(root: string): Promise<Board> {
  const path = boardPath(root);
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new DeskError('INVALID_BOARD', `Не найден ${path}. Запусти desk init в корне проекта.`);
    }
    throw e;
  }
  return parseBoard(text);
}

export function parseBoard(text: string): Board {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, prettyErrors: false });
  const [yamlError] = doc.errors;
  if (yamlError) {
    const line = lineCounter.linePos(yamlError.pos[0]).line;
    throw new DeskError('INVALID_BOARD', `board.yaml, строка ${line}: ${yamlError.message}`);
  }
  const result = rawBoardSchema.safeParse(doc.toJS());
  if (!result.success) {
    const [issue] = result.error.issues;
    const path = issue?.path ?? [];
    const line = lineOf(doc, lineCounter, path);
    const where = line === null ? 'board.yaml' : `board.yaml, строка ${line}`;
    throw new DeskError('INVALID_BOARD', `${where}: ${formatPath(path)}: ${issue?.message ?? 'неверная схема'}`);
  }
  return toBoard(result.data);
}

export function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return 'корень';
  return path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`)).join('');
}

/** Строка ближайшего существующего узла по пути: для отсутствующего `values` — строка самого поля. */
function lineOf(doc: Document, lineCounter: LineCounter, path: (string | number)[]): number | null {
  for (let n = path.length; n > 0; n--) {
    const node = doc.getIn(path.slice(0, n), true);
    if (isNode(node) && node.range) return lineCounter.linePos(node.range[0]).line;
  }
  return null;
}
```

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run tests/unit/board-loader.test.ts && npx tsc --noEmit`
Expected: PASS. Если кейс «лишний ключ» не находит `colums` в сообщении — проверь, что у zod-issue `unrecognized_keys` в `message` перечислены ключи (`Unrecognized key(s) in object: 'colums'`); это поведение zod 3.

- [ ] **Step 6: Commit**

```bash
git add src/core/board-schema.ts src/core/board-loader.ts tests/unit/board-loader.test.ts
git commit -m "feat: parse and validate board.yaml with line-accurate errors"
```

---

### Task 4: Формат файла задачи

**Files:**
- Create: `src/core/task-file.ts`
- Test: `tests/unit/task-file.test.ts`

**Interfaces:**
- Consumes: типы `Task`, `Note`, `HistoryEntry`, `FieldValue`, `BUILTIN_FIELDS` (Task 1)
- Produces:
  - `parseTaskFile(text: string, fileId: string): { task: Task | null; errors: string[] }` — `task.id` всегда `fileId`
  - `serializeTask(task: Task): string`
  - `splitBody(body: string): { description: string; notes: Note[] }`
  - `formatNote(note: Note): string`

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/task-file.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseTaskFile, serializeTask, splitBody } from '../../src/core/task-file.js';
import type { Task } from '../../src/core/types.js';
import { testTask } from '../helpers/board.js';

const sample: Task = testTask({
  id: 'T-012',
  title: 'Добавить rate limit на /api/login',
  column: 'in_progress',
  assignee: 'backend-agent',
  createdAt: '2026-09-24T10:30:00Z',
  updatedAt: '2026-09-24T11:02:00Z',
  fields: { priority: 'p1', area: ['backend'], estimate: 2, flaky: false, acceptance: 'строка 1\nстрока 2' },
  history: [
    { at: '2026-09-24T10:30:00Z', by: 'planner', from: null, to: 'backlog' },
    { at: '2026-09-24T11:02:00Z', by: 'backend-agent', from: 'backlog', to: 'in_progress' },
  ],
  description: 'Описание задачи.\n\n- пункт 1\n- пункт 2',
  notes: [{ at: '2026-09-24T11:05:00Z', by: 'backend-agent', text: 'выбрал express-rate-limit.' }],
});

describe('serializeTask', () => {
  it('пишет встроенные поля первыми, в фиксированном порядке', () => {
    const text = serializeTask(sample);
    expect(text.startsWith(
      '---\nid: T-012\ntitle: Добавить rate limit на /api/login\ncolumn: in_progress\nassignee: backend-agent\ncreated_by: planner\n',
    )).toBe(true);
  });

  it('history — по записи в строке, flow-стиль', () => {
    const text = serializeTask(sample);
    expect(text).toMatch(/^ {2}- \{ at: "?2026-09-24T10:30:00Z"?, by: planner, from: null, to: backlog \}$/m);
  });

  it('notes — раздел в конце тела', () => {
    const text = serializeTask(sample);
    expect(text.endsWith('\n## Notes\n- 2026-09-24T11:05:00Z · backend-agent: выбрал express-rate-limit.\n')).toBe(true);
  });

  it('без описания и notes тело пустое', () => {
    const text = serializeTask(testTask());
    expect(text.endsWith('---\n')).toBe(true);
  });
});

describe('parseTaskFile', () => {
  it('round-trip без потерь', () => {
    expect(parseTaskFile(serializeTask(sample), 'T-012')).toEqual({ task: sample, errors: [] });
  });

  it('CRLF читается так же, как LF', () => {
    const crlf = serializeTask(sample).replace(/\n/g, '\r\n');
    expect(parseTaskFile(crlf, 'T-012').task).toEqual(sample);
  });

  it('кириллица и эмодзи в title сохраняются', () => {
    const task = testTask({ title: 'Починить 🔥 ёжик: «кавычки» и #решётку' });
    expect(parseTaskFile(serializeTask(task), 'T-001').task?.title).toBe(task.title);
  });

  it('описание с собственным заголовком ## Notes не теряется', () => {
    const task = testTask({ description: 'Контекст.\n\n## Notes\nЭто часть описания, не заметка.' });
    expect(parseTaskFile(serializeTask(task), 'T-001').task).toEqual(task);
  });

  it('описание с ## Notes плюс настоящие notes — обе части сохраняются', () => {
    const task = testTask({
      description: 'Контекст.\n\n## Notes\nЧасть описания.',
      notes: [{ at: '2026-09-24T12:00:00Z', by: 'qa', text: 'проверил' }],
    });
    expect(parseTaskFile(serializeTask(task), 'T-001').task).toEqual(task);
  });

  it('неизвестные ключи frontmatter попадают в fields', () => {
    const text = '---\nid: T-001\ntitle: X\ncolumn: backlog\ncreated_by: a\ncreated_at: 2026-09-24T10:00:00Z\nupdated_at: 2026-09-24T10:00:00Z\nseverity: high\nhistory: []\n---\n';
    expect(parseTaskFile(text, 'T-001').task?.fields).toEqual({ severity: 'high' });
  });

  it('нет frontmatter — task null', () => {
    const result = parseTaskFile('просто текст', 'T-001');
    expect(result.task).toBeNull();
    expect(result.errors[0]).toContain('frontmatter');
  });

  it('сломанный YAML — task null', () => {
    expect(parseTaskFile('---\ntitle: [\n---\n', 'T-001').task).toBeNull();
  });

  it('frontmatter-список вместо объекта — task null', () => {
    expect(parseTaskFile('---\n- a\n---\n', 'T-001').task).toBeNull();
  });

  it('id не совпадает с именем файла — ошибка, id берётся из имени', () => {
    const result = parseTaskFile(serializeTask(testTask({ id: 'T-001' })), 'T-002');
    expect(result.task?.id).toBe('T-002');
    expect(result.errors.join()).toContain('не совпадает');
  });

  it('пропущенный title и кривая history — ошибки, задача читается', () => {
    const text = '---\nid: T-001\ncolumn: backlog\ncreated_by: a\ncreated_at: x\nupdated_at: x\nhistory:\n  - bad\n---\n';
    const result = parseTaskFile(text, 'T-001');
    expect(result.task).not.toBeNull();
    expect(result.errors.some((e) => e.startsWith('title'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('history'))).toBe(true);
  });

  it('значение-объект в пользовательском поле — ошибка', () => {
    const text = '---\nid: T-001\ntitle: X\ncolumn: backlog\ncreated_by: a\ncreated_at: x\nupdated_at: x\nmeta: { a: 1 }\nhistory: []\n---\n';
    expect(parseTaskFile(text, 'T-001').errors.join()).toContain('meta');
  });
});

describe('splitBody', () => {
  it('без раздела Notes всё — описание', () => {
    expect(splitBody('Текст\n')).toEqual({ description: 'Текст', notes: [] });
  });

  it('раздел Notes с не-заметками остаётся в описании', () => {
    expect(splitBody('А\n\n## Notes\nпросто текст\n')).toEqual({ description: 'А\n\n## Notes\nпросто текст', notes: [] });
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/task-file.test.ts`
Expected: FAIL — модуль `task-file.js` не найден.

- [ ] **Step 3: Реализовать `src/core/task-file.ts`**

```ts
import { Document, isMap, isSeq, parse } from 'yaml';
import { BUILTIN_FIELDS, type FieldValue, type HistoryEntry, type Note, type Task } from './types.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const NOTES_HEADING = '## Notes';
const NOTE_RE = /^- (\S+) · ([^:]+): (.*)$/;
const BUILTIN = new Set<string>(BUILTIN_FIELDS);

export interface ParsedTaskFile {
  task: Task | null;
  errors: string[];
}

export function parseTaskFile(text: string, fileId: string): ParsedTaskFile {
  const match = FRONTMATTER_RE.exec(text.replace(/\r\n/g, '\n'));
  if (!match) return { task: null, errors: ['нет frontmatter между строками ---'] };

  let data: unknown;
  try {
    data = parse(match[1] ?? '');
  } catch (e) {
    return { task: null, errors: [`frontmatter: ${(e as Error).message}`] };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { task: null, errors: ['frontmatter должен быть YAML-объектом'] };
  }

  const fm = data as Record<string, unknown>;
  const errors: string[] = [];
  const requiredString = (key: string): string => {
    const value = fm[key];
    if (typeof value === 'string' && value !== '') return value;
    errors.push(`${key}: ожидается непустая строка`);
    return '';
  };

  if (fm.id !== fileId) errors.push(`id в frontmatter (${String(fm.id)}) не совпадает с именем файла (${fileId})`);
  const title = requiredString('title');
  const column = requiredString('column');
  const createdBy = requiredString('created_by');
  const createdAt = requiredString('created_at');
  const updatedAt = requiredString('updated_at');
  const assignee = typeof fm.assignee === 'string' && fm.assignee !== '' ? fm.assignee : undefined;
  if (fm.assignee !== undefined && fm.assignee !== null && assignee === undefined) {
    errors.push('assignee: ожидается строка');
  }
  const history = parseHistory(fm.history, errors);
  const fields = Object.fromEntries(
    Object.entries(fm)
      .filter(([key]) => !BUILTIN.has(key))
      .filter(([key, value]) => {
        if (isFieldValue(value)) return true;
        errors.push(`${key}: неподдерживаемое значение, ожидается строка, число, bool или список строк`);
        return false;
      }),
  ) as Record<string, FieldValue>;
  const { description, notes } = splitBody(match[2] ?? '');

  const task: Task = {
    id: fileId,
    title,
    column,
    ...(assignee === undefined ? {} : { assignee }),
    createdBy,
    createdAt,
    updatedAt,
    fields,
    history,
    description,
    notes,
  };
  return { task, errors };
}

function isFieldValue(value: unknown): value is FieldValue {
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function parseHistory(value: unknown, errors: string[]): HistoryEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push('history: ожидается список');
    return [];
  }
  return value.flatMap((entry, i): HistoryEntry[] => {
    const e = entry as Record<string, unknown> | null;
    const valid =
      e !== null &&
      typeof e === 'object' &&
      typeof e.at === 'string' &&
      typeof e.by === 'string' &&
      typeof e.to === 'string' &&
      (e.from === null || typeof e.from === 'string');
    if (!valid) {
      errors.push(`history[${i}]: ожидается { at, by, from, to }`);
      return [];
    }
    return [{ at: e.at as string, by: e.by as string, from: e.from as string | null, to: e.to as string }];
  });
}

export function splitBody(body: string): { description: string; notes: Note[] } {
  const marker = `\n${NOTES_HEADING}\n`;
  const padded = `\n${body}`;
  const index = padded.lastIndexOf(marker);
  if (index === -1) return { description: body.trim(), notes: [] };

  const lines = padded
    .slice(index + marker.length)
    .split('\n')
    .filter((line) => line.trim() !== '');
  const matches = lines.map((line) => NOTE_RE.exec(line));
  if (matches.length === 0 || matches.some((m) => m === null)) return { description: body.trim(), notes: [] };

  return {
    description: padded.slice(0, index).trim(),
    notes: matches.map((m) => ({ at: m?.[1] ?? '', by: m?.[2] ?? '', text: m?.[3] ?? '' })),
  };
}

export function formatNote(note: Note): string {
  return `- ${note.at} · ${note.by}: ${note.text}`;
}

export function serializeTask(task: Task): string {
  const frontmatter = {
    id: task.id,
    title: task.title,
    column: task.column,
    ...(task.assignee === undefined ? {} : { assignee: task.assignee }),
    created_by: task.createdBy,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    ...task.fields,
    history: task.history.map((h) => ({ at: h.at, by: h.by, from: h.from, to: h.to })),
  };
  const doc = new Document(frontmatter);
  const history = doc.get('history', true);
  if (isSeq(history)) {
    for (const item of history.items) if (isMap(item)) item.flow = true;
  }
  const notes = task.notes.length > 0 ? `\n\n${NOTES_HEADING}\n${task.notes.map(formatNote).join('\n')}` : '';
  const body = `${task.description}${notes}`.trim();
  return `---\n${doc.toString({ lineWidth: 0 })}---\n${body === '' ? '' : `${body}\n`}`;
}
```

Примечание: цикл по `history.items` меняет свежесозданный узел документа `yaml`, а не данные задачи; это API библиотеки для выбора стиля вывода.

- [ ] **Step 4: Запустить тесты**

Run: `npx vitest run tests/unit/task-file.test.ts && npx tsc --noEmit`
Expected: PASS. Если тест «history — flow-стиль» падает из-за кавычек вокруг времени, регулярное выражение уже допускает их (`"?`); если падает из-за другого формата отступа, распечатай `serializeTask(sample)` и поправь только регулярку под фактический вывод `yaml`, сохранив «одна запись history = одна строка».

- [ ] **Step 5: Commit**

```bash
git add src/core/task-file.ts tests/unit/task-file.test.ts
git commit -m "feat: parse and serialize task markdown files with notes section"
```
