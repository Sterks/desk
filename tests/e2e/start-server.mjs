import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Порт совпадает с PORT в playwright.config.ts и E2E_PORT в fixtures.ts.
const PORT = 4799;
const root = fileURLToPath(new URL('./.tmp-project/', import.meta.url));
const dist = new URL('../../dist/', import.meta.url);
const cli = fileURLToPath(new URL('cli/index.js', dist));
const staticDir = fileURLToPath(new URL('ui/', dist));
// Без глобального git-конфига `desk init` детерминирован.
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };

rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });

const init = spawnSync(process.execPath, [cli, 'init'], { cwd: root, stdio: 'inherit', env });
if (init.status !== 0) process.exit(init.status ?? 1);

// Сервер поднимается in-process: testReset включает POST /api/test/reset только через явную
// опцию startHttpServer (Fix Round A убрал env-переменную DESK_E2E). fixtures.ts сбрасывает
// задачи этим маршрутом перед каждым тестом.
const { startHttpServer } = await import(pathToFileURL(fileURLToPath(new URL('http/server.js', dist))).href);
const server = await startHttpServer({ cwd: root, env, port: PORT, staticDir, actor: 'human', testReset: true });
await server.ready;
process.stdout.write(`desk e2e: ${server.url}\n`);

const stop = () => {
  server.close().then(
    () => process.exit(0),
    (e) => {
      process.stderr.write(`desk e2e: ошибка остановки сервера: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exit(1);
    },
  );
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
