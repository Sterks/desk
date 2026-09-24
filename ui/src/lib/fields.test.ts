import { describe, expect, it } from 'vitest';
import type { TaskFull } from '../api/types';
import { buildUpdate, compactFields, defaultsFor, diffFields, fieldInfo, isDirty, isUnreadable, mergeFresh, parseNumberInput, rebaseDraft, toDraft, undeclaredFields } from './fields';
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

describe('rebaseDraft / mergeFresh: свежая версия задачи и несохранённый черновик', () => {
  const fresh: TaskFull = {
    ...task,
    description: 'Описание от агента',
    fields: { priority: 'p0', area: ['backend'] },
    updated_at: '2026-09-24T11:00:00Z',
  };

  it('переносит только то, что изменил человек; остальное берётся из свежей версии', () => {
    const draft = { ...toDraft(task), title: 'Моё название' };
    expect(rebaseDraft(task, draft, fresh)).toEqual({
      title: 'Моё название',
      description: 'Описание от агента',
      assignee: 'dev',
      fields: { priority: 'p0', area: ['backend'] },
    });
  });

  it('правка поля и очистка поля переживают rebase, чужие поля — свежие', () => {
    const draft = { ...toDraft(task), assignee: 'qa', fields: { priority: 'p2', area: null } };
    const rebased = rebaseDraft(task, draft, fresh);
    expect(rebased).toEqual({ title: task.title, description: 'Описание от агента', assignee: 'qa', fields: { priority: 'p0', area: null } });
    expect(buildUpdate(fresh, rebased)).toEqual({ fields: { area: null, assignee: 'qa' } });
  });

  it('mergeFresh: чистый черновик заменяется, грязный — rebase, другая задача — с нуля', () => {
    expect(mergeFresh(null, fresh)).toEqual({ task: fresh, draft: toDraft(fresh) });
    expect(mergeFresh({ task, draft: toDraft(task) }, fresh)).toEqual({ task: fresh, draft: toDraft(fresh) });
    const dirty = { task, draft: { ...toDraft(task), title: 'Моё название' } };
    expect(mergeFresh(dirty, fresh).draft.description).toBe('Описание от агента');
    expect(mergeFresh(dirty, fresh).draft.title).toBe('Моё название');
    const other = { ...fresh, id: 'T-002' };
    expect(mergeFresh(dirty, other)).toEqual({ task: other, draft: toDraft(other) });
  });
});

describe('parseNumberInput', () => {
  it.each([
    ['', null],
    ['5', 5],
    ['5.5', 5.5],
    ['-2', -2],
  ])('%j → %j', (text, expected) => expect(parseNumberInput(text)).toBe(expected));
});

describe('isUnreadable', () => {
  it('отличает нечитаемый файл от полной задачи', () => {
    expect(isUnreadable({ id: 'T-007', unreadable: true, invalid: true, errors: ['нет frontmatter'] })).toBe(true);
    expect(isUnreadable(task)).toBe(false);
  });
});

describe('undeclaredFields', () => {
  it('поля задачи, которых нет в board.yaml, в порядке файла', () => {
    expect(undeclaredFields(boardInfo(), { priority: 'p2', legacy: 'x', area: ['backend'], old_score: 3 })).toEqual(['legacy', 'old_score']);
    expect(undeclaredFields(boardInfo(), { priority: 'p2' })).toEqual([]);
  });

  it('удаление через null попадает в buildUpdate', () => {
    const stale: TaskFull = { ...task, fields: { priority: 'p2', legacy: 'x' } };
    const draft = toDraft(stale);
    expect(buildUpdate(stale, { ...draft, title: 'T', fields: { ...draft.fields, legacy: null } })).toEqual({ title: 'T', fields: { legacy: null } });
  });
});
