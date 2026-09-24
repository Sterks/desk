import { describe, expect, it } from 'vitest';
import { findDuplicateIds, idNumber, nextId } from '../../src/core/ids.js';

describe('nextId', () => {
  it.each([
    [[], 'T-001'],
    [['T-001', 'T-009'], 'T-010'],
    [['T-999'], 'T-1000'],
    [['X-050', 'T-002'], 'T-003'],
    [['T-005', 'T-002'], 'T-006'],
  ])('%j → %s', (existing, expected) => {
    expect(nextId('T', existing)).toBe(expected);
  });
});

describe('idNumber', () => {
  it('разбирает номер', () => expect(idNumber('T-042')).toBe(42));
  it('null для не-ID', () => expect(idNumber('readme')).toBeNull());
});

describe('findDuplicateIds', () => {
  it('группирует ID с одинаковым номером', () => {
    expect(findDuplicateIds(['T-7', 'T-007', 'T-008', 'X-7'])).toEqual([['T-007', 'T-7']]);
  });
  it('пусто без дубликатов', () => expect(findDuplicateIds(['T-001', 'T-002'])).toEqual([]));
});
