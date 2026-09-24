# Часть 4. HTTP и CLI (задачи 12–13)

Индекс плана, Global Constraints и Review Focus: `../2026-09-24-desk-kanban.md`. Спека: разделы 6.1–6.3 и 7.

---

### Task 12: HTTP-сервер — API, SSE, статика, защита Host/Origin

**Files:**
- Create: `src/http/origin-guard.ts`, `src/http/events.ts`, `src/http/static.ts`, `src/http/routes.ts`, `src/http/server.ts`
- Create: `tests/helpers/http.ts`
- Test: `tests/unit/http-units.test.ts`, `tests/integration/http.test.ts`

**Interfaces:**
- Consumes: `callTool` (Task 10); `createBoardHolder`, `watchDesk`, `DeskEvent` (Task 9); `presentTaskList`, `loadAll` (Task 7); `DeskError`, `isDeskError`, `ErrorCode`
- Produces:
  - `checkRequestOrigin(headers: IncomingHttpHeaders, method: string, port: number): string | null` — текст причины отказа или `null`
  - `createEventHub(heartbeatMs?: number): EventHub` — `{ add(res), broadcast(event: DeskEvent), closeAll(), size(): number }`
  - `serveStatic(res: ServerResponse, staticDir: string, pathname: string): Promise<void>`; константа `CSP`
  - `statusFor(code: ErrorCode): number`; `handleApi(ctx: ApiContext, method: string, url: URL, body: unknown): Promise<ApiResponse>`; `interface ApiContext { holder: BoardHolder; actor: string; clock: Clock }`
  - `startHttpServer(opts: HttpServerOptions): Promise<RunningHttpServer>`; `HttpServerOptions { cwd; env?; port; host?; staticDir; actor; clock? }`; `RunningHttpServer { url: string; port: number; ready: Promise<void>; close(): Promise<void> }`

- [ ] **Step 1: Написать HTTP-хелпер для тестов**

`tests/helpers/http.ts` (через `node:http`, потому что `fetch` не даёт подменить `Host`):
```ts
import { request, type IncomingHttpHeaders } from 'node:http';

export interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  text: string;
  json<T = Record<string, unknown>>(): T;
}

export interface RawRequest {
  method?: string;
  path: string;
  headers?: Record<string, string>;
  body?: string | object;
}

export function rawRequest(port: number, req: RawRequest): Promise<RawResponse> {
  const method = req.method ?? 'GET';
  const body = req.body === undefined ? undefined : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const headers: Record<string, string> = {
    host: `127.0.0.1:${port}`,
    ...(method === 'GET' ? {} : { origin: `http://127.0.0.1:${port}`, 'content-type': 'application/json' }),
    ...req.headers,
  };
  return new Promise((resolve, reject) => {
    const r = request({ host: '127.0.0.1', port, method, path: req.path, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode ?? 0, headers: res.headers, text, json: () => JSON.parse(text) });
      });
    });
    r.on('error', reject);
    if (body !== undefined) r.write(body);
    r.end();
  });
}

/** Открывает SSE-поток и копит полученный текст. */
export function openSse(port: number): Promise<{ text(): string; close(): void }> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const r = request({ host: '127.0.0.1', port, path: '/api/events', headers: { host: `127.0.0.1:${port}` } }, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        buffer += chunk;
      });
      resolve({ text: () => buffer, close: () => r.destroy() });
    });
    r.on('error', (e) => {
      if ((e as NodeJS.ErrnoException).code !== 'ECONNRESET') reject(e);
    });
    r.end();
  });
}
```

- [ ] **Step 2: Написать падающие тесты**

`tests/unit/http-units.test.ts`:
```ts
import { mkdir, writeFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkRequestOrigin } from '../../src/http/origin-guard.js';
import { statusFor } from '../../src/http/routes.js';
import { serveStatic } from '../../src/http/static.js';
import { makeEmptyDir } from '../helpers/project.js';

describe('checkRequestOrigin', () => {
  const port = 4717;
  it.each([
    ['GET', { host: '127.0.0.1:4717' }, null],
    ['GET', { host: 'localhost:4717' }, null],
    ['GET', { host: 'evil.test:4717' }, 'Host'],
    ['GET', {}, 'Host'],
    ['POST', { host: '127.0.0.1:4717', origin: 'http://127.0.0.1:4717' }, null],
    ['PATCH', { host: '127.0.0.1:4717', origin: 'http://localhost:4717' }, null],
    ['POST', { host: '127.0.0.1:4717' }, 'Origin'],
    ['POST', { host: '127.0.0.1:4717', origin: 'https://evil.test' }, 'Origin'],
  ])('%s %j', (method, headers, expected) => {
    const result = checkRequestOrigin(headers, method, port);
    if (expected === null) expect(result).toBeNull();
    else expect(result).toContain(expected);
  });
});

describe('statusFor', () => {
  it.each([
    ['BAD_REQUEST', 400], ['UNKNOWN_FIELD', 400], ['INVALID_VALUE', 400], ['REQUIRED_MISSING', 400],
    ['NOT_FOUND', 404], ['TRANSITION_FORBIDDEN', 409], ['TRANSITION_REQUIRES', 409], ['WIP_LIMIT', 409],
    ['LOCK_TIMEOUT', 503], ['INVALID_BOARD', 500],
  ] as const)('%s → %i', (code, status) => expect(statusFor(code)).toBe(status));
});

function fakeResponse(): ServerResponse & { status?: number } {
  const res = {
    status: undefined as number | undefined,
    writeHead(status: number) {
      res.status = status;
      return res;
    },
    end() {
      return res;
    },
  };
  return res as unknown as ServerResponse & { status?: number };
}

describe('serveStatic', () => {
  it('403 при выходе за staticDir', async () => {
    const dir = await makeEmptyDir();
    await mkdir(join(dir, 'ui'));
    await writeFile(join(dir, 'secret.txt'), 'секрет');
    const res = fakeResponse();
    await serveStatic(res, join(dir, 'ui'), '/../secret.txt');
    expect(res.status).toBe(403);
  });

  it('400 при битом percent-encoding', async () => {
    const res = fakeResponse();
    await serveStatic(res, await makeEmptyDir(), '/%E0%A4%A');
    expect(res.status).toBe(400);
  });
});
```

`tests/integration/http.test.ts`:
```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { taskPath } from '../../src/core/paths.js';
import { CSP } from '../../src/http/static.js';
import { startHttpServer, type RunningHttpServer } from '../../src/http/server.js';
import { openSse, rawRequest } from '../helpers/http.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';

let server: RunningHttpServer;
let root: string;
let staticDir: string;

async function start(cwd: string): Promise<RunningHttpServer> {
  const s = await startHttpServer({ cwd, env: {}, port: 0, staticDir, actor: 'Test Human', clock: fixedClock() });
  await s.ready;
  return s;
}

beforeEach(async () => {
  root = await makeProject();
  staticDir = join(await makeEmptyDir(), 'ui');
  await mkdir(join(staticDir, 'assets'), { recursive: true });
  await writeFile(join(staticDir, 'index.html'), '<!doctype html><title>desk</title>');
  await writeFile(join(staticDir, 'assets', 'app.js'), 'console.info(1)');
  server = await start(root);
});

afterEach(async () => {
  await server.close();
});

const api = (req: Parameters<typeof rawRequest>[1]) => rawRequest(server.port, req);

describe('HTTP API', () => {
  it('GET /api/board', async () => {
    const res = await api({ path: '/api/board' });
    expect(res.status).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, data: { name: 'test' } });
  });

  it('POST /api/tasks создаёт задачу от имени actor сервера; GET /api/tasks с фильтром q', async () => {
    const created = await api({ method: 'POST', path: '/api/tasks', body: { title: 'Из UI', fields: { priority: 'p1' } } });
    expect(created.status).toBe(200);
    expect(created.json()).toMatchObject({ ok: true, data: { id: 'T-001', created_by: 'Test Human' } });
    await api({ method: 'POST', path: '/api/tasks', body: { title: 'Другая' } });
    const list = await api({ path: '/api/tasks?q=%D0%B8%D0%B7%20ui' });
    expect(list.json<{ data: { tasks: { id: string }[] } }>().data.tasks.map((t) => t.id)).toEqual(['T-001']);
  });

  it('PATCH, move и notes', async () => {
    await api({ method: 'POST', path: '/api/tasks', body: { title: 'X' } });
    expect((await api({ method: 'PATCH', path: '/api/tasks/T-001', body: { title: 'Y' } })).json()).toMatchObject({ data: { title: 'Y' } });
    const moved = await api({ method: 'POST', path: '/api/tasks/T-001/move', body: { to: 'in_progress', fields: { assignee: 'me' } } });
    expect(moved.json()).toMatchObject({ data: { column: 'in_progress' } });
    const noted = await api({ method: 'POST', path: '/api/tasks/T-001/notes', body: { text: 'заметка' } });
    expect(noted.json()).toMatchObject({ data: { notes: [{ by: 'Test Human', text: 'заметка' }] } });
    expect((await api({ path: '/api/tasks/T-001' })).json()).toMatchObject({ data: { title: 'Y', column: 'in_progress' } });
  });

  it('ошибки ядра: статус и JSON ошибки', async () => {
    await api({ method: 'POST', path: '/api/tasks', body: { title: 'X' } });
    const forbidden = await api({ method: 'POST', path: '/api/tasks/T-001/move', body: { to: 'done' } });
    expect(forbidden.status).toBe(409);
    expect(forbidden.json()).toMatchObject({ ok: false, error: { code: 'TRANSITION_FORBIDDEN', allowed: ['in_progress'] } });
    expect((await api({ path: '/api/tasks/T-404' })).status).toBe(404);
  });

  it.each([
    ['неизвестный маршрут', { path: '/api/nope' }, 404],
    ['неизвестный метод', { method: 'DELETE', path: '/api/tasks/T-001' }, 404],
    ['не JSON', { method: 'POST', path: '/api/tasks', body: '{oops' }, 400],
    ['массив вместо объекта', { method: 'POST', path: '/api/tasks', body: [1] }, 400],
    ['лишний ключ', { method: 'POST', path: '/api/tasks', body: { title: 'X', colour: 'red' } }, 400],
  ])('%s → %i', async (_name, req, status) => {
    expect((await api(req)).status).toBe(status);
  });

  it('403 при чужом Host и при POST без Origin или с чужим Origin', async () => {
    expect((await api({ path: '/api/board', headers: { host: 'evil.test' } })).status).toBe(403);
    expect((await api({ method: 'POST', path: '/api/tasks', body: { title: 'X' }, headers: { origin: 'https://evil.test' } })).status).toBe(403);
    const withoutOrigin = await rawRequest(server.port, {
      method: 'POST', path: '/api/tasks', body: { title: 'X' }, headers: { origin: '' },
    });
    expect(withoutOrigin.status).toBe(403);
  });

  it('Host localhost разрешён', async () => {
    expect((await api({ path: '/api/board', headers: { host: `localhost:${server.port}` } })).status).toBe(200);
  });

  it('SSE: событие task_changed после записи файла', async () => {
    const sse = await openSse(server.port);
    try {
      await writeFile(taskPath(root, 'T-042'), 'x');
      await vi.waitFor(() => expect(sse.text()).toContain('event: task_changed\ndata: {"type":"task_changed","id":"T-042"}'), { timeout: 3000 });
    } finally {
      sse.close();
    }
  });
});

describe('статика', () => {
  it('index.html с CSP, ассеты с типом, SPA-фолбэк', async () => {
    const index = await api({ path: '/' });
    expect(index.headers['content-security-policy']).toBe(CSP);
    expect(index.text).toContain('<title>desk</title>');
    expect((await api({ path: '/assets/app.js' })).headers['content-type']).toContain('text/javascript');
    expect((await api({ path: '/board/T-001' })).text).toContain('<title>desk</title>');
  });

  it('500 с подсказкой, если UI не собран', async () => {
    await server.close();
    staticDir = join(await makeEmptyDir(), 'missing');
    server = await start(root);
    const res = await api({ path: '/' });
    expect(res.status).toBe(500);
    expect(res.text).toContain('npm run build');
  });
});

describe('без .desk', () => {
  it('API отвечает 500 INVALID_BOARD', async () => {
    await server.close();
    server = await start(await makeEmptyDir());
    const res = await api({ path: '/api/board' });
    expect(res.status).toBe(500);
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'INVALID_BOARD' } });
  });
});
```

Про тест «без Origin»: `rawRequest` подставляет `origin` по умолчанию, а пустая строка в `headers` его затирает; сервер получает `origin: ''` и должен ответить 403.

- [ ] **Step 3: Запустить и убедиться, что падает**

Run: `npx vitest run tests/unit/http-units.test.ts tests/integration/http.test.ts`
Expected: FAIL — модули `src/http/*` не найдены.

- [ ] **Step 4: Реализовать `origin-guard.ts`, `events.ts`, `static.ts`**

`src/http/origin-guard.ts`:
```ts
import type { IncomingHttpHeaders } from 'node:http';

const SAFE_METHODS = new Set(['GET', 'HEAD']);

export function checkRequestOrigin(headers: IncomingHttpHeaders, method: string, port: number): string | null {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!headers.host || !hosts.includes(headers.host)) {
    return `Недопустимый Host: ${headers.host ?? 'нет'}. desk ui принимает только ${hosts.join(' и ')}.`;
  }
  if (SAFE_METHODS.has(method)) return null;
  const origins = hosts.map((h) => `http://${h}`);
  if (!headers.origin || !origins.includes(headers.origin)) {
    return `Недопустимый Origin: ${headers.origin || 'нет'}. Изменять данные можно только со страницы desk ui.`;
  }
  return null;
}
```

`src/http/events.ts`:
```ts
import type { ServerResponse } from 'node:http';
import type { DeskEvent } from '../core/watch.js';

export interface EventHub {
  add(res: ServerResponse): void;
  broadcast(event: DeskEvent): void;
  closeAll(): void;
  size(): number;
}

const DEFAULT_HEARTBEAT_MS = 25_000;

export function createEventHub(heartbeatMs: number = DEFAULT_HEARTBEAT_MS): EventHub {
  const clients = new Set<ServerResponse>();
  const heartbeat = setInterval(() => {
    for (const client of clients) client.write(': ping\n\n');
  }, heartbeatMs);
  heartbeat.unref();

  return {
    add(res) {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      clients.add(res);
      res.on('close', () => clients.delete(res));
    },
    broadcast(event) {
      const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
      for (const client of clients) client.write(frame);
    },
    closeAll() {
      clearInterval(heartbeat);
      for (const client of clients) client.end();
      clients.clear();
    },
    size: () => clients.size,
  };
}
```

`src/http/static.ts`:
```ts
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
  "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT' || (e as NodeJS.ErrnoException).code === 'ENOTDIR') return false;
    throw e;
  }
}

export async function serveStatic(res: ServerResponse, staticDir: string, pathname: string): Promise<void> {
  let relative: string;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    res.writeHead(400).end();
    return;
  }
  const root = resolve(staticDir);
  const candidate = resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  const file = (await isFile(candidate)) ? candidate : join(root, 'index.html');
  if (!(await isFile(file))) {
    res
      .writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      .end('UI не собран. Выполни npm run build в репозитории desk.');
    return;
  }
  const isHtml = extname(file) === '.html';
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'cache-control': isHtml ? 'no-store' : 'public, max-age=31536000, immutable',
    ...(isHtml ? { 'content-security-policy': CSP } : {}),
  });
  createReadStream(file).pipe(res);
}
```

- [ ] **Step 5: Реализовать `routes.ts` и `server.ts`**

`src/http/routes.ts`:
```ts
import type { BoardHolder } from '../core/board-holder.js';
import { DeskError, isDeskError, type ErrorCode } from '../core/errors.js';
import { presentTaskList } from '../core/present.js';
import type { TaskFilter } from '../core/query.js';
import { loadAll } from '../core/task-store.js';
import type { Clock } from '../core/types.js';
import { callTool } from '../mcp/tools.js';

export interface ApiContext {
  holder: BoardHolder;
  actor: string;
  clock: Clock;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNKNOWN_FIELD: 400,
  INVALID_VALUE: 400,
  REQUIRED_MISSING: 400,
  NOT_FOUND: 404,
  TRANSITION_FORBIDDEN: 409,
  TRANSITION_REQUIRES: 409,
  WIP_LIMIT: 409,
  LOCK_TIMEOUT: 503,
  INVALID_BOARD: 500,
};

export function statusFor(code: ErrorCode): number {
  return STATUS[code];
}

export async function handleApi(ctx: ApiContext, method: string, url: URL, body: unknown): Promise<ApiResponse> {
  try {
    return { status: 200, body: { ok: true, data: await dispatch(ctx, method, url, body) } };
  } catch (e) {
    if (isDeskError(e)) return { status: statusFor(e.code), body: { ok: false, error: e.toJSON() } };
    throw e;
  }
}

function asObject(body: unknown): Record<string, unknown> {
  if (body === undefined) return {};
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new DeskError('BAD_REQUEST', 'Тело запроса должно быть JSON-объектом');
  }
  return body as Record<string, unknown>;
}

async function listTasks(ctx: ApiContext, params: URLSearchParams): Promise<unknown> {
  const board = ctx.holder.read();
  const pick = (key: string): string | undefined => params.get(key) || undefined;
  const filter: TaskFilter = { column: pick('column'), assignee: pick('assignee'), query: pick('q') };
  return presentTaskList(board, await loadAll(ctx.holder.requireRoot(), board), filter);
}

async function dispatch(ctx: ApiContext, method: string, url: URL, body: unknown): Promise<unknown> {
  const tool = { holder: ctx.holder, clock: ctx.clock };
  const [, resource, id, action, ...rest] = url.pathname.split('/').filter(Boolean);
  const route = rest.length > 0 ? 'unknown' : `${method} ${resource ?? ''}${id ? '/:id' : ''}${action ? `/${action}` : ''}`;
  const withActor = (extra: Record<string, unknown>): Record<string, unknown> => ({ ...asObject(body), ...extra, actor: ctx.actor });

  switch (route) {
    case 'GET board':
      return callTool(tool, 'get_board', {});
    case 'GET tasks':
      return listTasks(ctx, url.searchParams);
    case 'GET tasks/:id':
      return callTool(tool, 'get_task', { id });
    case 'POST tasks':
      return callTool(tool, 'create_task', withActor({}));
    case 'PATCH tasks/:id':
      return callTool(tool, 'update_task', withActor({ id }));
    case 'POST tasks/:id/move':
      return callTool(tool, 'move_task', withActor({ id }));
    case 'POST tasks/:id/notes':
      return callTool(tool, 'add_note', withActor({ id }));
    default:
      throw new DeskError('NOT_FOUND', `Маршрут ${method} ${url.pathname} не найден`);
  }
}
```

`src/http/server.ts`:
```ts
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createBoardHolder } from '../core/board-holder.js';
import { DeskError, isDeskError } from '../core/errors.js';
import type { Clock } from '../core/types.js';
import { watchDesk } from '../core/watch.js';
import { createEventHub } from './events.js';
import { checkRequestOrigin } from './origin-guard.js';
import { handleApi, type ApiContext } from './routes.js';
import { serveStatic } from './static.js';

export interface HttpServerOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  port: number;
  host?: string;
  staticDir: string;
  actor: string;
  clock?: Clock;
}

export interface RunningHttpServer {
  url: string;
  port: number;
  ready: Promise<void>;
  close(): Promise<void>;
}

const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res
    .writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    .end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new DeskError('BAD_REQUEST', 'Тело запроса больше 1 МБ');
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (text.trim() === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new DeskError('BAD_REQUEST', 'Тело запроса — не JSON');
  }
}

export async function startHttpServer(opts: HttpServerOptions): Promise<RunningHttpServer> {
  const holder = await createBoardHolder(opts.cwd, opts.env ?? process.env);
  const hub = createEventHub();
  const watcher =
    holder.root === null
      ? null
      : watchDesk(holder.root, (event) => {
          const reloaded = event.type === 'board_changed' ? holder.reload() : Promise.resolve();
          void reloaded
            .then(() => hub.broadcast(event))
            .catch((e: unknown) => process.stderr.write(`desk ui: ошибка обработки события: ${String(e)}\n`));
        });
  const ctx: ApiContext = { holder, actor: opts.actor, clock: opts.clock ?? (() => new Date()) };
  let port = opts.port;

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const method = req.method ?? 'GET';
    const denied = checkRequestOrigin(req.headers, method, port);
    if (denied) {
      sendJson(res, 403, { ok: false, error: new DeskError('BAD_REQUEST', denied).toJSON() });
      return;
    }
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/events' && method === 'GET') {
      hub.add(res);
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      let body: unknown;
      try {
        body = method === 'GET' ? undefined : await readJsonBody(req);
      } catch (e) {
        if (!isDeskError(e)) throw e;
        sendJson(res, 400, { ok: false, error: e.toJSON() });
        return;
      }
      const result = await handleApi(ctx, method, url, body);
      sendJson(res, result.status, result.body);
      return;
    }
    await serveStatic(res, opts.staticDir, url.pathname);
  };

  const server = createServer((req, res) => {
    handle(req, res).catch((e: unknown) => {
      process.stderr.write(`desk ui: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
      if (res.headersSent) {
        res.end();
        return;
      }
      sendJson(res, 500, {
        ok: false,
        error: { code: 'INTERNAL', message: 'Внутренняя ошибка desk ui, подробности в терминале', field: null, guide: null, allowed: null },
      });
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', (e: NodeJS.ErrnoException) => {
      reject(
        e.code === 'EADDRINUSE'
          ? new DeskError('BAD_REQUEST', `Порт ${opts.port} занят. Запусти desk ui --port <другой порт>.`)
          : e,
      );
    });
    server.listen(opts.port, opts.host ?? '127.0.0.1', () => resolve());
  });
  port = (server.address() as AddressInfo).port;

  return {
    url: `http://127.0.0.1:${port}`,
    port,
    ready: watcher?.ready ?? Promise.resolve(),
    close: async () => {
      hub.closeAll();
      await watcher?.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
```

- [ ] **Step 6: Запустить тесты и покрытие**

Run: `npx vitest run tests/unit/http-units.test.ts tests/integration/http.test.ts && npx tsc --noEmit && npx vitest run --coverage`
Expected: PASS; отчёт покрытия ≥ 80% по всем четырём метрикам для `src/core`, `src/mcp`, `src/http`. Если ниже — добавь тест на непокрытую ветку в файл теста соответствующего модуля (не снижай порог).

- [ ] **Step 7: Commit**

```bash
git add src/http tests/helpers/http.ts tests/unit/http-units.test.ts tests/integration/http.test.ts
git commit -m "feat: add local HTTP API with SSE, static UI and host/origin guard"
```

---

### Task 13: CLI — `init`, `validate`, `mcp`, `ui`, README

**Files:**
- Create: `src/cli/templates.ts`, `src/cli/init.ts`, `src/cli/validate-project.ts`, `src/cli/git.ts`, `src/cli/run.ts`, `src/cli/index.ts`, `README.md`
- Test: `tests/integration/cli.test.ts`, `tests/integration/mcp-stdio.test.ts`

**Interfaces:**
- Consumes: `runStdio` (Task 11), `startHttpServer` (Task 12), `loadBoard`, `parseBoard` (Task 3), `loadAll` (Task 7), `findDuplicateIds` (Task 5), `findRoot`, `deskDir`, `boardPath`, `tasksDir` (Task 1)
- Produces:
  - `BOARD_TEMPLATE`, `CLAUDE_MD_SNIPPET`, `CLAUDE_MD_MARKER`, `DESK_MCP_SERVER`
  - `initProject(root: string, opts: { claudeMd: boolean }): Promise<string[]>`
  - `validateProject(root: string): Promise<{ ok: boolean; lines: string[] }>`
  - `gitUserName(cwd: string): Promise<string | null>`; `toActorName(raw: string | null): string`
  - `interface CliIo { cwd: string; env: NodeJS.ProcessEnv; out(line: string): void; err(line: string): void }`
  - `runCli(argv: string[], io?: CliIo): Promise<number>`; `parseUiArgs(args: string[]): { port: number; open: boolean }`; `DEFAULT_PORT = 4717`; `HELP`

- [ ] **Step 1: Написать падающие тесты**

`tests/integration/cli.test.ts`:
```ts
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBoard } from '../../src/core/board-loader.js';
import { taskPath } from '../../src/core/paths.js';
import { toActorName } from '../../src/cli/git.js';
import { runCli, parseUiArgs, type CliIo } from '../../src/cli/run.js';
import { BOARD_TEMPLATE } from '../../src/cli/templates.js';
import { catchError } from '../helpers/errors.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

function captureIo(cwd: string): CliIo & { stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { cwd, env: {}, out: (l) => stdout.push(l), err: (l) => stderr.push(l), stdout, stderr };
}

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'));

describe('BOARD_TEMPLATE', () => {
  it('валиден и содержит 4 колонки и guide', () => {
    const board = parseBoard(BOARD_TEMPLATE);
    expect(board.columns.map((c) => c.id)).toEqual(['backlog', 'in_progress', 'review', 'done']);
    expect(board.guide).toContain('actor');
    expect(board.fields.every((f) => f.guide)).toBe(true);
  });
});

describe('desk init', () => {
  it('в пустой папке создаёт .desk, .gitignore и .mcp.json', async () => {
    const dir = await makeEmptyDir();
    const io = captureIo(dir);
    expect(await runCli(['init'], io)).toBe(0);
    expect(parseBoard(await readFile(join(dir, '.desk', 'board.yaml'), 'utf8')).name).toBe('desk');
    expect(existsSync(join(dir, '.desk', 'tasks'))).toBe(true);
    expect(await readFile(join(dir, '.gitignore'), 'utf8')).toBe('.desk/.lock\n');
    expect(await readJson(join(dir, '.mcp.json'))).toEqual({ mcpServers: { desk: { command: 'desk', args: ['mcp'] } } });
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
    expect(io.stdout.join('\n')).toContain('board.yaml');
  });

  it('сливает существующие .mcp.json и .gitignore', async () => {
    const dir = await makeEmptyDir();
    await writeFile(join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'x' } }, extra: 1 }));
    await writeFile(join(dir, '.gitignore'), 'node_modules/');
    expect(await runCli(['init'], captureIo(dir))).toBe(0);
    expect(await readJson(join(dir, '.mcp.json'))).toEqual({
      mcpServers: { other: { command: 'x' }, desk: { command: 'desk', args: ['mcp'] } },
      extra: 1,
    });
    expect(await readFile(join(dir, '.gitignore'), 'utf8')).toBe('node_modules/\n.desk/.lock\n');
  });

  it('--claude-md дописывает правило, сохраняя CLAUDE.md', async () => {
    const dir = await makeEmptyDir();
    await writeFile(join(dir, 'CLAUDE.md'), '# Проект\n');
    expect(await runCli(['init', '--claude-md'], captureIo(dir))).toBe(0);
    const text = await readFile(join(dir, 'CLAUDE.md'), 'utf8');
    expect(text.startsWith('# Проект\n\n<!-- desk -->')).toBe(true);
    expect(text).toContain('get_board');
  });

  it('отказ, если .desk уже есть; ничего не меняет', async () => {
    const dir = await makeProject();
    const io = captureIo(dir);
    expect(await runCli(['init'], io)).toBe(1);
    expect(io.stderr.join()).toContain('уже существует');
    expect(existsSync(join(dir, '.mcp.json'))).toBe(false);
  });

  it('битый .mcp.json — отказ до создания .desk', async () => {
    const dir = await makeEmptyDir();
    await writeFile(join(dir, '.mcp.json'), '{not json');
    const io = captureIo(dir);
    expect(await runCli(['init'], io)).toBe(1);
    expect(io.stderr.join()).toContain('.mcp.json');
    expect(existsSync(join(dir, '.desk'))).toBe(false);
  });
});

describe('desk validate', () => {
  it('OK для валидного проекта', async () => {
    const io = captureIo(await makeProject());
    expect(await runCli(['validate'], io)).toBe(0);
    expect(io.stdout[0]).toContain('OK');
  });

  it('1 и строки с ID для невалидных задач', async () => {
    const root = await makeProject();
    await writeFile(taskPath(root, 'T-001'), 'мусор');
    await writeFile(taskPath(root, 'T-01'), 'мусор');
    const io = captureIo(root);
    expect(await runCli(['validate'], io)).toBe(1);
    expect(io.stderr.some((l) => l.startsWith('T-001:'))).toBe(true);
    expect(io.stderr.some((l) => l.includes('дубликат ID'))).toBe(true);
  });

  it('1 для сломанного board.yaml', async () => {
    const root = await makeProject('version: 1\ncolumns: [\n');
    expect(await runCli(['validate'], captureIo(root))).toBe(1);
  });

  it('1 с подсказкой вне проекта', async () => {
    const io = captureIo(await makeEmptyDir());
    expect(await runCli(['validate'], io)).toBe(1);
    expect(io.stderr.join()).toContain('desk init');
  });

  it('находит проект из вложенной папки', async () => {
    const root = await makeProject();
    const nested = join(root, 'packages', 'api');
    await mkdir(nested, { recursive: true });
    expect(await runCli(['validate'], captureIo(nested))).toBe(0);
  });
});

describe('прочее', () => {
  it('help и неизвестная команда', async () => {
    const io = captureIo(await makeEmptyDir());
    expect(await runCli([], io)).toBe(0);
    expect(io.stdout.join()).toContain('desk init');
    expect(await runCli(['destroy'], io)).toBe(1);
  });

  it.each([
    [[], { port: 4717, open: false }],
    [['--port', '5000', '--open'], { port: 5000, open: true }],
  ])('parseUiArgs %j', (args, expected) => expect(parseUiArgs(args)).toEqual(expected));

  it.each([[['--port']], [['--port', 'abc']], [['--port', '70000']], [['--verbose']]])('parseUiArgs %j → BAD_REQUEST', (args) => {
    expect(catchError(() => parseUiArgs(args)).code).toBe('BAD_REQUEST');
  });

  it.each([
    [null, 'human'],
    ['', 'human'],
    ['Denis Runov', 'Denis Runov'],
    ['a: b · c', 'a b c'],
    ['x'.repeat(80), 'x'.repeat(64)],
  ])('toActorName(%j) = %j', (raw, expected) => expect(toActorName(raw)).toBe(expected));
});
```

`tests/integration/mcp-stdio.test.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it } from 'vitest';
import { makeProject } from '../helpers/project.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

describe('desk mcp по stdio', () => {
  it('реальный процесс отвечает на list_tools и create_task', async () => {
    const root = await makeProject();
    const env = Object.fromEntries(
      Object.entries({ ...process.env, DESK_ROOT: root }).filter((e): e is [string, string] => e[1] !== undefined),
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', 'src/cli/index.ts', 'mcp'],
      cwd: repoRoot,
      env,
    });
    const client = new Client({ name: 'stdio-test', version: '1.0.0' });
    await client.connect(transport);
    try {
      expect((await client.listTools()).tools).toHaveLength(7);
      const result = (await client.callTool({ name: 'create_task', arguments: { actor: 'stdio', title: 'Из процесса' } })) as {
        content: { text: string }[];
      };
      expect(JSON.parse(result.content[0]?.text ?? '{}')).toMatchObject({ id: 'T-001' });
    } finally {
      await client.close();
    }
  }, 30_000);
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `npx vitest run tests/integration/cli.test.ts tests/integration/mcp-stdio.test.ts`
Expected: FAIL — модули `src/cli/*` не найдены.

- [ ] **Step 3: Реализовать `templates.ts`, `git.ts`, `validate-project.ts`, `init.ts`**

`src/cli/templates.ts`:
```ts
export const BOARD_TEMPLATE = `version: 1
name: desk
id_prefix: T
guide: |
  Канбан-доска проекта. Правила для агентов:
  - Перед созданием задачи ищи дубликаты через list_tasks с query.
  - Одна задача = один законченный результат, который можно проверить.
  - В actor всегда передавай своё имя агента.
  - Решения и находки записывай через add_note.

columns:
  - id: backlog
    title: Backlog
    guide: Новые задачи. Сюда кладётся всё, что не берут в работу сразу.
  - id: in_progress
    title: In progress
    wip_limit: 3
    guide: Задачи в работе. Берёшь задачу — ставь assignee = своё имя.
  - id: review
    title: Review
    guide: Работа сделана и ждёт проверки. Нужна ссылка на PR.
  - id: done
    title: Done
    guide: Проверено и принято.

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
    guide: "p0 — прод лежит. p1 — блокирует другую задачу. p2 — по умолчанию. p3 — nice to have."
  - id: area
    type: enum
    values: [backend, frontend, infra, docs]
    guide: Часть системы, которую меняет задача.
  - id: pr_url
    type: url
    guide: Ссылка на PR. Нужна для перехода в review.
  - id: estimate
    type: number
    min: 0
    guide: Оценка в часах работы агента, не человека.
`;

export const CLAUDE_MD_MARKER = '<!-- desk -->';

export const CLAUDE_MD_SNIPPET = `${CLAUDE_MD_MARKER}
## Канбан-доска desk

Задачи проекта ведём на доске desk через MCP-сервер \`desk\`.

- Перед работой вызови \`get_board\` и следуй \`guide\` доски, колонок и полей.
- В \`actor\` всегда передавай своё имя агента.
- Перед созданием задачи ищи дубликаты: \`list_tasks\` с \`query\`.
- Берёшь задачу — перенеси её через \`move_task\` и заполни поля, которые требует переход.
- Решения и находки записывай через \`add_note\`.
`;

export const DESK_MCP_SERVER = { command: 'desk', args: ['mcp'] } as const;
```

`src/cli/git.ts`:
```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MAX_ACTOR = 64;

/** user.name из git. null, если git не установлен или имя не задано: это штатный случай, вызывающий подставит human. */
export async function gitUserName(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['config', 'user.name'], { cwd });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export function toActorName(raw: string | null): string {
  const cleaned = (raw ?? '')
    .replace(/[:·\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ACTOR)
    .trim();
  return cleaned || 'human';
}
```

`src/cli/validate-project.ts`:
```ts
import { loadBoard } from '../core/board-loader.js';
import { isDeskError } from '../core/errors.js';
import { findDuplicateIds } from '../core/ids.js';
import { loadAll } from '../core/task-store.js';

export async function validateProject(root: string): Promise<{ ok: boolean; lines: string[] }> {
  let board;
  try {
    board = await loadBoard(root);
  } catch (e) {
    if (isDeskError(e)) return { ok: false, lines: [e.message] };
    throw e;
  }
  const loaded = await loadAll(root, board);
  const lines = [
    ...loaded.flatMap((l) => l.errors.map((error) => `${l.id}: ${error}`)),
    ...findDuplicateIds(loaded.map((l) => l.id)).map((group) => `дубликат ID: ${group.join(', ')}`),
  ];
  return lines.length > 0
    ? { ok: false, lines }
    : { ok: true, lines: [`OK: board.yaml валиден, задач: ${loaded.length}`] };
}
```

`src/cli/init.ts`:
```ts
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DeskError } from '../core/errors.js';
import { boardPath, deskDir, tasksDir } from '../core/paths.js';
import { BOARD_TEMPLATE, CLAUDE_MD_MARKER, CLAUDE_MD_SNIPPET, DESK_MCP_SERVER } from './templates.js';

export interface InitOptions {
  claudeMd: boolean;
}

type McpConfig = Record<string, unknown> & { mcpServers?: Record<string, unknown> };

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

async function readMcpConfig(path: string): Promise<McpConfig> {
  const text = await readOptional(path);
  if (text === null) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DeskError('BAD_REQUEST', `${path} — не JSON. Исправь файл и повтори desk init.`);
  }
  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(parsed) || (parsed.mcpServers !== undefined && !isObject(parsed.mcpServers))) {
    throw new DeskError('BAD_REQUEST', `${path}: ожидается объект с полем mcpServers-объектом.`);
  }
  return parsed as McpConfig;
}

const appendLine = (text: string, line: string): string =>
  `${text}${text === '' || text.endsWith('\n') ? '' : '\n'}${line}\n`;

export async function initProject(root: string, opts: InitOptions): Promise<string[]> {
  if (existsSync(deskDir(root))) {
    throw new DeskError('BAD_REQUEST', `${deskDir(root)} уже существует. desk init ничего не изменил.`);
  }
  const mcpPath = join(root, '.mcp.json');
  const mcpConfig = await readMcpConfig(mcpPath);
  const gitignorePath = join(root, '.gitignore');
  const gitignore = (await readOptional(gitignorePath)) ?? '';
  const claudePath = join(root, 'CLAUDE.md');
  const claude = opts.claudeMd ? ((await readOptional(claudePath)) ?? '') : null;

  await mkdir(tasksDir(root), { recursive: true });
  await writeFile(boardPath(root), BOARD_TEMPLATE);
  await writeFile(join(tasksDir(root), '.gitkeep'), '');

  const hasLockIgnore = gitignore.split(/\r?\n/).some((line) => line.trim() === '.desk/.lock');
  if (!hasLockIgnore) await writeFile(gitignorePath, appendLine(gitignore, '.desk/.lock'));

  const merged: McpConfig = { ...mcpConfig, mcpServers: { ...(mcpConfig.mcpServers ?? {}), desk: DESK_MCP_SERVER } };
  await writeFile(mcpPath, `${JSON.stringify(merged, null, 2)}\n`);

  const claudeChanged = claude !== null && !claude.includes(CLAUDE_MD_MARKER);
  if (claude !== null && claudeChanged) {
    const separator = claude === '' ? '' : claude.endsWith('\n\n') ? '' : claude.endsWith('\n') ? '\n' : '\n\n';
    await writeFile(claudePath, `${claude}${separator}${CLAUDE_MD_SNIPPET}`);
  }

  return [
    'Создан .desk/board.yaml — опиши колонки, поля и guide для агентов.',
    'Создан .desk/tasks/ — здесь будут файлы задач.',
    hasLockIgnore ? '.gitignore уже содержит .desk/.lock' : 'В .gitignore добавлен .desk/.lock',
    'В .mcp.json добавлен сервер desk. Перезапусти Claude Code, чтобы он подключился.',
    ...(claudeChanged ? ['В CLAUDE.md добавлено правило работы с доской.'] : []),
    'Доска в браузере: desk ui --open',
  ];
}
```

- [ ] **Step 4: Реализовать `run.ts` и `index.ts`**

`src/cli/run.ts`:
```ts
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DeskError, isDeskError } from '../core/errors.js';
import { findRoot } from '../core/paths.js';
import { startHttpServer } from '../http/server.js';
import { runStdio } from '../mcp/server.js';
import { gitUserName, toActorName } from './git.js';
import { initProject } from './init.js';
import { validateProject } from './validate-project.js';

export const DEFAULT_PORT = 4717;
const UI_DIR = fileURLToPath(new URL('../ui', import.meta.url));

export const HELP = `desk — канбан-доска для агентов

Команды:
  desk init [--claude-md]      создать .desk/ в текущей папке и подключить MCP в .mcp.json
  desk mcp                     MCP-сервер по stdio (его запускает Claude Code)
  desk ui [--port N] [--open]  веб-доска на http://127.0.0.1:${DEFAULT_PORT}
  desk validate                проверить board.yaml и все задачи`;

export interface CliIo {
  cwd: string;
  env: NodeJS.ProcessEnv;
  out(line: string): void;
  err(line: string): void;
}

const defaultIo = (): CliIo => ({
  cwd: process.cwd(),
  env: process.env,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
});

export function parseUiArgs(args: string[]): { port: number; open: boolean } {
  const portIndex = args.indexOf('--port');
  const rawPort = portIndex === -1 ? String(DEFAULT_PORT) : args[portIndex + 1];
  const port = Number(rawPort);
  if (rawPort === undefined || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new DeskError('BAD_REQUEST', `--port: ожидается целое число 1–65535, получено ${rawPort ?? 'ничего'}`);
  }
  const unknown = args.filter((arg, i) => arg !== '--open' && arg !== '--port' && !(portIndex !== -1 && i === portIndex + 1));
  if (unknown.length > 0) throw new DeskError('BAD_REQUEST', `Неизвестные аргументы: ${unknown.join(' ')}`);
  return { port, open: args.includes('--open') };
}

function openBrowser(url: string, io: CliIo): void {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  const child = spawn(command, [url], { detached: true, stdio: 'ignore' });
  child.on('error', (e) => io.err(`desk ui: не удалось открыть браузер: ${e.message}`));
  child.unref();
}

async function runUi(args: string[], io: CliIo): Promise<number> {
  const { port, open } = parseUiArgs(args);
  const root = findRoot(io.cwd, io.env);
  const actor = toActorName(await gitUserName(root));
  const server = await startHttpServer({ cwd: root, env: io.env, port, staticDir: UI_DIR, actor });
  io.out(`desk ui: ${server.url}  (actor: ${actor}, Ctrl+C — выход)`);
  if (open) openBrowser(server.url, io);
  const stop = (): void => {
    void server.close().then(() => process.exit(0));
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return 0;
}

export async function runCli(argv: string[], io: CliIo = defaultIo()): Promise<number> {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case 'init':
        (await initProject(io.cwd, { claudeMd: rest.includes('--claude-md') })).forEach((line) => io.out(line));
        return 0;
      case 'validate': {
        const result = await validateProject(findRoot(io.cwd, io.env));
        result.lines.forEach((line) => (result.ok ? io.out(line) : io.err(line)));
        return result.ok ? 0 : 1;
      }
      case 'mcp':
        await runStdio(io.cwd, io.env);
        return 0;
      case 'ui':
        return await runUi(rest, io);
      case undefined:
      case 'help':
      case '--help':
        io.out(HELP);
        return 0;
      default:
        io.err(`Неизвестная команда: ${command}\n\n${HELP}`);
        return 1;
    }
  } catch (e) {
    if (isDeskError(e)) {
      io.err(e.message);
      return 1;
    }
    throw e;
  }
}
```

`src/cli/index.ts`:
```ts
#!/usr/bin/env node
import { runCli } from './run.js';

try {
  process.exitCode = await runCli(process.argv.slice(2));
} catch (e) {
  process.stderr.write(`desk: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exitCode = 1;
}
```

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run tests/integration/cli.test.ts tests/integration/mcp-stdio.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Написать README.md**

````markdown
# desk

Канбан-доска для AI-агентов. Задачи лежат в репозитории проекта как markdown-файлы, агенты работают с доской через MCP-сервер, человек — через веб-доску.

## Установка

```bash
git clone <repo> ~/projects/desk && cd ~/projects/desk
npm install
npm run build
npm i -g .
```

## Подключение к проекту

```bash
cd ~/projects/my-app
desk init --claude-md
```

Команда создаёт `.desk/board.yaml`, `.desk/tasks/`, добавляет `.desk/.lock` в `.gitignore` и сервер `desk` в `.mcp.json`. С флагом `--claude-md` в `CLAUDE.md` добавляется правило работы с доской. После этого перезапусти Claude Code.

## Настройка доски

Всё описывается в `.desk/board.yaml`:

- `guide` — общие правила для агентов;
- `columns` — колонки, их `guide` и `wip_limit`;
- `transitions` — разрешённые переходы и поля, которые они требуют (`requires`);
- `fields` — поля задачи: `type`, `values`, `required`, `default`, `guide`.

Типы полей: `string`, `text`, `number`, `bool`, `date`, `url`, `enum`, `multi_enum`, `task_ref`. Агент видит `guide` в описании каждого MCP tool и в ответе на ошибку. После правки файла MCP-сервер перечитывает схему сам.

## Команды

| Команда | Что делает |
|---|---|
| `desk init [--claude-md]` | Подключает доску к проекту |
| `desk ui [--port N] [--open]` | Веб-доска на `http://127.0.0.1:4717` |
| `desk validate` | Проверяет `board.yaml` и задачи; код выхода 1 при ошибках |
| `desk mcp` | MCP-сервер по stdio (запускает Claude Code) |

## MCP tools

`get_board`, `list_tasks`, `get_task`, `create_task`, `update_task`, `move_task`, `add_note`. Изменяющие tools требуют `actor` — имя агента. Ошибки приходят как `{ code, message, field, guide, allowed }`.

## Разработка

```bash
npm test              # unit и integration
npm run test:coverage # покрытие, порог 80%
npm run test:e2e      # сборка и Playwright
```
````

- [ ] **Step 7: Проверить сборку CLI вручную**

Run:
```bash
npm run build:server
chmod +x dist/cli/index.js
DIR=$(mktemp -d) && (cd "$DIR" && node ~/projects/desk/dist/cli/index.js init && node ~/projects/desk/dist/cli/index.js validate)
```
Expected: строки про созданный `.desk/board.yaml`, затем `OK: board.yaml валиден, задач: 0`.

- [ ] **Step 8: Полный прогон и commit**

Run: `npm test && npx tsc --noEmit`
Expected: все unit и integration тесты PASS.

```bash
git add src/cli README.md tests/integration/cli.test.ts tests/integration/mcp-stdio.test.ts
git commit -m "feat: add desk CLI with init, validate, mcp and ui commands"
```
