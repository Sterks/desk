import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { card, openBoard, PROJECT_ROOT, replaceBoard, restoreBoard, type BoardBackup } from './fixtures';

// Цвет пилюли — по ПОЗИЦИИ значения в values поля priority (spec §6), не по имени значения: на доске
// с values [high, mid, low] первое значение получает класс .priority-p0, хотя «p0» там не встречается.

test.describe.configure({ mode: 'serial' });

const DEFAULT_PRIORITY = 'values: [p0, p1, p2, p3]\n    required: true\n    default: p2\n';

let backup: BoardBackup | undefined;

test.beforeAll(async () => {
  const original = await readFile(join(PROJECT_ROOT, '.desk', 'board.yaml'), 'utf8');
  if (!original.includes(DEFAULT_PRIORITY)) throw new Error('board.yaml не совпадает с шаблоном desk init');
  const renamed = original.replace(DEFAULT_PRIORITY, 'values: [high, mid, low]\n    required: true\n    default: mid\n');
  backup = await replaceBoard(renamed, (fields) => fields.find((f) => f.id === 'priority')?.values?.[0] === 'high');
});

test.afterAll(async () => {
  if (backup) await restoreBoard(backup);
});

test('пилюля приоритета окрашивается по позиции значения в board.yaml', async ({ page }) => {
  await openBoard(page, [
    { id: 'T-001', title: 'Первое', column: 'backlog', priority: 'high' },
    { id: 'T-002', title: 'Среднее', column: 'backlog', priority: 'mid' },
    { id: 'T-003', title: 'Последнее', column: 'backlog', priority: 'low' },
  ]);
  const pill = (id: string) => card(page, id).locator('.priority-pill');
  await expect(pill('T-001')).toHaveText('high');
  await expect(pill('T-001')).toHaveClass(/\bpriority-p0\b/);
  // Три значения: как у priorityTone — второе «high»-тон (p1), последнее «low» (p3).
  await expect(pill('T-002')).toHaveClass(/\bpriority-p1\b/);
  await expect(pill('T-003')).toHaveClass(/\bpriority-p3\b/);
  // Цвет — реально от .priority-p0, а не только имя класса.
  const p0Color = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.className = 'priority-p0';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(pill('T-001')).toHaveCSS('color', p0Color);
});
