import type { BoardInfo, TaskItem } from '../api/types';
import type { Filters } from '../lib/filters';

export interface FilterBarProps {
  board: BoardInfo;
  tasks: TaskItem[];
  filters: Filters;
  onChange(patch: Partial<Filters>): void;
  onCreate(): void;
}

export function FilterBar({ board, tasks, filters, onChange, onCreate }: FilterBarProps) {
  const assignees = [...new Set(tasks.flatMap((t) => (t.assignee ? [t.assignee] : [])))].sort();
  const enumFields = board.fields.filter((f) => (f.type === 'enum' || f.type === 'multi_enum') && f.values);
  return (
    <form role="search" className="filter-bar" onSubmit={(e) => e.preventDefault()}>
      <input
        type="search"
        className="control filter-search"
        aria-label="Поиск по ID и названию"
        placeholder="Поиск: T-012 или слово из названия"
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
      />
      <select className="control" aria-label="Исполнитель" value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })}>
        <option value="">все исполнители</option>
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      {enumFields.map((f) => (
        <select
          key={f.id}
          className="control"
          aria-label={f.id}
          value={filters.fields[f.id] ?? ''}
          onChange={(e) => onChange({ fields: { ...filters.fields, [f.id]: e.target.value } })}
        >
          <option value="">{f.id}: все</option>
          {f.values?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ))}
      <button type="button" className="button button-primary" onClick={onCreate}>
        Новая задача
      </button>
    </form>
  );
}
