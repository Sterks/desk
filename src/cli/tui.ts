import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeskError } from '../core/errors.js';
import { findRoot } from '../core/paths.js';
import { startHttpServer } from '../http/server.js';
import { gitUserName, toActorName } from './git.js';
import type { CliIo } from './run.js';

const BINARY_NAME = process.platform === 'win32' ? 'desk-tui.exe' : 'desk-tui';
const BUNDLED_BINARY = fileURLToPath(new URL(`../../tui/bin/${BINARY_NAME}`, import.meta.url));
const UI_DIR = fileURLToPath(new URL('../ui', import.meta.url));
/** Порт 0: система выдаёт свободный, `desk tui` не конфликтует с запущенным `desk ui`. */
const EPHEMERAL_PORT = 0;

export interface TuiDeps {
  resolve(env: NodeJS.ProcessEnv): string | null;
  run(binary: string, args: string[], env: NodeJS.ProcessEnv): Promise<number>;
}

export function parseTuiArgs(args: string[]): void {
  if (args.length) throw new DeskError('BAD_REQUEST', `Неизвестные аргументы: ${args.join(' ')}`);
}

/** Порядок поиска: DESK_TUI_BIN → собранный tui/bin → PATH. */
export function resolveTuiBinary(
  env: NodeJS.ProcessEnv,
  exists: (path: string) => boolean = existsSync,
  bundled: string = BUNDLED_BINARY,
): string | null {
  const candidates = [
    env.DESK_TUI_BIN,
    bundled,
    ...(env.PATH ?? '')
      .split(delimiter)
      .filter(Boolean)
      .map((dir) => join(dir, BINARY_NAME)),
  ];
  return candidates.find((path): path is string => Boolean(path) && exists(path as string)) ?? null;
}

function runBinary(binary: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: 'inherit', env });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

const defaultDeps: TuiDeps = { resolve: (env) => resolveTuiBinary(env), run: runBinary };

export async function runTui(args: string[], io: CliIo, deps: TuiDeps = defaultDeps): Promise<number> {
  parseTuiArgs(args);
  const binary = deps.resolve(io.env);
  if (!binary) {
    throw new DeskError(
      'BAD_REQUEST',
      'Не найден desk-tui. Собери его: npm run build:tui (нужен Go), либо укажи путь в DESK_TUI_BIN, либо положи desk-tui в PATH.',
    );
  }
  const root = findRoot(io.cwd, io.env);
  const actor = toActorName(await gitUserName(root));
  const server = await startHttpServer({ cwd: root, env: io.env, port: EPHEMERAL_PORT, staticDir: UI_DIR, actor });
  try {
    return await deps.run(binary, ['--api', server.url], { ...io.env, DESK_API: server.url });
  } finally {
    await server.close();
  }
}
