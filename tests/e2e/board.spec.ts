import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { card, column, dragTo, movesAfterDrag, openBoard, readTask, seed, taskMarkdown, toasts, trackMoves, writeRawTask, writeTask } from './fixtures';

test.describe.configure({ mode: 'serial' });

// Окна requires (TNPopup) ищем через поле внутри, а не через сам диалог: role="dialog" у TNPopup
// висит на обёртке .tn-popup__block нулевой высоты, и Playwright считает корень диалога скрытым,
// хотя окно открыто и работает. Это известная, осознанно не чинившаяся особенность разметки кита
// (Task 6) — исправление означало бы править ui/vendor/tn-uikit, что вне области этого плана; та же
// обходная схема, что в drag.spec.ts. Сам getByRole('dialog', { name }) остаётся областью поиска —
// имя проверяется. Панель задачи — наш собственный <aside role="dialog">, к ней это не относится.
//
// Сценарии, которыми уже владеет drag.spec.ts, здесь не дублируются:
// - «WIP-лимит: четвёртая задача не попадает в In progress» — там «отказ сервера (WIP-лимит)»,
//   тот же сценарий плюс проверка, что узел карточки ровно один;
// - новая проверка «отмена окна requires возвращает карточку» (Review Focus #1) — там «отмена окна
//   requires: карточка на месте, запроса и записи нет, повторный перенос работает», строго шире.

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
  await expect(dialog.getByLabel('assignee')).toBeVisible();
  // Окно само фокусирует первое поле (RequiresDialog.vue, TNPopup фокусирует свой контейнер);
  // задержки после броска, как у dnd-kit, у SortableJS нет. Только недостающее поле перехода и его guide.
  await expect(dialog.locator('.field-row')).toHaveCount(1);
  await expect(dialog).toContainText('Имя агента или человека, который выполняет задачу.');
  await expect(dialog.getByLabel('assignee')).toBeFocused();
  await dialog.getByLabel('assignee').fill('e2e-agent');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect.poll(() => readTask('T-001')).toContain('assignee: e2e-agent');
});

// Переписан осознанно (task-9-brief, решение (a)): в React/@dnd-kit бросок в запрещённую колонку
// доходил до сервера, тот отказывал, и toast объяснял причину. Теперь SortableJS-onMove и
// dragover доски синхронно не принимают бросок в запрещённую колонку — запроса нет, объяснять
// нечего, карточка просто не покидает исходную колонку. Проверяем это более сильное поведение.
test('запрещённый переход: бросок не принимается, карточка остаётся, запроса и toast нет', async ({ page }) => {
  await trackMoves(page);
  await openBoard(page, [{ id: 'T-001', title: 'Сразу в Done нельзя', column: 'backlog' }]);
  const from = await card(page, 'T-001').boundingBox();
  const to = await column(page, 'Done').boundingBox();
  if (!from || !to) throw new Error('Нет boundingBox');
  await page.mouse.move(from.x + from.width / 2, from.y + 12);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + 22, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 20 });
  // Жест действительно идёт и указатель над Done: колонка помечена запрещённой, плейсхолдер не вошёл.
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'blocked');
  await expect(column(page, 'Done').locator('[data-task-id]')).toHaveCount(0);
  await page.mouse.up();
  await expect(column(page, 'Done')).toHaveAttribute('data-drop', 'idle');
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'Done').getByTestId('card-T-001')).toHaveCount(0);
  await expect(toasts(page).locator('.toast')).toHaveCount(0);
  expect(await movesAfterDrag(page)).toBe(0);
  expect(await readTask('T-001')).toContain('column: backlog');
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

// Дополнение к порту: тот же аудит в тёмной теме и со всеми тонами приоритета и состоянием WIP «на
// лимите» — контраст мелкого текста (11–12px) на кит-овых токенах проверяется в обеих темах.
test('axe: нет нарушений доступности на доске в тёмной теме, все приоритеты и WIP на лимите', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const inProgress = (id: string, priority: string) => ({ id, title: id, column: 'in_progress', assignee: 'a', priority });
  await openBoard(page, [
    { id: 'T-001', title: 'Пожар', column: 'backlog', priority: 'p0', assignee: 'backend-agent', agent: 'ecc:code-reviewer' },
    inProgress('T-002', 'p1'),
    inProgress('T-003', 'p2'),
    inProgress('T-004', 'p3'),
  ]);
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/);
  await expect(column(page, 'In progress')).toHaveAttribute('data-limit', 'full');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// R6-fix: тот же самый аудит, но в светлой теме, а не только в тёмной — светлые p1 (4.79:1) и
// WIP-full (4.94:1) держат наименьший запас над AA-порогом 4.5:1 во всей системе токенов
// (см. global-constraints.md, п.6), теснее, чем их тёмные аналоги. Регрессия токена, которая уронит
// именно эту пару под порог, иначе могла бы остаться незамеченной: тест выше её не поймает.
test('axe: нет нарушений доступности на доске в светлой теме, все приоритеты и WIP на лимите', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const inProgress = (id: string, priority: string) => ({ id, title: id, column: 'in_progress', assignee: 'a', priority });
  await openBoard(page, [
    { id: 'T-001', title: 'Пожар', column: 'backlog', priority: 'p0', assignee: 'backend-agent', agent: 'ecc:code-reviewer' },
    inProgress('T-002', 'p1'),
    inProgress('T-003', 'p2'),
    inProgress('T-004', 'p3'),
  ]);
  await expect(page.locator('html')).not.toHaveClass(/tn-dark-theme/);
  await expect(column(page, 'In progress')).toHaveAttribute('data-limit', 'full');
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

// Final-review Critical #1: TNInput — это type="text", и `1,5`/`-`/`5x` раньше давали NaN → JSON null →
// сохранение молча стирало estimate. Теперь невалидный текст показывает ошибку и блокирует сохранение
// (даже вместе с другой, валидной правкой), а в черновик не попадает вовсе.
test('панель: невалидное число не стирает значение — ошибка и блокировка сохранения', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Оценка', column: 'backlog', estimate: 2 }]);
  await card(page, 'T-001').getByRole('button', { name: 'Оценка' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  const estimate = panel.getByLabel('estimate');
  const save = panel.getByRole('button', { name: 'Сохранить' });
  await panel.getByLabel('Название').fill('Новое название');
  await expect(save).toBeEnabled();
  for (const bad of ['1,5', '-', '5x']) {
    await estimate.fill(bad);
    await expect(panel.getByText('Не число. Дробную часть отделяйте точкой: 1.5')).toBeVisible();
    await expect(save).toBeDisabled();
  }
  expect(await readTask('T-001')).toContain('estimate: 2');

  await estimate.fill('1.5');
  await expect(panel.getByText('Не число.')).toHaveCount(0);
  const patch = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await save.click();
  expect((await patch).postDataJSON()).toEqual({ title: 'Новое название', fields: { estimate: 1.5 } });
  await expect.poll(() => readTask('T-001')).toContain('estimate: 1.5');
});

// `-5` — валидное число: уходит как -5 (не null), сервер отказывает (min: 0), файл не меняется.
// Пустое поле — осознанная очистка: единственный путь к `estimate: null`.
test('панель: -5 отправляется числом и отклоняется сервером; пустое поле очищает значение', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Оценка', column: 'backlog', estimate: 2 }]);
  await card(page, 'T-001').getByRole('button', { name: 'Оценка' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  const estimate = panel.getByLabel('estimate');
  const save = panel.getByRole('button', { name: 'Сохранить' });

  await estimate.fill('-5');
  const rejected = page.waitForResponse((r) => r.request().method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await save.click();
  const response = await rejected;
  expect(response.request().postDataJSON()).toEqual({ fields: { estimate: -5 } });
  expect(response.ok()).toBe(false);
  await expect(toasts(page).locator('.toast')).toHaveCount(1);
  expect(await readTask('T-001')).toContain('estimate: 2');

  await estimate.fill('');
  const cleared = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().endsWith('/api/tasks/T-001'));
  await save.click();
  expect((await cleared).postDataJSON()).toEqual({ fields: { estimate: null } });
  await expect.poll(() => readTask('T-001')).not.toContain('estimate');
});

// Первый критерий успеха спеки: задача создаётся через окно и появляется на доске.
test('окно «Новая задача»: фокус в title, задача создаётся, появляется на доске и в файле', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Есть', column: 'backlog' }]);
  await page.getByRole('button', { name: 'Новая задача' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новая задача' });
  await expect(dialog.getByLabel('title')).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Создать' })).toBeDisabled();
  await dialog.getByLabel('title').fill('Создана из окна');
  await dialog.getByLabel('priority').selectOption('p1');
  await dialog.getByLabel('assignee').fill('ui-agent');
  await dialog.getByLabel('estimate').fill('3');
  await dialog.getByLabel('description').fill('Описание из окна');
  await dialog.getByRole('button', { name: 'Создать' }).click();

  await expect(page).toHaveURL(/task=T-\d+/);
  const id = new URL(page.url()).searchParams.get('task') ?? '';
  expect(id).not.toBe('T-001');
  await expect(page.getByLabel('title')).toHaveCount(0);
  const created = column(page, 'Backlog').getByTestId(`card-${id}`);
  await expect(created).toContainText('Создана из окна');
  await expect(created).toContainText('ui-agent');
  await expect(page.getByRole('dialog', { name: id }).getByLabel('Название')).toHaveValue('Создана из окна');
  const saved = await readTask(id);
  expect(saved).toContain('title: Создана из окна');
  expect(saved).toContain('priority: p1');
  expect(saved).toContain('assignee: ui-agent');
  expect(saved).toContain('estimate: 3');
  expect(saved).toContain('Описание из окна');
});

// Final-review #2: TNButton «Новая задача» — `<button>` без type внутри `<form role="search">`, то
// есть неявная submit-кнопка: Enter в поиске «нажимал» её. Окно открывается синхронно из обработчика
// клика, поэтому двух кадров после Enter достаточно, чтобы оно успело бы появиться.
test('Enter в поле поиска не открывает окно «Новая задача»', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Логин', column: 'backlog' }]);
  const search = page.getByRole('searchbox', { name: 'Поиск по ID и названию' });
  await search.fill('Логин');
  await search.press('Enter');
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByLabel('title')).toHaveCount(0);
  await expect(search).toBeFocused();
  await expect(card(page, 'T-001')).toBeVisible();
  // Сама кнопка по-прежнему работает — и она больше не submit.
  await expect(page.getByRole('button', { name: 'Новая задача' })).toHaveAttribute('type', 'button');
  await page.getByRole('button', { name: 'Новая задача' }).click();
  await expect(page.getByRole('dialog', { name: 'Новая задача' }).getByLabel('title')).toBeVisible();
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
    probe.style.color = 'var(--wip-over)';
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
  await expect(dialog.getByLabel('assignee')).toBeVisible();
  await expect(panel.getByLabel('Колонка')).toHaveValue('backlog');
  // Escape закрывает только окно requires, панель остаётся.
  await page.keyboard.press('Escape');
  await expect(dialog.getByLabel('assignee')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'T-001 → In progress' })).toHaveCount(0);
  await expect(panel).toBeVisible();
  await panel.getByLabel('Колонка').selectOption('in_progress');
  await expect(dialog.getByLabel('assignee')).toBeFocused();
  await dialog.getByLabel('assignee').fill('panel-agent');
  await dialog.getByRole('button', { name: 'Перенести' }).click();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toBeVisible();
  await expect(panel.getByLabel('Колонка')).toHaveValue('in_progress');
  await expect.poll(() => readTask('T-001')).toContain('assignee: panel-agent');
});

test('баннеры invalid_files и duplicate_ids; нечитаемая задача открывается и переживает перезагрузку', async ({ page }) => {
  await seed([{ id: 'T-001', title: 'Целая', column: 'backlog' }]);
  await writeRawTask('T-007', '<<<<<<< HEAD\nконфликт слияния\n=======\n>>>>>>> branch\n');
  await writeRawTask('T-003', taskMarkdown({ id: 'T-003', title: 'Дубль A', column: 'backlog' }));
  await writeRawTask('T-3', taskMarkdown({ id: 'T-3', title: 'Дубль B', column: 'backlog' }));
  await page.goto('/');
  await expect(card(page, 'T-001')).toBeVisible();
  await expect(page.getByText('Дубликаты ID: T-003 = T-3')).toBeVisible();
  const invalid = page.getByText('Не читаются файлы:');
  await expect(invalid).toContainText('T-007');

  await invalid.getByRole('button', { name: 'T-007' }).click();
  await expect(page).toHaveURL(/task=T-007/);
  const panel = page.getByRole('dialog', { name: 'T-007' });
  await expect(panel.getByText('Файл задачи не читается')).toBeVisible();
  await expect(panel.locator('.error-list li').first()).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Сохранить' })).toHaveCount(0);

  await page.reload();
  await expect(card(page, 'T-001')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'T-007' }).getByText('Файл задачи не читается')).toBeVisible();
});

test('панель: поле, удалённое из board.yaml, можно убрать и сохранить задачу', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Со старым полем', column: 'backlog', extraFields: { legacy_flag: 'old' } }]);
  await card(page, 'T-001').getByRole('button', { name: 'Со старым полем' }).click();
  const panel = page.getByRole('dialog', { name: 'T-001' });
  const stale = panel.locator('.stale-field', { hasText: 'legacy_flag' });
  await expect(stale).toContainText('old');
  await panel.getByLabel('Название').fill('Новое название');
  await stale.getByRole('button', { name: 'удалить' }).click();
  await panel.getByRole('button', { name: 'Сохранить' }).click();
  await expect.poll(() => readTask('T-001')).toContain('title: Новое название');
  expect(await readTask('T-001')).not.toContain('legacy_flag');
  await expect(panel.locator('.stale-field')).toHaveCount(0);
  await expect(toasts(page)).not.toContainText('не объявлено');
});

test('ошибка отрисовки панели не роняет доску (error boundary)', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Есть', column: 'backlog' }]);
  // Неожиданная форма ответа сервера — панель падает при отрисовке.
  await page.route('**/api/tasks/T-001', (route) => route.fulfill({ json: { ok: true, data: { id: 'T-001' } } }));
  await page.goto('/?task=T-001');
  await expect(page.getByRole('alert').filter({ hasText: 'Панель задачи не отрисовалась' })).toBeVisible();
  await expect(card(page, 'T-001')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть панель' }).click();
  await expect(page).not.toHaveURL(/task=/);
});

test('ошибка отрисовки всего приложения показывает сообщение, а не пустую страницу', async ({ page }) => {
  await seed([]);
  await page.route('**/api/board', (route) => route.fulfill({ json: { ok: true, data: { name: 'broken' } } }));
  await page.goto('/');
  await expect(page.getByRole('alert').filter({ hasText: 'Интерфейс desk не отрисовался' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Перезагрузить доску' })).toBeVisible();
});

// Review Focus #5. Без ручного выбора тема следует за ОС, в том числе когда ОС меняется при открытой
// вкладке; ручной выбор запоминается (localStorage), переживает перезагрузку и больше не
// перебивается сменой темы ОС.
test('тема: следует за ОС без ручного выбора; ручной выбор переопределяет ОС и переживает перезагрузку', async ({ page }) => {
  const html = page.locator('html');
  await page.emulateMedia({ colorScheme: 'light' });
  await openBoard(page, [{ id: 'T-001', title: 'Тема', column: 'backlog' }]);
  await expect(html).not.toHaveClass(/tn-dark-theme/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveClass(/tn-dark-theme/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).not.toHaveClass(/tn-dark-theme/);

  await page.getByRole('button', { name: 'Переключить тему' }).click();
  await expect(html).toHaveClass(/tn-dark-theme/);
  await page.reload();
  await expect(card(page, 'T-001')).toBeVisible();
  await expect(html).toHaveClass(/tn-dark-theme/);
  // ОС переключается туда-обратно при активном ручном выборе — тема не должна сдвинуться.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveClass(/tn-dark-theme/);
  await page.getByRole('button', { name: 'Переключить тему' }).click();
  await expect(html).not.toHaveClass(/tn-dark-theme/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).not.toHaveClass(/tn-dark-theme/);
});

// Final-review #4: тема применяется до монтирования (main.ts → initTheme), а не в ThemeToggle, который
// живёт только в загруженной доске. Ответ /api/board держим, пока проверяем экран загрузки.
test('тема: тёмная тема ОС стоит уже на экране загрузки, иконка следует за сменой темы ОС', async ({ page }) => {
  await seed([{ id: 'T-001', title: 'Тема', column: 'backlog' }]);
  await page.emulateMedia({ colorScheme: 'dark' });
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/board', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByText('Загрузка доски…')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/);
  release();
  await expect(card(page, 'T-001')).toBeVisible();

  const toggle = page.getByRole('button', { name: 'Переключить тему' });
  await expect(toggle).toHaveText('☾');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/tn-dark-theme/);
  await expect(toggle).toHaveText('☀');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(toggle).toHaveText('☾');
});

test('тема: аварийный экран приложения тоже в тёмной теме; «Перезагрузить доску» убирает query из URL', async ({ page }) => {
  await seed([]);
  await page.emulateMedia({ colorScheme: 'dark' });
  let broken = true;
  await page.route('**/api/board', (route) =>
    broken ? route.fulfill({ json: { ok: true, data: { name: 'broken' } } }) : route.continue(),
  );
  await page.goto('/?task=T-404&q=x');
  await expect(page.getByRole('alert').filter({ hasText: 'Интерфейс desk не отрисовался' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/);
  broken = false;
  await page.getByRole('button', { name: 'Перезагрузить доску' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('alert').filter({ hasText: 'Интерфейс desk не отрисовался' })).toHaveCount(0);
});
