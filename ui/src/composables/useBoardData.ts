import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskList } from '../api/types';

const EVENT_TYPES = ['task_changed', 'task_removed', 'board_changed'] as const;

export interface BoardData {
  board: Ref<BoardInfo | null>;
  list: Ref<TaskList | null>;
  error: Ref<string | null>;
  /** Растёт на каждом успешном обновлении: открытые панели по нему перечитывают задачу. */
  version: Ref<number>;
  refresh(): Promise<void>;
}

export function useBoardData(): BoardData {
  const board = ref<BoardInfo | null>(null);
  const list = ref<TaskList | null>(null);
  const error = ref<string | null>(null);
  const version = ref(0);

  const refresh = async (): Promise<void> => {
    try {
      const [nextBoard, nextList] = await Promise.all([api.board(), api.tasks()]);
      board.value = nextBoard;
      list.value = nextList;
      error.value = null;
      version.value += 1;
    } catch (e) {
      error.value = errorMessage(e);
    }
  };

  let source: EventSource | undefined;

  onMounted(() => {
    void refresh();
    source = new EventSource('/api/events');
    const onChange = (): void => void refresh();
    EVENT_TYPES.forEach((type) => source?.addEventListener(type, onChange));
    source.onopen = onChange;
    source.onerror = () => {
      error.value = 'Нет связи с desk ui. Переподключение…';
    };
  });

  onUnmounted(() => {
    source?.close();
  });

  return { board, list, error, version, refresh };
}
