import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readdir, unlink } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { createBoardHolder } from '../core/board-holder.js';
import { DeskError, isDeskError } from '../core/errors.js';
import type { Clock } from '../core/types.js';
import { watchDesk } from '../core/watch.js';
import { createEventHub } from './events.js';
import { checkRequestOrigin } from './origin-guard.js';
import { handleApi, normalizeApiUrl, statusFor, type ApiContext } from './routes.js';
import { serveStatic } from './static.js';
import { tasksDir, taskPath } from '../core/paths.js';
import { loadWorkspace } from '../core/workspace.js';

export interface HttpServerOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  port: number;
  host?: string;
  staticDir: string;
  actor: string;
  clock?: Clock;
  /**
   * Включает POST /api/test/reset (удаляет все файлы задач, без аутентификации).
   * Только для E2E-тестов — по умолчанию falsy, маршрут не существует.
   * Значение может прийти только из кода, вызывающего startHttpServer, никогда из env.
   */
  testReset?: boolean;
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
    const data = chunk as Buffer;
    size += data.length;
    if (size > MAX_BODY_BYTES) throw new DeskError('BAD_REQUEST', 'Тело запроса больше 1 МБ');
    chunks.push(data);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new DeskError('BAD_REQUEST', 'Тело запроса — не JSON');
  }
}

/** POST /api/test/reset: удаляет все файлы задач. Существует только когда opts.testReset === true. */
async function resetTasks(root: string): Promise<void> {
  const names = await readdir(tasksDir(root));
  const removable = names.filter((name) => /^T-\d+\.md$/.test(name));
  await Promise.all(removable.map((name) => unlink(taskPath(root, name.slice(0, -3))).catch(() => undefined)));
}

function isTestResetRequest(opts: HttpServerOptions, url: URL, method: string): boolean {
  return opts.testReset === true && url.pathname === '/api/test/reset' && method === 'POST';
}

async function handleEvents(
  ctx: ApiContext,
  hub: ReturnType<typeof createEventHub>,
  method: string,
  url: URL,
  res: ServerResponse,
): Promise<boolean> {
  const isEventsPath = url.pathname.startsWith('/api/') && (url.pathname === '/api/events' || url.pathname.includes('/events'));
  if (method !== 'GET' || !isEventsPath) return false;
  try {
    const normalized = normalizeApiUrl(ctx, url);
    if (normalized.pathname !== '/api/events') return false;
    hub.add(res);
    return true;
  } catch (e) {
    if (!isDeskError(e)) throw e;
    sendJson(res, statusFor(e.code), { ok: false, error: e.toJSON() });
    return true;
  }
}

async function handleApiRequest(ctx: ApiContext, req: IncomingMessage, res: ServerResponse, method: string, url: URL): Promise<void> {
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
}

function watchBoard(
  holder: Awaited<ReturnType<typeof createBoardHolder>>,
  hub: ReturnType<typeof createEventHub>,
): ReturnType<typeof watchDesk> | null {
  if (holder.root === null) return null;
  return watchDesk(holder.root, (event) => {
    const reload = event.type === 'board_changed' ? holder.reload() : Promise.resolve();
    void reload
      .then(() => hub.broadcast(event))
      .catch((e: unknown) => process.stderr.write(`desk ui: ошибка обработки события: ${String(e)}\n`));
  });
}

export async function startHttpServer(opts: HttpServerOptions): Promise<RunningHttpServer> {
  const holder = await createBoardHolder(opts.cwd, opts.env ?? process.env);
  // project.yaml читаем один раз при старте (меняется куда реже board.yaml). Ошибка не
  // убивает процесс — запоминается и возвращается project-зависимыми маршрутами при
  // каждом запросе через requireWorkspace, board-only маршруты продолжают работать.
  const { workspace, error: workspaceError } = holder.root === null ? {} : await loadWorkspace(holder.requireRoot(), opts.actor);
  const hub = createEventHub();
  const watcher = watchBoard(holder, hub);
  const ctx: ApiContext = { holder, actor: opts.actor, clock: opts.clock ?? (() => new Date()), workspace, workspaceError };
  let port = opts.port;

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const method = req.method ?? 'GET';
    const denied = checkRequestOrigin(req.headers, method, port);
    if (denied) {
      sendJson(res, 403, { ok: false, error: new DeskError('BAD_REQUEST', denied).toJSON() });
      return;
    }
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
    if (isTestResetRequest(opts, url, method)) {
      await resetTasks(holder.requireRoot());
      sendJson(res, 200, { ok: true, data: null });
      return;
    }
    if (await handleEvents(ctx, hub, method, url, res)) return;
    if (url.pathname.startsWith('/api/')) {
      await handleApiRequest(ctx, req, res, method, url);
      return;
    }
    await serveStatic(res, opts.staticDir, url.pathname);
  };

  const server = createServer((req, res) => {
    handle(req, res).catch((e: unknown) => {
      process.stderr.write(`desk ui: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
      if (!res.headersSent) {
        sendJson(res, 500, {
          ok: false,
          error: {
            code: 'INTERNAL',
            message: 'Внутренняя ошибка desk ui, подробности в терминале',
            field: null,
            guide: null,
            allowed: null,
          },
        });
      } else {
        res.end();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', (e: NodeJS.ErrnoException) =>
      reject(e.code === 'EADDRINUSE' ? new DeskError('BAD_REQUEST', `Порт ${opts.port} занят. Запусти desk ui --port <другой порт>.`) : e),
    );
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
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
