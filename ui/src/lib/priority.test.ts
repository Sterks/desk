import { describe, expect, it } from 'vitest';
import { priorityTone } from './priority';
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
