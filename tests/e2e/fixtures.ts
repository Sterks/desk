import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';

export const PROJECT_ROOT = fileURLToPath(new URL('./.tmp-project/', import.meta.url));
const TASKS_DIR = join(PROJECT_ROOT, '.desk', 'tasks');

export interface SeedTask {
  id: string;
  title: string;
  column: string;
  priority?: string;
  assignee?: string;
  agent?: string;
  area?: string;
  estimate?: number;
  description?: string;
  /** Поля, которых нет в board.yaml (например, поле удалили из схемы). */
  extraFields?: Record<string, string>;
  createdAt?: string;
}

export function taskMarkdown(task: SeedTask): string {
  const at = task.createdAt ?? '2026-09-24T10:00:00Z';
  return [
    '---',
    `id: ${task.id}`,
    `title: ${task.title}`,
    `column: ${task.column}`,
    ...(task.assignee ? [`assignee: ${task.assignee}`] : []),
    ...(task.agent ? [`agent: ${task.agent}`] : []),
    'created_by: seed',
    `created_at: ${at}`,
    `updated_at: ${at}`,
    `priority: ${task.priority ?? 'p2'}`,
    ...(task.area ? [`area: ${task.area}`] : []),
    ...(task.estimate === undefined ? [] : [`estimate: ${task.estimate}`]),
    ...Object.entries(task.extraFields ?? {}).map(([key, value]) => `${key}: ${value}`),
    'history:',
    `  - { at: ${at}, by: seed, from: null, to: ${task.column} }`,
    '---',
    ...(task.description ? ['', task.description] : []),
    '',
  ].join('\n');
}

/** Совпадает с PORT в playwright.config.ts и tests/e2e/start-server.mjs. */
export const E2E_PORT = 4799;
const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`;

/** POST /api/test/reset: маршрут есть только потому, что start-server.mjs передал testReset: true. */
async function resetTasks(): Promise<void> {
  const res = await fetch(`${E2E_ORIGIN}/api/test/reset`, { method: 'POST', headers: { origin: E2E_ORIGIN } });
  if (!res.ok) throw new Error(`POST /api/test/reset ответил ${res.status}: ${await res.text()}`);
}

export async function seed(tasks: SeedTask[]): Promise<void> {
  await mkdir(TASKS_DIR, { recursive: true });
  await resetTasks();
  await Promise.all(tasks.map((task) => writeFile(join(TASKS_DIR, `${task.id}.md`), taskMarkdown(task))));
}

export const writeTask = (task: SeedTask): Promise<void> => writeFile(join(TASKS_DIR, `${task.id}.md`), taskMarkdown(task));
/** Файл задачи с произвольным содержимым (битый, дубликат ID с другим именем файла). */
export const writeRawTask = (fileId: string, content: string): Promise<void> =>
  writeFile(join(TASKS_DIR, `${fileId}.md`), content);
export const readTask = (id: string): Promise<string> => readFile(join(TASKS_DIR, `${id}.md`), 'utf8');

export const column = (page: Page, title: string): Locator => page.getByRole('region', { name: title, exact: true });
/** Стек toast (role=status). Ищем по имени, чтобы не зависеть от других live-region на странице. */
export const toasts = (page: Page): Locator => page.getByRole('status', { name: 'Уведомления' });
export const card = (page: Page, id: string): Locator => page.locator('.board').getByTestId(`card-${id}`);

export async function openBoard(page: Page, tasks: SeedTask[]): Promise<void> {
  await seed(tasks);
  await page.goto('/');
  for (const task of tasks) await expect(card(page, task.id)).toBeVisible();
}

/**
 * Перетаскивание мышью по шагам. SortableJS (vue-draggable-plus, без forceFallback) работает на
 * нативном HTML5 drag-and-drop: Chromium/Firefox/WebKit в Playwright начинают dragstart после
 * небольшого сдвига с зажатой кнопкой — первый короткий move (5 шагов, 10px) его запускает, второй
 * (20 шагов) даёт dragover по пути до цели. Порога активации, как у dnd-kit (5px), нет, но эти шаги
 * проверены на всех трёх браузерах (Task 8 и Task 9) и оставлены как есть.
 */
/*
 * Счётчик POST …/move в самой странице, без таймеров: fetch вызывается синхронно из обработчика броска
 * (Board.endDrag → App.handleMove → api.move), раньше, чем Vue перерисует data-drop в 'idle'. Поэтому
 * «дождаться idle, потом прочитать счётчик» — детерминированная проверка «запроса не было»: в отличие
 * от `page.on('request', …)`, чья доставка событий асинхронна и могла бы дать ложный проход, если
 * проверку запустить раньше, чем событие дойдёт до теста. Ставится до openBoard (addInitScript
 * действует со следующей навигации).
 */
export async function trackMoves(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as typeof window & { __moves?: number };
    const original = w.fetch.bind(w);
    w.__moves = 0;
    w.fetch = (input, init) => {
      if (init?.method === 'POST' && String(input).endsWith('/move')) w.__moves = (w.__moves ?? 0) + 1;
      return original(input, init);
    };
  });
}

export async function movesAfterDrag(page: Page): Promise<number> {
  await expect(page.locator('.board [data-drop]:not([data-drop="idle"])')).toHaveCount(0);
  return page.evaluate(() => (window as typeof window & { __moves?: number }).__moves ?? -1);
}

export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Нет boundingBox у источника или цели перетаскивания');
  const startX = from.x + from.width / 2;
  const startY = from.y + 12;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 10, startY + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 20 });
  await page.mouse.up();
}

const BOARD_FILE = join(PROJECT_ROOT, '.desk', 'board.yaml');

type ServerField = { id: string; values?: string[] | null };
interface BoardFieldsResponse {
  ok: boolean;
  data?: { fields?: ServerField[] };
}

/** Поля доски, как их сейчас отдаёт сервер (GET /api/board). */
async function serverFields(): Promise<ServerField[]> {
  const res = await fetch(`${E2E_ORIGIN}/api/board`, { headers: { origin: E2E_ORIGIN } });
  const body = (await res.json()) as BoardFieldsResponse;
  return body.data?.fields ?? [];
}

export interface BoardBackup {
  content: string;
  fields: string;
}

/**
 * Заменить board.yaml тестового проекта и дождаться, пока сервер перечитает его (watch.ts →
 * board_changed): `isLoaded` проверяет поля, которые вернул GET /api/board. Прежнее содержимое нужно
 * вернуть через restoreBoard (в afterEach/afterAll), иначе следующий тест увидит чужую схему.
 */
export async function replaceBoard(content: string, isLoaded: (fields: ServerField[]) => boolean): Promise<BoardBackup> {
  const backup = { content: await readFile(BOARD_FILE, 'utf8'), fields: JSON.stringify(await serverFields()) };
  await writeFile(BOARD_FILE, content);
  await expect.poll(async () => isLoaded(await serverFields()), { timeout: 10_000 }).toBe(true);
  return backup;
}

export async function restoreBoard(backup: BoardBackup): Promise<void> {
  await writeFile(BOARD_FILE, backup.content);
  await expect.poll(async () => JSON.stringify(await serverFields()), { timeout: 10_000 }).toBe(backup.fields);
}
