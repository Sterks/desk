import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

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
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('UI не собран. Выполни npm run build в репозитории desk.');
    return;
  }

  const html = extname(file) === '.html';
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'cache-control': html ? 'no-store' : 'public, max-age=31536000, immutable',
    ...(html ? { 'content-security-policy': CSP } : {}),
  });
  createReadStream(file).pipe(res);
}
