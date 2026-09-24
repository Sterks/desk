import type { BoardInfo, TaskItem } from '../api/types';

export function boardInfo(overrides: Partial<BoardInfo> = {}): BoardInfo {
  return {
    name: 'desk',
    guide: null,
    columns: [
      { id: 'backlog', title: 'Backlog', guide: null, wip_limit: null, count: 0 },
      { id: 'in_progress', title: 'In progress', guide: null, wip_limit: 3, count: 0 },
      { id: 'review', title: 'Review', guide: null, wip_limit: null, count: 0 },
      { id: 'done', title: 'Done', guide: null, wip_limit: null, count: 0 },
    ],
    fields: [
      { id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'], default: 'p2', min: null, max: null, guide: null },
      { id: 'area', type: 'multi_enum', required: false, values: ['backend', 'frontend'], default: null, min: null, max: null, guide: null },
      { id: 'pr_url', type: 'url', required: false, values: null, default: null, min: null, max: null, guide: 'Ссылка на PR.' },
    ],
    transitions: [
      { from: 'backlog', to: ['in_progress'], requires: ['assignee'] },
      { from: 'in_progress', to: ['review'], requires: ['pr_url'] },
      { from: 'review', to: ['in_progress', 'done'], requires: [] },
    ],
    ...overrides,
  };
}

export function taskItem(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 'T-001',
    title: 'Задача',
    column: 'backlog',
    assignee: null,
    agent: null,
    fields: { priority: 'p2' },
    created_at: '2026-09-24T10:00:00Z',
    invalid: false,
    errors: [],
    ...overrides,
  };
}
