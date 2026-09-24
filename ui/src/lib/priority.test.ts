import { describe, expect, it } from 'vitest';
import { priorityClass, priorityTone } from './priority';
import { boardInfo } from './test-fixtures';

describe('priorityTone', () => {
  const board = boardInfo();
  it.each([
    ['p0', 'critical'],
    ['p1', 'high'],
    ['p2', 'normal'],
    ['p3', 'low'],
    ['p9', null],
    [undefined, null],
  ])('%s → %s', (value, tone) => expect(priorityTone(board, value)).toBe(tone));

  it('без поля priority — null', () => expect(priorityTone(boardInfo({ fields: [] }), 'p0')).toBeNull());
});

describe('priorityClass', () => {
  it.each([
    ['p0', 'priority-p0'],
    ['p1', 'priority-p1'],
    ['p2', 'priority-p2'],
    ['p3', 'priority-p3'],
    ['p9', null],
  ])('стандартная доска: %s → %s', (value, cls) => expect(priorityClass(priorityTone(boardInfo(), value))).toBe(cls));

  // Класс — по позиции в values, а не по имени значения: первое значение получает цвет p0.
  it.each([
    ['high', 'priority-p0'],
    ['mid', 'priority-p1'],
    ['low', 'priority-p3'],
    ['p0', null],
  ])('values [high, mid, low]: %s → %s', (value, cls) => {
    const board = boardInfo({
      fields: [{ id: 'priority', type: 'enum', required: true, values: ['high', 'mid', 'low'], default: 'mid', min: null, max: null, guide: null }],
    });
    expect(priorityClass(priorityTone(board, value))).toBe(cls);
  });
});
