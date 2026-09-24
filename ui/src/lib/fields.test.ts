import { describe, expect, it } from 'vitest';
import type { TaskFull } from '../api/types';
import { buildUpdate, compactFields, defaultsFor, diffFields, fieldInfo, isDirty, toDraft } from './fields';
import { boardInfo, taskItem } from './test-fixtures';

const task: TaskFull = {
  ...taskItem({ assignee: 'dev', fields: { priority: 'p2', area: ['backend'] } }),
  created_by: 'planner',
  updated_at: '2026-09-24T10:00:00Z',
  description: 'Описание',
  notes: [],
  history: [],
};

describe('fields', () => {
  it('defaultsFor и compactFields', () => {
    expect(defaultsFor(boardInfo())).toEqual({ priority: 'p2' });
    expect(compactFields({ a: 1, b: null, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('diffFields: только изменённые, null для очищенных', () => {
    expect(diffFields({ priority: 'p2', area: ['backend'] }, { priority: 'p0', area: null })).toEqual({ priority: 'p0', area: null });
    expect(diffFields({ area: ['backend'] }, { area: ['backend'] })).toEqual({});
  });

  it('fieldInfo знает assignee', () => {
    expect(fieldInfo(boardInfo(), 'assignee')?.type).toBe('string');
    expect(fieldInfo(boardInfo(), 'pr_url')?.type).toBe('url');
    expect(fieldInfo(boardInfo(), 'ghost')).toBeUndefined();
  });

  it('buildUpdate и isDirty', () => {
    const draft = toDraft(task);
    expect(isDirty(task, draft)).toBe(false);
    expect(buildUpdate(task, { ...draft, title: 'Новое' })).toEqual({ title: 'Новое', fields: {} });
    expect(buildUpdate(task, { ...draft, assignee: '  ' })).toEqual({ fields: { assignee: null } });
    expect(buildUpdate(task, { ...draft, fields: { ...draft.fields, priority: 'p1' } })).toEqual({ fields: { priority: 'p1' } });
    expect(isDirty(task, { ...draft, description: 'x' })).toBe(true);
  });
});
