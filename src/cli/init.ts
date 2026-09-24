import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DeskError } from '../core/errors.js';
import { projectTemplate } from '../core/project.js';
import { boardPath, deskDir, tasksDir } from '../core/paths.js';
import { BOARD_TEMPLATE, CLAUDE_MD_MARKER, CLAUDE_MD_SNIPPET, DESK_MCP_SERVER } from './templates.js';

export interface InitOptions {
  claudeMd: boolean;
}

type McpConfig = Record<string, unknown> & { mcpServers?: Record<string, unknown> };

async function optional(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

function hasInvalidMcpServers(value: Record<string, unknown>): boolean {
  const servers = value.mcpServers;
  return servers !== undefined && (typeof servers !== 'object' || servers === null || Array.isArray(servers));
}

async function mcpConfig(path: string): Promise<McpConfig> {
  const text = await optional(path);
  if (text === null) return {};
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== 'object' || Array.isArray(value) || hasInvalidMcpServers(value as Record<string, unknown>)) {
      throw new Error();
    }
    return value as McpConfig;
  } catch {
    throw new DeskError('BAD_REQUEST', `${path} — не JSON или неверная структура. Исправь файл и повтори desk init.`);
  }
}

export const GITIGNORE_LINES = ['.desk/.lock', '.desk/.agent-runs.json', '.desk/**/*.tmp'] as const;

/** Дописывает в .gitignore недостающие служебные строки desk; возвращает добавленные. */
async function updateGitignore(root: string): Promise<string[]> {
  const path = join(root, '.gitignore');
  const text = (await optional(path)) ?? '';
  const present = new Set(text.split(/\r?\n/).map((line) => line.trim()));
  const missing = GITIGNORE_LINES.filter((line) => !present.has(line));
  if (missing.length === 0) return [];
  const separator = text && !text.endsWith('\n') ? '\n' : '';
  await writeFile(path, `${text}${separator}${missing.join('\n')}\n`);
  return missing;
}

export async function initProject(root: string, opts: InitOptions): Promise<string[]> {
  if (existsSync(deskDir(root))) throw new DeskError('BAD_REQUEST', `${deskDir(root)} уже существует. desk init ничего не изменил.`);
  const mcpPath = join(root, '.mcp.json');
  const config = await mcpConfig(mcpPath);
  const claudePath = join(root, 'CLAUDE.md');
  const claude = opts.claudeMd ? ((await optional(claudePath)) ?? '') : null;
  await mkdir(tasksDir(root), { recursive: true });
  await writeFile(boardPath(root), BOARD_TEMPLATE);
  await writeFile(join(root, '.desk', 'project.yaml'), projectTemplate(root));
  await writeFile(join(tasksDir(root), '.gitkeep'), '');
  const ignored = await updateGitignore(root);
  await writeFile(mcpPath, `${JSON.stringify({ ...config, mcpServers: { ...(config.mcpServers ?? {}), desk: DESK_MCP_SERVER } }, null, 2)}\n`);
  const changed = claude !== null && !claude.includes(CLAUDE_MD_MARKER);
  if (changed) {
    const separator = claude && !claude.endsWith('\n\n') ? (claude.endsWith('\n') ? '\n' : '\n\n') : '';
    await writeFile(claudePath, `${claude}${separator}${CLAUDE_MD_SNIPPET}`);
  }
  return [
    'Создан .desk/project.yaml — идентификатор tenant/project.',
    'Создан .desk/board.yaml — опиши колонки, поля и guide для агентов.',
    'Создан .desk/tasks/ — здесь будут файлы задач.',
    ignored.length ? `В .gitignore добавлено: ${ignored.join(', ')}` : '.gitignore уже содержит служебные файлы desk',
    'В .mcp.json добавлен сервер desk. Перезапусти Claude Code, чтобы он подключился.',
    ...(changed ? ['В CLAUDE.md добавлено правило работы с доской.'] : []),
    'Доска в браузере: desk ui --open',
  ];
}
