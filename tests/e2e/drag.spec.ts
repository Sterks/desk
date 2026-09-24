import { expect, test, type Locator, type Page } from '@playwright/test';
import { card, column, dragTo, openBoard, readTask, toasts, writeTask } from './fixtures';

// Механизм drag-and-drop на vue-draggable-plus (Task 8): SortableJS-плейсхолдер не пускается в
// запрещённую колонку, цель — колонка под указателем при отпускании, отменённый жест ничего не
// переносит, а карточка переезжает только после ответа сервера.
//
// Окна requires ищем по полю внутри: role="dialog" у TNPopup сейчас висит на обёртке нулевой высоты,
// и Playwright считает сам диалог скрытым (известная проблема Task 6, чинится в Task 9).

test.describe.configure({ mode: 'serial' });

function watchMoves(page: Page): string[] {
  const moves: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/move')) moves.push(r.postData() ?? '');
  });
  return moves;
}

/** Начать перетаскивание карточки и довести указатель до точки, не отпуская. */
async function grab(page: Page, source: Locator): Promise<void> {
  const box = await source.boundingBox();
  if (!box) throw new Error('Нет boundingBox у карточки');
  await page.mouse.move(box.x + box.width / 2, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 10, box.y + 22, { steps: 5 });
}

async function hover(page: Page, target: Locator, dy = 80): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('Нет boundingBox у цели');
  await page.mouse.move(box.x + box.width / 2, box.y + dy, { steps: 20 });
}

/** Сколько узлов с карточкой на всей доске: после любого жеста ровно один. */
const nodes = (page: Page, id: string): Locator => page.locator(`.board [data-task-id="${id}"]`);

test('разрешённый перенос без недостающих полей: карточка переезжает после записи', async ({ page }) => {
  await openBoard(page, [{ id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' }]);
  const moves = watchMoves(page);
  await dragTo(page, card(page, 'T-004'), column(page, 'In progress'));
  await expect(column(page, 'In progress').getByTestId('card-T-004')).toBeVisible();
  await expect.poll(() => readTask('T-004')).toContain('column: in_progress');
  await expect(nodes(page, 'T-004')).toHaveCount(1);
  expect(moves).toHaveLength(1);
});

test('бросок на заголовок разрешённой колонки тоже переносит', async ({ page }) => {
  await openBoard(page, [{ id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' }]);
  await grab(page, card(page, 'T-004'));
  await hover(page, column(page, 'In progress').locator('.column-title'), 5);
  await page.mouse.up();
  await expect(column(page, 'In progress').getByTestId('card-T-004')).toBeVisible();
});

test('окно requires: пока открыто, карточка в исходной колонке; первое поле в фокусе, ввод не теряется', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Нужен исполнитель', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  const field = page.getByRole('dialog', { name: 'T-001 → In progress' }).getByLabel('assignee');
  await expect(field).toBeVisible();
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toHaveCount(0);
  await expect(field).toBeFocused();
  // Печатаем сразу, без fill(): задержки фокуса после броска у SortableJS нет, символы не теряются.
  await page.keyboard.type('e2e-agent');
  await expect(field).toHaveValue('e2e-agent');
  await page.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect.poll(() => readTask('T-001')).toContain('assignee: e2e-agent');
  await expect(nodes(page, 'T-001')).toHaveCount(1);
});

test('отмена окна requires: карточка на месте, запроса и записи нет, повторный перенос работает', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Нужен исполнитель', column: 'backlog' }]);
  const moves = watchMoves(page);
  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  const field = page.getByRole('dialog', { name: 'T-001 → In progress' }).getByLabel('assignee');
  await expect(field).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(field).toHaveCount(0);
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toHaveCount(0);
  await expect(nodes(page, 'T-001')).toHaveCount(1);
  expect(moves).toHaveLength(0);
  expect(await readTask('T-001')).toContain('column: backlog');

  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  await field.fill('again');
  await page.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
});

test('запрещённый переход через разрешённую колонку: плейсхолдер не входит в Done, переноса нет', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'X', column: 'backlog', assignee: 'a' },
    { id: 'T-002', title: 'Y', column: 'in_progress', assignee: 'b' },
  ]);
  const moves = watchMoves(page);
  await grab(page, card(page, 'T-001'));
  // Над карточкой в In progress плейсхолдер SortableJS входит в разрешённый список…
  const other = await card(page, 'T-002').boundingBox();
  if (!other) throw new Error('Нет boundingBox у T-002');
  await page.mouse.move(other.x + other.width / 2, other.y + other.height / 2 + 5, { steps: 20 });
  await expect(column(page, 'In progress').locator('.card-ghost')).toHaveCount(1);
  await expect(column(page, 'In progress')).toHaveAttribute('data-drop', 'over');
  // …а в запрещённый Done — нет, и отпускание над Done не переносит в In progress.
  await hover(page, column(page, 'Done'));
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'blocked');
  await expect(column(page, 'Done').locator('[data-task-id]')).toHaveCount(0);
  await page.mouse.up();
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'idle');
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(nodes(page, 'T-001')).toHaveCount(1);
  await expect(page.locator('.board [data-task-id]')).toHaveCount(2);
  await page.waitForTimeout(300);
  expect(moves).toHaveLength(0);
  await expect(toasts(page).locator('.toast')).toHaveCount(0);
});

test('Escape над разрешённой колонкой отменяет перенос', async ({ page }) => {
  await openBoard(page, [{ id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' }]);
  const moves = watchMoves(page);
  await grab(page, card(page, 'T-004'));
  await hover(page, column(page, 'In progress'));
  await expect(column(page, 'In progress')).toHaveAttribute('data-drop', 'over');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(column(page, 'In progress')).toHaveAttribute('data-drop', 'idle');
  await page.waitForTimeout(300);
  await expect(column(page, 'Backlog').getByTestId('card-T-004')).toBeVisible();
  expect(moves).toHaveLength(0);
  expect(await readTask('T-004')).toContain('column: backlog');
});

test('отказ сервера (WIP-лимит): toast, карточка в исходной колонке', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'A', column: 'in_progress', assignee: 'a' },
    { id: 'T-002', title: 'B', column: 'in_progress', assignee: 'b' },
    { id: 'T-003', title: 'C', column: 'in_progress', assignee: 'c' },
    { id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' },
  ]);
  await dragTo(page, card(page, 'T-004'), column(page, 'In progress'));
  await expect(toasts(page)).toContainText('3 из 3');
  await expect(column(page, 'Backlog').getByTestId('card-T-004')).toBeVisible();
  await expect(nodes(page, 'T-004')).toHaveCount(1);
});

test('отпускание вне колонок ничего не переносит', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'X', column: 'backlog', assignee: 'a' }]);
  const moves = watchMoves(page);
  await grab(page, card(page, 'T-001'));
  await page.mouse.move(640, 5, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  expect(moves).toHaveLength(0);
});

test('запись агента посреди жеста не ломает DOM: обновления применяются после броска', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'X', column: 'backlog', assignee: 'a' },
    { id: 'T-002', title: 'Y', column: 'in_progress', assignee: 'b' },
  ]);
  await grab(page, card(page, 'T-001'));
  await hover(page, card(page, 'T-002'), 20);
  await writeTask({ id: 'T-009', title: 'Агент', column: 'backlog' });
  await writeTask({ id: 'T-002', title: 'Y2', column: 'in_progress', assignee: 'b' });
  // Доска получила обновление (счётчик), но список Backlog во время жеста заморожен.
  await expect(column(page, 'Backlog').locator('.column-count')).toHaveText('2');
  await expect(card(page, 'T-009')).toHaveCount(0);
  await hover(page, card(page, 'T-002'), 24);
  await page.mouse.up();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'Backlog').getByTestId('card-T-009')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-002')).toContainText('Y2');
  await expect(page.locator('.board [data-task-id]')).toHaveCount(3);
});

test('панель: «Колонка» предлагает те же переходы, что и доска', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Из бэклога', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Из бэклога' }).click();
  const select = page.getByRole('dialog', { name: 'T-001' }).getByLabel('Колонка');
  await expect(select.locator('option')).toHaveText(['Backlog', 'In progress']);
});
