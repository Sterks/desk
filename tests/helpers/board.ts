import type { Board, Task } from '../../src/core/types.js';

export function testBoard(overrides: Partial<Board> = {}): Board {
  return {
    version: 1,
    name: 'test',
    idPrefix: 'T',
    guide: 'Общие правила.',
    columns: [
      { id: 'backlog', title: 'Backlog', guide: 'Новые задачи.' },
      { id: 'in_progress', title: 'In progress', wipLimit: 2, guide: 'В работе.' },
      { id: 'review', title: 'Review' },
      { id: 'done', title: 'Done' },
    ],
    transitions: [
      { from: 'backlog', to: ['in_progress'], requires: ['assignee'] },
      { from: 'in_progress', to: ['review'], requires: ['pr_url'] },
      { from: 'in_progress', to: ['backlog'], requires: [] },
      { from: 'review', to: ['in_progress', 'done'], requires: [] },
    ],
    fields: [
      { id: 'priority', type: 'enum', required: true, values: ['p0', 'p1', 'p2', 'p3'], default: 'p2', guide: 'p0 — прод лежит.' },
      { id: 'area', type: 'multi_enum', required: false, values: ['backend', 'frontend'] },
      { id: 'pr_url', type: 'url', required: false, guide: 'Ссылка на PR.' },
      { id: 'estimate', type: 'number', required: false, min: 0, max: 100 },
      { id: 'due', type: 'date', required: false },
      { id: 'blocked_by', type: 'task_ref', required: false },
      { id: 'flaky', type: 'bool', required: false },
      { id: 'summary', type: 'string', required: false },
      { id: 'acceptance', type: 'text', required: false },
    ],
    ...overrides,
  };
}

export function testTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'T-001',
    title: 'Задача',
    column: 'backlog',
    createdBy: 'planner',
    createdAt: '2026-09-24T10:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
    fields: { priority: 'p2' },
    history: [{ at: '2026-09-24T10:00:00Z', by: 'planner', from: null, to: 'backlog' }],
    description: '',
    notes: [],
    ...overrides,
  };
}
