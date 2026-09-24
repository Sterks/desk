import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { card, column, dragTo, openBoard, readTask, seed, toasts, writeTask } from './fixtures';

test.describe.configure({ mode: 'serial' });

test('доска показывает колонки из board.yaml и карточки в них', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Первая', column: 'backlog', priority: 'p0' },
    { id: 'T-002', title: 'В работе', column: 'in_progress', assignee: 'backend-agent' },
  ]);
  for (const title of ['Backlog', 'In progress', 'Review', 'Done']) await expect(column(page, title)).toBeVisible();
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-002')).toContainText('backend-agent');
  await expect(column(page, 'In progress')).toContainText('1/3');
});

test('перенос без assignee открывает окно requires и записывает поле в файл', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Нужен исполнитель', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  const dialog = page.getByRole('dialog', { name: 'T-001 → In progress' });
  await expect(dialog).toBeVisible();
  // Окно само фокусирует первое поле (после того, как dnd-kit снимет защиту выделения) — ждём фокус.
  // Только недостающее поле перехода и его guide.
  await expect(dialog.locator('.field-row')).toHaveCount(1);
  await expect(dialog).toContainText('Имя агента или человека, который выполняет задачу.');
  await expect(dialog.getByLabel('assignee')).toBeFocused();
  await dialog.getByLabel('assignee').fill('e2e-agent');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect.poll(() => readTask('T-001')).toContain('assignee: e2e-agent');
});

test('запрещённый переход: карточка остаётся, toast объясняет причину', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Сразу в Done нельзя', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'Done'));
  await expect(toasts(page)).toContainText('запрещён');
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
});

test('WIP-лимит: четвёртая задача не попадает в In progress', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'A', column: 'in_progress', assignee: 'a' },
    { id: 'T-002', title: 'B', column: 'in_progress', assignee: 'b' },
    { id: 'T-003', title: 'C', column: 'in_progress', assignee: 'c' },
    { id: 'T-004', title: 'D', column: 'backlog', assignee: 'd' },
  ]);
  await dragTo(page, card(page, 'T-004'), column(page, 'In progress'));
  await expect(toasts(page)).toContainText('3 из 3');
  await expect(column(page, 'Backlog').getByTestId('card-T-004')).toBeVisible();
});

test('задача, которую агент записал в файл, появляется без перезагрузки', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Есть', column: 'backlog' }]);
  await writeTask({ id: 'T-050', title: 'Создал агент', column: 'backlog', assignee: 'planner' });
  await expect(card(page, 'T-050')).toBeVisible();
});

test('поиск фильтрует карточки и переживает перезагрузку через URL', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Rate limit на логин', column: 'backlog' },
    { id: 'T-002', title: 'Кнопка экспорта', column: 'backlog' },
  ]);
  await page.getByRole('searchbox', { name: 'Поиск по ID и названию' }).fill('логин');
  await expect(card(page, 'T-002')).toBeHidden();
  await expect(page).toHaveURL(/q=/);
  await page.reload();
  await expect(card(page, 'T-001')).toBeVisible();
  await expect(card(page, 'T-002')).toBeHidden();
  await expect(page.getByRole('searchbox', { name: 'Поиск по ID и названию' })).toHaveValue('логин');
});

test('панель: правка названия сохраняется в файл', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Старое название', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Старое название' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Название').fill('Новое название');
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  await expect.poll(() => readTask('T-001')).toContain('title: Новое название');
  await page.keyboard.press('Escape');
  await expect(card(page, 'T-001')).toContainText('Новое название');
});

test('клавиатура: Enter открывает панель, выбор колонки переносит задачу', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'На проверке', column: 'review' }]);
  await card(page, 'T-001').getByRole('button', { name: 'На проверке' }).focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Колонка').selectOption('done');
  await page.keyboard.press('Escape');
  await expect(column(page, 'Done').getByTestId('card-T-001')).toBeVisible();
});

test('axe: нет нарушений доступности на доске', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Пожар', column: 'backlog', priority: 'p0', assignee: 'backend-agent' },
    { id: 'T-002', title: 'Обычная', column: 'in_progress', assignee: 'frontend-agent' },
  ]);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('задача из удалённой колонки видна в баннере и открывается', async ({ page }) => {
  await seed([{ id: 'T-009', title: 'Колонку убрали', column: 'archived' }]);
  await page.goto('/');
  const banner = page.getByText('Задачи в колонках, которых нет в board.yaml');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'T-009' }).click();
  const panel = page.getByRole('dialog', { name: 'T-009' });
  await expect(panel.getByLabel('Название')).toHaveValue('Колонку убрали');
  await expect(panel.getByLabel('Колонка')).toHaveValue('archived');
  await panel.getByLabel('Колонка').selectOption('backlog');
  await expect(column(page, 'Backlog').getByTestId('card-T-009')).toBeVisible();
  await expect(banner).toBeHidden();
});

test('тип сабагента виден на карточке и в шапке панели', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Ревью', column: 'in_progress', assignee: 'reviewer-1', agent: 'ecc:code-reviewer' },
    { id: 'T-002', title: 'Совпадает', column: 'in_progress', assignee: 'planner', agent: 'planner' },
  ]);
  await expect(card(page, 'T-001').locator('.card-agent')).toHaveText('ecc:code-reviewer');
  await expect(card(page, 'T-002').locator('.card-agent')).toHaveCount(0);
  await card(page, 'T-001').getByRole('button', { name: 'Ревью' }).click();
  const head = page.getByRole('dialog', { name: 'T-001' }).locator('.panel-head');
  await expect(head.locator('.panel-id')).toHaveText('T-001');
  await expect(head.locator('.panel-agent')).toHaveText('· ecc:code-reviewer');
});

test('панель: числовое поле сохраняется, отправляются только изменённые поля', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Оценка', column: 'backlog', estimate: 2 }]);
  await card(page, 'T-001').getByRole('button', { name: 'Оценка' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await expect(panel.getByLabel('estimate')).toHaveValue('2');
  const patch = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await panel.getByLabel('estimate').fill('5');
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  expect((await patch).postDataJSON()).toEqual({ fields: { estimate: 5 } });
  await expect.poll(() => readTask('T-001')).toContain('estimate: 5');
});

test('панель: живое обновление не затирает несохранённую правку', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Исходное', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Исходное' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Название').fill('Черновик');
  await writeTask({ id: 'T-002', title: 'Внешняя запись', column: 'backlog' });
  await expect(card(page, 'T-002')).toBeVisible();
  await expect(panel.getByLabel('Название')).toHaveValue('Черновик');
  await expect(panel.getByRole('button', { name: 'Сохранить' })).toBeEnabled();
});

test('фильтр по полю и открытая задача живут в URL', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Пожар', column: 'backlog', priority: 'p0' },
    { id: 'T-002', title: 'Потом', column: 'backlog', priority: 'p3' },
  ]);
  await page.getByRole('combobox', { name: 'priority' }).selectOption('p0');
  await expect(card(page, 'T-002')).toBeHidden();
  await expect(page).toHaveURL(/f\.priority=p0/);
  await card(page, 'T-001').getByRole('button', { name: 'Пожар' }).click();
  await expect(page).toHaveURL(/task=T-001/);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'T-001' })).toBeVisible();
  await expect(card(page, 'T-002')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page).not.toHaveURL(/task=/);
});

test('во время перетаскивания запрещённые колонки тускнеют, разрешённые подсвечены', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Тащу', column: 'backlog' }]);
  const box = await card(page, 'T-001').boundingBox();
  if (!box) throw new Error('Нет boundingBox у карточки');
  await page.mouse.move(box.x + box.width / 2, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + 30, { steps: 5 });
  await expect(column(page, 'Backlog')).toHaveAttribute('data-drop', 'origin');
  await expect(column(page, 'In progress')).toHaveAttribute('data-drop', 'allowed');
  await expect(column(page, 'Review')).toHaveAttribute('data-drop', 'blocked');
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'blocked');
  await expect(column(page, 'Done')).toHaveCSS('opacity', '0.38');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'idle');
});

test('счётчик WIP: на лимите — full, сверх лимита — over (красный)', async ({ page }) => {
  const inProgress = (id: string) => ({ id, title: id, column: 'in_progress', assignee: 'a' });
  await openBoard(page, [inProgress('T-001'), inProgress('T-002'), inProgress('T-003')]);
  await expect(column(page, 'In progress')).toHaveAttribute('data-limit', 'full');
  await writeTask(inProgress('T-004'));
  await expect(column(page, 'In progress').locator('.column-count')).toHaveText('4/3');
  await expect(column(page, 'In progress')).toHaveAttribute('data-limit', 'over');
  const critical = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-critical)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(column(page, 'In progress').locator('.column-count')).toHaveCSS('color', critical);
});

test('панель: параллельная запись агента не откатывается при сохранении чужой правки', async ({ page }) => {
  const base = { id: 'T-001', title: 'Исходное', column: 'backlog', priority: 'p2' };
  await openBoard(page, [base]);
  await card(page, 'T-001').getByRole('button', { name: 'Исходное' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Название').fill('Моё название');
  // Пока правка не сохранена, агент пишет в тот же файл: другой priority и описание.
  await writeTask({ ...base, priority: 'p0', description: 'Находка агента' });
  await expect(panel.getByLabel('priority')).toHaveValue('p0');
  await expect(panel.getByText('Находка агента')).toBeVisible();
  await expect(panel.getByLabel('Название')).toHaveValue('Моё название');
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  await expect.poll(() => readTask('T-001')).toContain('title: Моё название');
  const saved = await readTask('T-001');
  expect(saved).toContain('priority: p0');
  expect(saved).toContain('Находка агента');
});

test('панель: перенос через выбор колонки открывает окно requires, как drag-and-drop', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Без исполнителя', column: 'backlog' }]);
  await card(page, 'T-001').getByRole('button', { name: 'Без исполнителя' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  await panel.getByLabel('Колонка').selectOption('in_progress');
  const dialog = page.getByRole('dialog', { name: 'T-001 → In progress' });
  await expect(dialog).toBeVisible();
  await expect(panel.getByLabel('Колонка')).toHaveValue('backlog');
  // Escape закрывает только окно requires, панель остаётся.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(panel).toBeVisible();
  await panel.getByLabel('Колонка').selectOption('in_progress');
  await expect(dialog.getByLabel('assignee')).toBeFocused();
  await dialog.getByLabel('assignee').fill('panel-agent');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect(panel.getByLabel('Колонка')).toHaveValue('in_progress');
  await expect.poll(() => readTask('T-001')).toContain('assignee: panel-agent');
});
