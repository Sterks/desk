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
export const HELP = `desk — канбан-доска для агентов\n\nКоманды:\n  desk init [--claude-md]      создать .desk/ и подключить MCP\n  desk mcp                     MCP-сервер по stdio\n  desk ui [--port N] [--open]  веб-доска\n  desk validate                проверить board.yaml и задачи`;
export interface CliIo { cwd: string; env: NodeJS.ProcessEnv; out(line: string): void; err(line: string): void; }
const defaultIo = (): CliIo => ({ cwd: process.cwd(), env: process.env, out: (line) => process.stdout.write(`${line}\n`), err: (line) => process.stderr.write(`${line}\n`) });
export function parseUiArgs(args: string[]): { port: number; open: boolean } { const index = args.indexOf('--port'); const raw = index === -1 ? String(DEFAULT_PORT) : args[index + 1]; const port = Number(raw); if (raw === undefined || !Number.isInteger(port) || port < 1 || port > 65535) throw new DeskError('BAD_REQUEST', `--port: ожидается целое число 1–65535, получено ${raw ?? 'ничего'}`); const unknown = args.filter((arg, i) => arg !== '--open' && arg !== '--port' && !(index !== -1 && i === index + 1)); if (unknown.length) throw new DeskError('BAD_REQUEST', `Неизвестные аргументы: ${unknown.join(' ')}`); return { port, open: args.includes('--open') }; }
function openBrowser(url: string, io: CliIo): void { const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'; const child = spawn(command, [url], { detached: true, stdio: 'ignore' }); child.on('error', (e) => io.err(`desk ui: не удалось открыть браузер: ${e.message}`)); child.unref(); }
async function runUi(args: string[], io: CliIo): Promise<number> { const { port, open } = parseUiArgs(args); const root = findRoot(io.cwd, io.env); const actor = toActorName(await gitUserName(root)); const server = await startHttpServer({ cwd: root, env: io.env, port, staticDir: UI_DIR, actor }); io.out(`desk ui: ${server.url}  (actor: ${actor}, Ctrl+C — выход)`); if (open) openBrowser(server.url, io); const stop = () => { void server.close().then(() => process.exit(0)); }; process.once('SIGINT', stop); process.once('SIGTERM', stop); return 0; }
export async function runCli(argv: string[], io: CliIo = defaultIo()): Promise<number> { const [command, ...rest] = argv; try { switch (command) { case 'init': (await initProject(io.cwd, { claudeMd: rest.includes('--claude-md') })).forEach(io.out); return 0; case 'validate': { const result = await validateProject(findRoot(io.cwd, io.env)); result.lines.forEach((line) => result.ok ? io.out(line) : io.err(line)); return result.ok ? 0 : 1; } case 'mcp': await runStdio(io.cwd, io.env); return 0; case 'ui': return runUi(rest, io); case undefined: case 'help': case '--help': io.out(HELP); return 0; default: io.err(`Неизвестная команда: ${command}\n\n${HELP}`); return 1; } } catch (e) { if (isDeskError(e)) { io.err(e.message); return 1; } throw e; } }
