import { describe, expect, it } from 'vitest';
import {
  applyChanges,
  applyDefaults,
  assertTaskValid,
  checkActor,
  checkTitle,
  checkValue,
  isEmptyValue,
  validateTask,
} from '../../src/core/validate.js';
import type { FieldDef } from '../../src/core/types.js';
import { testBoard, testTask } from '../helpers/board.js';
import { catchError } from '../helpers/errors.js';

const board = testBoard();
const def = (id: string): FieldDef => {
  const found = board.fields.find((f) => f.id === id);
  if (!found) throw new Error(`нет поля ${id}`);
  return found;
};
const ctx = { taskExists: (id: string) => id === 'T-001' };

describe('checkValue', () => {
  it.each([
    ['summary', 'коротко'],
    ['summary', 'a'.repeat(200)],
    ['acceptance', 'много\nстрок'],
    ['estimate', 0],
    ['estimate', 42.5],
    ['flaky', false],
    ['due', '2026-10-01'],
    ['pr_url', 'https://github.com/org/repo/pull/1'],
    ['priority', 'p1'],
    ['area', ['backend', 'frontend']],
    ['blocked_by', 'T-001'],
  ])('принимает %s = %j', (id, value) => {
    expect(checkValue(def(id), value, ctx)).toEqual(value);
  });

  it.each([
    ['summary', 'две\nстроки'],
    ['summary', 'a'.repeat(201)],
    ['summary', 5],
    ['acceptance', 5],
    ['estimate', '5'],
    ['estimate', -1],
    ['estimate', 101],
    ['estimate', Number.POSITIVE_INFINITY],
    ['flaky', 'true'],
    ['due', '2026-02-30'],
    ['due', '01.10.2026'],
    ['pr_url', 'ftp://example.com'],
    ['pr_url', '/relative/path'],
    ['priority', 'p9'],
    ['area', 'backend'],
    ['area', ['backend', 'backend']],
    ['area', ['mobile']],
    ['blocked_by', 'T-999'],
    ['blocked_by', 'not-an-id'],
  ])('отклоняет %s = %j', (id, value) => {
    const err = catchError(() => checkValue(def(id), value, ctx));
    expect(err.code).toBe('INVALID_VALUE');
    expect(err.details.field).toBe(id);
  });

  it('для enum возвращает guide и allowed', () => {
    const err = catchError(() => checkValue(def('priority'), 'urgent', ctx));
    expect(err.toJSON()).toMatchObject({ guide: 'p0 — прод лежит.', allowed: ['p0', 'p1', 'p2', 'p3'] });
  });

  it('task_ref без контекста проверяет только формат', () => {
    expect(checkValue(def('blocked_by'), 'T-777')).toBe('T-777');
  });
});

describe('isEmptyValue', () => {
  it.each([[undefined], [null], [''], [[]]])('%j пустое', (v) => expect(isEmptyValue(v)).toBe(true));
  it.each([[0], [false], ['x'], [['a']]])('%j не пустое', (v) => expect(isEmptyValue(v)).toBe(false));
});

describe('checkTitle и checkActor', () => {
  it('обрезает пробелы в title', () => expect(checkTitle('  Задача  ')).toBe('Задача'));
  it.each([[''], ['   '], ['a\nb'], ['a'.repeat(201)], [5]])('title %j отклоняется', (t) => {
    expect(catchError(() => checkTitle(t)).code).toBe('INVALID_VALUE');
  });
  it('actor обязателен', () => expect(catchError(() => checkActor('')).code).toBe('BAD_REQUEST'));
  it.each([['a:b'], ['a · b'], ['a\nb'], ['x'.repeat(65)], [undefined]])('actor %j отклоняется', (a) => {
    expect(catchError(() => checkActor(a)).code).toBe('BAD_REQUEST');
  });
  it('actor с пробелом допустим', () => expect(checkActor(' Denis Runov ')).toBe('Denis Runov'));
});

describe('applyDefaults', () => {
  it('подставляет default только для отсутствующих полей', () => {
    expect(applyDefaults(board, {})).toEqual({ priority: 'p2' });
    expect(applyDefaults(board, { priority: 'p0' })).toEqual({ priority: 'p0' });
  });
});

describe('applyChanges', () => {
  it('ставит значение и не меняет исходную задачу', () => {
    const task = testTask();
    const next = applyChanges(board, task, { estimate: 3, area: ['backend'] }, ctx);
    expect(next.fields).toEqual({ priority: 'p2', estimate: 3, area: ['backend'] });
    expect(task.fields).toEqual({ priority: 'p2' });
  });

  it('null удаляет значение', () => {
    const next = applyChanges(board, testTask({ fields: { priority: 'p2', estimate: 3 } }), { estimate: null }, ctx);
    expect(next.fields).toEqual({ priority: 'p2' });
  });

  it('assignee ставится и снимается', () => {
    const withAssignee = applyChanges(board, testTask(), { assignee: 'backend-agent' }, ctx);
    expect(withAssignee.assignee).toBe('backend-agent');
    const cleared = applyChanges(board, withAssignee, { assignee: null }, ctx);
    expect('assignee' in cleared).toBe(false);
  });

  it('неверный assignee — INVALID_VALUE', () => {
    expect(catchError(() => applyChanges(board, testTask(), { assignee: 5 }, ctx)).code).toBe('INVALID_VALUE');
  });

  it('неизвестное поле — UNKNOWN_FIELD со списком полей', () => {
    const err = catchError(() => applyChanges(board, testTask(), { severity: 'high' }, ctx));
    expect(err.code).toBe('UNKNOWN_FIELD');
    expect(err.details.allowed).toContain('priority');
    expect(err.details.allowed).toContain('assignee');
  });

  it('null для поля, удалённого из board.yaml, чистит устаревшее значение', () => {
    const stale = testTask({ fields: { priority: 'p2', severity: 'high' } });
    const next = applyChanges(board, stale, { severity: null }, ctx);
    expect(next.fields).toEqual({ priority: 'p2' });
  });

  it('ошибка значения несёт guide поля', () => {
    const err = catchError(() => applyChanges(board, testTask(), { pr_url: 'nope' }, ctx));
    expect(err.toJSON()).toMatchObject({ code: 'INVALID_VALUE', field: 'pr_url', guide: 'Ссылка на PR.' });
  });
});

describe('validateTask', () => {
  it('валидная задача — пустой список', () => {
    expect(validateTask(board, testTask(), ctx)).toEqual([]);
  });

  it('находит неизвестную колонку, лишнее поле, плохое значение и пропущенное обязательное', () => {
    const task = testTask({ column: 'archived', fields: { severity: 'high', estimate: -5 } });
    const codes = validateTask(board, task, ctx).map((e) => e.code);
    expect(codes).toEqual(['INVALID_VALUE', 'UNKNOWN_FIELD', 'INVALID_VALUE', 'REQUIRED_MISSING']);
  });

  it('assertTaskValid бросает первую ошибку', () => {
    const err = catchError(() => assertTaskValid(board, testTask({ fields: {} }), ctx));
    expect(err.code).toBe('REQUIRED_MISSING');
    expect(err.details.guide).toBe('p0 — прод лежит.');
  });
});
