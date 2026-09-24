import { expect, test } from '@playwright/test';
import { openBoard, type SeedTask } from './fixtures';

const VISUAL_TASKS: SeedTask[] = [
  { id: 'T-001', title: 'Прод отвечает 502 на /api/login', column: 'in_progress', priority: 'p0', assignee: 'backend-agent', area: 'backend' },
  { id: 'T-002', title: 'Добавить rate limit на логин', column: 'backlog', priority: 'p1', area: 'backend' },
  { id: 'T-003', title: 'Экспорт доски в CSV', column: 'backlog', priority: 'p2', area: 'frontend' },
  { id: 'T-004', title: 'Обновить README с примерами board.yaml', column: 'review', priority: 'p3', assignee: 'docs-agent', area: 'docs' },
  { id: 'T-005', title: 'Кэш сборки в CI', column: 'done', priority: 'p2', assignee: 'devops-agent', area: 'infra' },
];

const WIDTHS = [320, 768, 1024, 1440];

for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    // Эталоны ведём для всех трёх браузеров: Playwright хранит их раздельно (-chromium/-firefox/-webkit).
    test(`доска ${width}px, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await openBoard(page, VISUAL_TASKS);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`board-${width}-${scheme}.png`, { animations: 'disabled' });
    });
  }
}

for (const width of [320, 375]) {
  test(`нет горизонтальной прокрутки страницы на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openBoard(page, VISUAL_TASKS);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}
