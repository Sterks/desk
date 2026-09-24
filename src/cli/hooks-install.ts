import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DeskError } from '../core/errors.js';
import { isObject } from './agent-hooks.js';
import { DESK_HOOKS, type HookEntry } from './templates.js';

type Settings = Record<string, unknown>;
type HookMap = Record<string, unknown[]>;

export const settingsPath = (root: string): string => join(root, '.claude', 'settings.json');

async function readSettings(path: string): Promise<Settings> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw e;
  }
  const invalid = new DeskError('BAD_REQUEST', `${path} — не JSON или неверная структура hooks. Исправь файл и повтори desk hooks install.`);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw invalid;
  }
  if (!isObject(value)) throw invalid;
  const hooks = value.hooks;
  if (hooks !== undefined && (!isObject(hooks) || Object.values(hooks).some((entries) => !Array.isArray(entries)))) throw invalid;
  return value;
}

const commandsOf = (entries: readonly unknown[]): string[] =>
  entries.flatMap((entry) =>
    isObject(entry) && Array.isArray(entry.hooks)
      ? entry.hooks.flatMap((hook) => (isObject(hook) && typeof hook.command === 'string' ? [hook.command] : []))
      : [],
  );

const commandOf = (entry: HookEntry): string => entry.hooks[0]?.command ?? '';

/** Добавляет хуки desk в `<root>/.claude/settings.json`, сохраняя остальные ключи и хуки. Повторный запуск ничего не дублирует. */
export async function installHooks(root: string): Promise<string[]> {
  const path = settingsPath(root);
  const settings = await readSettings(path);
  const hooks = (settings.hooks ?? {}) as HookMap;
  const missing = DESK_HOOKS.filter(({ event, entry }) => !commandsOf(hooks[event] ?? []).includes(commandOf(entry)));
  const lines = DESK_HOOKS.map(({ event, entry }) => {
    const verb = missing.some((m) => m.event === event) ? 'добавлен хук' : 'хук уже есть:';
    return `.claude/settings.json: ${verb} ${event} → ${commandOf(entry)}`;
  });
  if (missing.length === 0) return lines;
  const nextHooks = missing.reduce<HookMap>((acc, { event, entry }) => ({ ...acc, [event]: [...(acc[event] ?? []), entry] }), hooks);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ ...settings, hooks: nextHooks }, null, 2)}\n`);
  return [...lines, 'Перезапусти Claude Code, чтобы он подхватил хуки.'];
}
