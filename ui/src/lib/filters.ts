import type { TaskItem } from '../api/types';

export interface Filters {
  q: string;
  assignee: string;
  fields: Record<string, string>;
  task: string | null;
}

export const EMPTY_FILTERS: Filters = { q: '', assignee: '', fields: {}, task: null };
const FIELD_PREFIX = 'f.';

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const fields = Object.fromEntries(
    [...params.entries()]
      .filter(([key, value]) => key.startsWith(FIELD_PREFIX) && value !== '')
      .map(([key, value]) => [key.slice(FIELD_PREFIX.length), value]),
  );
  return { q: params.get('q') ?? '', assignee: params.get('assignee') ?? '', fields, task: params.get('task') || null };
}

export function filtersToSearch(filters: Filters): string {
  const entries: [string, string][] = [
    ['q', filters.q],
    ['assignee', filters.assignee],
    ...Object.entries(filters.fields).map(([key, value]): [string, string] => [`${FIELD_PREFIX}${key}`, value]),
    ['task', filters.task ?? ''],
  ];
  const search = new URLSearchParams(entries.filter(([, value]) => value !== '')).toString();
  return search === '' ? '' : `?${search}`;
}

export function applyFilters(tasks: readonly TaskItem[], filters: Filters): TaskItem[] {
  const q = filters.q.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (!q || task.id.toLowerCase().includes(q) || task.title.toLowerCase().includes(q)) &&
      (!filters.assignee || task.assignee === filters.assignee) &&
      Object.entries(filters.fields).every(([key, expected]) => {
        if (!expected) return true;
        const actual = task.fields[key];
        return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '') === expected;
      }),
  );
}
