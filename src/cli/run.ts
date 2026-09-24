import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DeskError, isDeskError } from '../core/errors.js';
import type { Clock } from '../core/types.js';
import { findRoot } from '../core/paths.js';
import { startHttpServer } from '../http/server.js';
import { runStdio } from '../mcp/server.js';
import { gitUserName, toActorName } from './git.js';
import { runHook } from './hook-command.js';
import { installHooks } from './hooks-install.js';
import { initProject } from './init.js';
import { validateProject } from './validate-project.js';
export const DEFAULT_PORT = 4717;
const UI_DIR = fileURLToPath(new URL('../ui', import.meta.url));
export const HELP = `desk — канбан-доска для агентов

Команды:
  desk init [--claude-md] [--hooks]  создать .desk/ и подключить MCP (и хуки Claude Code)
  desk mcp                           MCP-сервер по stdio
  desk ui [--port N] [--open]        веб-доска
  desk validate                      проверить board.yaml и задачи
  desk hooks install                 добавить хуки сабагентов в .claude/settings.json
  desk hook agent-start|agent-attach|agent-end
                                     обработчик хука Claude Code (читает JSON из stdin)`;
export interface CliIo { cwd: string; env: NodeJS.ProcessEnv; out(line: string): void; err(line: string): void; readStdin(): Promise<string>; clock?: Clock; }
/** Читает поток до конца; у терминала (TTY) сразу возвращает '' — хук без stdin не должен висеть. */
export async function readStream(stream: NodeJS.ReadableStream & { isTTY?: boolean }): Promise<string> {
  if (stream.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  return Buffer.concat(chunks).toString('utf8');
}
const defaultIo = (): CliIo => ({ cwd: process.cwd(), env: process.env, out: (line) => process.stdout.write(`${line}\n`), err: (line) => process.stderr.write(`${line}\n`), readStdin: () => readStream(process.stdin) });
export function parseUiArgs(args: string[]): { port: number; open: boolean } { const index = args.indexOf('--port'); const raw = index === -1 ? String(DEFAULT_PORT) : args[index + 1]; const port = Number(raw); if (raw === undefined || !Number.isInteger(port) || port < 1 || port > 65535) throw new DeskError('BAD_REQUEST', `--port: ожидается целое число 1–65535, получено ${raw ?? 'ничего'}`); const unknown = args.filter((arg, i) => arg !== '--open' && arg !== '--port' && !(index !== -1 && i === index + 1)); if (unknown.length) throw new DeskError('BAD_REQUEST', `Неизвестные аргументы: ${unknown.join(' ')}`); return { port, open: args.includes('--open') }; }
function openBrowser(url: string, io: CliIo): void { const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'; const child = spawn(command, [url], { detached: true, stdio: 'ignore' }); child.on('error', (e) => io.err(`desk ui: не удалось открыть браузер: ${e.message}`)); child.unref(); }
async function runUi(args: string[], io: CliIo): Promise<number> { const { port, open } = parseUiArgs(args); const root = findRoot(io.cwd, io.env); const actor = toActorName(await gitUserName(root)); const server = await startHttpServer({ cwd: root, env: io.env, port, staticDir: UI_DIR, actor }); io.out(`desk ui: ${server.url}  (actor: ${actor}, Ctrl+C — выход)`); if (open) openBrowser(server.url, io); const stop = () => { void server.close().then(() => process.exit(0)); }; process.once('SIGINT', stop); process.once('SIGTERM', stop); return 0; }
async function runInit(args: string[], io: CliIo): Promise<number> {
  (await initProject(io.cwd, { claudeMd: args.includes('--claude-md') })).forEach(io.out);
  if (!args.includes('--hooks')) return 0;
  try {
    (await installHooks(io.cwd)).forEach(io.out);
  } catch (e) {
    if (!isDeskError(e)) throw e;
    throw new DeskError('BAD_REQUEST', `.desk создан, но хуки не подключены: ${e.message.replace(/ Исправь файл и повтори desk hooks install\.$/, '')} Исправь файл и запусти desk hooks install.`);
  }
  return 0;
}

async function runHooks(args: string[], io: CliIo): Promise<number> {
  if (args[0] !== 'install' || args.length > 1) throw new DeskError('BAD_REQUEST', `Использование: desk hooks install (получено: ${args.join(' ') || 'ничего'})`);
  (await installHooks(findRoot(io.cwd, io.env))).forEach(io.out);
  return 0;
}

async function dispatch(command: string | undefined, rest: string[], io: CliIo): Promise<number> {
  switch (command) {
    case 'init': return await runInit(rest, io);
    case 'validate': {
      const result = await validateProject(findRoot(io.cwd, io.env));
      result.lines.forEach((line) => (result.ok ? io.out(line) : io.err(line)));
      return result.ok ? 0 : 1;
    }
    case 'mcp': await runStdio(io.cwd, io.env); return 0;
    case 'ui': return await runUi(rest, io);
    case 'hook': return await runHook(rest[0], io);
    case 'hooks': return await runHooks(rest, io);
    case undefined: case 'help': case '--help': io.out(HELP); return 0;
    default: io.err(`Неизвестная команда: ${command}\n\n${HELP}`); return 1;
  }
}

export async function runCli(argv: string[], io: CliIo = defaultIo()): Promise<number> {
  const [command, ...rest] = argv;
  try {
    return await dispatch(command, rest, io);
  } catch (e) {
    if (isDeskError(e)) { io.err(e.message); return 1; }
    throw e;
  }
}
