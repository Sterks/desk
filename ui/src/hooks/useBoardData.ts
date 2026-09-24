import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskList } from '../api/types';

const EVENT_TYPES = ['task_changed', 'task_removed', 'board_changed'] as const;

export interface BoardData {
  board: BoardInfo | null;
  list: TaskList | null;
  error: string | null;
  /** Растёт на каждом успешном обновлении: открытые панели по нему перечитывают задачу. */
  version: number;
  refresh(): Promise<void>;
}

export function useBoardData(): BoardData {
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [list, setList] = useState<TaskList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [nextBoard, nextList] = await Promise.all([api.board(), api.tasks()]);
      setBoard(nextBoard);
      setList(nextList);
      setError(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const source = new EventSource('/api/events');
    const onChange = (): void => void refresh();
    EVENT_TYPES.forEach((type) => source.addEventListener(type, onChange));
    source.onopen = onChange;
    source.onerror = () => setError('Нет связи с desk ui. Переподключение…');
    return () => source.close();
  }, [refresh]);

  return { board, list, error, version, refresh };
}
