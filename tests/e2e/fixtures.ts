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
export const readTask = (id: string): Promise<string> => readFile(join(TASKS_DIR, `${id}.md`), 'utf8');

export const column = (page: Page, title: string): Locator => page.getByRole('region', { name: title, exact: true });
/** Стек toast; у live-region dnd-kit тоже role=status, поэтому ищем по имени. */
export const toasts = (page: Page): Locator => page.getByRole('status', { name: 'Уведомления' });
export const card = (page: Page, id: string): Locator => page.locator('.board').getByTestId(`card-${id}`);

export async function openBoard(page: Page, tasks: SeedTask[]): Promise<void> {
  await seed(tasks);
  await page.goto('/');
  for (const task of tasks) await expect(card(page, task.id)).toBeVisible();
}

/** Перетаскивание мышью по шагам: dnd-kit стартует после 5px движения. */
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
