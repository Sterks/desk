import type { BoardInfo, TaskList } from '../api/types';
import { orphanTasks } from '../lib/transitions';

export interface BannersProps {
  board: BoardInfo;
  list: TaskList;
  error: string | null;
  onOpen(id: string): void;
}

export function Banners({ board, list, error, onOpen }: BannersProps) {
  const orphans = orphanTasks(board, list.tasks);
  const hasAny = error || list.duplicate_ids.length > 0 || list.invalid_files.length > 0 || orphans.length > 0;
  if (!hasAny) return null;
  return (
    <div className="banners">
      {error && (
        <p className="banner banner-error" role="alert">
          {error}
        </p>
      )}
      {list.duplicate_ids.length > 0 && (
        <p className="banner banner-warn">
          Дубликаты ID: {list.duplicate_ids.map((group) => group.join(' = ')).join('; ')}. Переименуй файлы в .desk/tasks.
        </p>
      )}
      {list.invalid_files.length > 0 && (
        <p className="banner banner-error">
          Не читаются файлы:{' '}
          {list.invalid_files.map((f) => (
            <span key={f.id}>
              <button type="button" onClick={() => onOpen(f.id)}>
                {f.id}
              </button>
              ({f.errors.join('; ')})
            </span>
          ))}
          . Запусти desk validate.
        </p>
      )}
      {orphans.length > 0 && (
        <p className="banner banner-warn">
          Задачи в колонках, которых нет в board.yaml:{' '}
          {orphans.map((task) => (
            <button key={task.id} type="button" onClick={() => onOpen(task.id)}>
              {task.id}
            </button>
          ))}
          . Перенеси их в существующую колонку.
        </p>
      )}
    </div>
  );
}
