import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// `desk init` через собранный CLI — обычный публичный путь, ничего тестового.
const root = mkdtempSync(join(tmpdir(), 'desk-e2e-'));
const cli = join(process.cwd(), 'dist', 'cli', 'index.js');
execFileSync(process.execPath, [cli, 'init'], { cwd: root, stdio: 'ignore' });

// Сервер поднимаем in-process и передаём testReset: true напрямую в опциях —
// POST /api/test/reset существует только для этого явного вызова, не через env-переменную
// (см. fix-a-server-brief.md A3: DESK_E2E больше не читается в src/http/server.ts).
const { startHttpServer } = await import(pathToFileURL(join(process.cwd(), 'dist', 'http', 'server.js')).href);
const staticDir = join(process.cwd(), 'dist', 'ui');
const server = await startHttpServer({ cwd: root, port: 4799, staticDir, actor: 'e2e-agent', testReset: true });
await server.ready;
process.stdout.write(`desk e2e server: ${server.url}\n`);

const stop = () => {
  void server.close().then(() => process.exit(0));
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
