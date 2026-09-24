import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { card, column, openBoard, PROJECT_ROOT, readTask, replaceBoard, restoreBoard, type BoardBackup } from './fixtures';

// Типы полей, которых нет в board.yaml по умолчанию (R6): multi_enum, bool, text — через панель
// задачи, окно создания и окно requires. Схема подменяется на время файла и возвращается в afterAll.
// Окна (TNPopup) — через поле внутри, как в board.spec.ts: корень .tn-popup__block нулевой высоты.

test.describe.configure({ mode: 'serial' });

const EXTRA_FIELDS = `  - id: labels
    type: multi_enum
    values: [ui, api, db]
    guide: Затронутые слои.
  - id: blocked
    type: bool
    guide: Задача ждёт внешнего решения.
  - id: summary
    type: text
    guide: Итог работы.
`;

const DEFAULT_DONE_TRANSITION = '  - from: in_progress\n    to: done\n';

let backup: BoardBackup | undefined;

test.beforeAll(async () => {
  const original = await readFile(join(PROJECT_ROOT, '.desk', 'board.yaml'), 'utf8');
  if (!original.includes(DEFAULT_DONE_TRANSITION)) throw new Error('board.yaml не совпадает с шаблоном desk init');
  const extended = original
    .replace('fields:\n', `fields:\n${EXTRA_FIELDS}`)
    // Переход in_progress → done требует text-поле: окно requires рисует его через тот же FieldInput.
    .replace(DEFAULT_DONE_TRANSITION, `${DEFAULT_DONE_TRANSITION}    requires: [summary]\n`);
  backup = await replaceBoard(extended, (fields) => fields.some((f) => f.id === 'summary'));
});

test.afterAll(async () => {
  if (backup) await restoreBoard(backup);
});

test('панель: multi_enum, bool и text сохраняются в файл; пустой multi_enum очищает поле', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Поля', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Поля' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  const labels = panel.getByRole('group', { name: 'labels' });
  await labels.getByRole('checkbox', { name: 'api' }).check();
  await labels.getByRole('checkbox', { name: 'db' }).check();
  await panel.getByRole('checkbox', { name: 'blocked' }).check();
  // Доступное имя textarea — из <label for>, связанного с ней (раньше у TNTextarea label был без for).
  await panel.getByRole('textbox', { name: 'summary' }).fill('Сделано');

  const patch = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  expect((await patch).postDataJSON()).toEqual({ fields: { labels: ['api', 'db'], blocked: true, summary: 'Сделано' } });
  await expect.poll(() => readTask('T-001')).toContain('summary: Сделано');
  const saved = await readTask('T-001');
  expect(saved).toMatch(/labels:\s*(\[\s*api,\s*db\s*\]|\n\s*- api\n\s*- db)/);
  expect(saved).toContain('blocked: true');

  await labels.getByRole('checkbox', { name: 'api' }).uncheck();
  await labels.getByRole('checkbox', { name: 'db' }).uncheck();
  const clear = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  expect((await clear).postDataJSON()).toEqual({ fields: { labels: null } });
  await expect.poll(() => readTask('T-001')).not.toContain('labels');
});

test('окно создания: multi_enum, bool и text попадают в новую задачу', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Есть', column: 'backlog' }]);
  await page.getByRole('button', { name: 'Новая задача' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новая задача' });
  await dialog.getByLabel('title').fill('С полями');
  await dialog.getByRole('group', { name: 'labels' }).getByRole('checkbox', { name: 'ui' }).check();
  await dialog.getByRole('checkbox', { name: 'blocked' }).check();
  await dialog.getByRole('textbox', { name: 'summary' }).fill('Черновой итог');
  await dialog.getByRole('button', { name: 'Создать' }).click();
  await expect(page).toHaveURL(/task=T-\d+/);
  const id = new URL(page.url()).searchParams.get('task') ?? '';
  await expect(column(page, 'Backlog').getByTestId(`card-${id}`)).toBeVisible();
  const saved = await readTask(id);
  expect(saved).toContain('title: С полями');
  expect(saved).toMatch(/labels:\s*(\[\s*ui\s*\]|\n\s*- ui)/);
  expect(saved).toContain('blocked: true');
  expect(saved).toContain('summary: Черновой итог');
});

test('окно requires: text-поле подписано (<label for>) и записывается при переносе', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Доделать', column: 'in_progress', assignee: 'dev' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Доделать' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Колонка').selectOption('done');
  const dialog = page.getByRole('dialog', { name: 'T-001 → Done' });
  const summary = dialog.getByRole('textbox', { name: 'summary' });
  await expect(summary).toBeFocused();
  const id = await summary.getAttribute('id');
  expect(id).toBeTruthy();
  await expect(dialog.locator(`label[for="${id}"]`)).toHaveText('summary');
  await summary.fill('Готово к релизу');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'Done').getByTestId('card-T-001')).toBeVisible();
  const saved = await readTask('T-001');
  expect(saved).toContain('column: done');
  expect(saved).toContain('summary: Готово к релизу');
});
