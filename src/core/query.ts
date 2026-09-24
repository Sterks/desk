import type { Board, Task } from './types.js';

export interface TaskFilter {
  column?: string;
  assignee?: string;
  query?: string;
  where?: Record<string, unknown>;
  limit?: number;
}

export function sortTasks(board: Board, tasks: readonly Task[]): Task[] {
  const priority = board.fields.find((f) => f.id === 'priority' && f.type === 'enum');
  const values = priority?.values ?? [];
  const rank = (task: Task): number => {
    if (!priority) return 0;
    const index = values.indexOf(String(task.fields.priority));
    return index === -1 ? values.length : index;
  };
  return [...tasks].sort(
    (a, b) => rank(a) - rank(b) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

function matchesWhere(task: Task, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = key === 'assignee' ? task.assignee : task.fields[key];
    return Array.isArray(actual) ? actual.includes(expected as string) : actual === expected;
  });
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  const query = filter.query?.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (filter.column === undefined || task.column === filter.column) &&
      (filter.assignee === undefined || task.assignee === filter.assignee) &&
      (!query || task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)) &&
      (filter.where === undefined || matchesWhere(task, filter.where)),
  );
}
