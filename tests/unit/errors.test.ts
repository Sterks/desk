import { describe, expect, it } from 'vitest';
import { DeskError, isDeskError } from '../../src/core/errors.js';

describe('DeskError', () => {
  it('сериализуется в JSON с null для отсутствующих деталей', () => {
    const err = new DeskError('NOT_FOUND', 'Задача T-001 не найдена');
    expect(err.toJSON()).toEqual({
      code: 'NOT_FOUND',
      message: 'Задача T-001 не найдена',
      field: null,
      guide: null,
      allowed: null,
    });
  });

  it('переносит field, guide и allowed', () => {
    const err = new DeskError('INVALID_VALUE', 'плохо', { field: 'priority', guide: 'p0 — прод', allowed: ['p0', 'p1'] });
    expect(err.toJSON()).toMatchObject({ field: 'priority', guide: 'p0 — прод', allowed: ['p0', 'p1'] });
  });

  it('isDeskError отличает DeskError от Error', () => {
    expect(isDeskError(new DeskError('BAD_REQUEST', 'x'))).toBe(true);
    expect(isDeskError(new Error('x'))).toBe(false);
  });
});
