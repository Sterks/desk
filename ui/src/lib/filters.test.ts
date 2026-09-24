import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, applyFilters, filtersFromSearch, filtersToSearch } from './filters';
import { taskItem } from './test-fixtures';

describe('фильтры в URL', () => {
  it('round-trip', () => {
    const filters = { q: 'логин', assignee: 'dev', fields: { priority: 'p0' }, task: 'T-012' };
    expect(filtersFromSearch(filtersToSearch(filters))).toEqual(filters);
  });
  it('пустые фильтры — пустая строка', () => expect(filtersToSearch(EMPTY_FILTERS)).toBe(''));
  it('пустые значения f.* отбрасываются', () => expect(filtersFromSearch('?f.priority=&q=x').fields).toEqual({}));
});

describe('applyFilters', () => {
  const tasks = [
    taskItem({ id: 'T-001', title: 'Rate limit на логин', assignee: 'dev', fields: { priority: 'p0', area: ['backend'] } }),
    taskItem({ id: 'T-002', title: 'Кнопка', fields: { priority: 'p2', area: ['frontend'] } }),
  ];
  const run = (patch: Partial<typeof EMPTY_FILTERS>) => applyFilters(tasks, { ...EMPTY_FILTERS, ...patch }).map((t) => t.id);

  it('q ищет по ID и названию без регистра', () => {
    expect(run({ q: 'ЛОГИН' })).toEqual(['T-001']);
    expect(run({ q: 't-002' })).toEqual(['T-002']);
  });
  it('assignee', () => expect(run({ assignee: 'dev' })).toEqual(['T-001']));
  it('поле: точное значение и вхождение в массив', () => {
    expect(run({ fields: { priority: 'p2' } })).toEqual(['T-002']);
    expect(run({ fields: { area: 'backend' } })).toEqual(['T-001']);
  });
});
