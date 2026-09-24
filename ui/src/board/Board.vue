<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { columnAtPoint, resolveDragEnd, type DragEndEventLike, type Lane } from '../lib/drag';
import { allowedTargets, groupByColumn } from '../lib/transitions';
import Column from './Column.vue';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[] }>();
const emit = defineEmits<{ open: [id: string]; move: [task: TaskItem, to: string] }>();

interface Drag {
  from: string;
  /** Только id: задачу перечитываем из props.tasks в момент броска — SSE мог обновить её поля
   *  посреди жеста, и missingForMove в App.vue должен видеть свежую версию. */
  taskId: string | undefined;
}

const byColumn = computed(() => groupByColumn(props.board, props.tasks));
const boardEl = ref<HTMLElement | null>(null);
const drag = ref<Drag | null>(null);
const overColumn = ref<string | null>(null);

function lanes(): Lane[] {
  const sections = boardEl.value?.querySelectorAll<HTMLElement>('[data-column-id]') ?? [];
  return Array.from(sections, (section) => {
    const rect = section.getBoundingClientRect();
    return { id: section.dataset.columnId ?? '', left: rect.left, right: rect.right, top: rect.top };
  });
}

/*
 * Цель переноса — колонка под указателем в момент отпускания (lib/drag.ts), а не список, где
 * SortableJS оставил плейсхолдер. Иначе перенос Backlog → Done (запрещён) через соседнюю
 * разрешённую In progress отпускался бы «в In progress»: onMove не пускает плейсхолдер в Done, и он
 * остаётся в последнем разрешённом списке. overColumn нужен для подсветки 'over' и как запасной
 * вариант, если у события броска нет координат.
 *
 * Во время нативного HTML5-перетаскивания mouse/pointermove не приходят — только dragover; в режиме
 * fallback SortableJS (тач) наоборот. Слушаем все, в фазе capture, чтобы SortableJS их не погасил.
 */
const POINTER_EVENTS = ['dragover', 'pointermove', 'mousemove', 'touchmove'] as const;

function setOver(column: string | null): void {
  if (column !== overColumn.value) overColumn.value = column;
}

function track(e: Event): void {
  // Не `instanceof TouchEvent`: в десктопных Firefox/Safari такого конструктора нет вовсе.
  const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
  if (point) setOver(columnAtPoint(lanes(), point.clientX, point.clientY));
}

/** Указатель ушёл за пределы окна: подсветку снимаем (relatedTarget === null только в этом случае). */
function trackLeave(e: Event): void {
  if ((e as DragEvent).relatedTarget === null) setOver(null);
}

function listen(on: boolean): void {
  for (const type of POINTER_EVENTS) {
    if (on) document.addEventListener(type, track, { capture: true, passive: true });
    else document.removeEventListener(type, track, { capture: true });
  }
  if (on) document.addEventListener('dragleave', trackLeave, { capture: true, passive: true });
  else document.removeEventListener('dragleave', trackLeave, { capture: true });
}

function startDrag(from: string, taskId: string | undefined): void {
  drag.value = { from, taskId };
  overColumn.value = from;
  listen(true);
}

/** Снимает состояние жеста. Сброс drag → null размораживает зеркала колонок (см. Column.vue). */
function resetDrag(): void {
  listen(false);
  drag.value = null;
  overColumn.value = null;
}

function targetOf(originalEvent: DragEndEventLike | undefined): string | null {
  const end = resolveDragEnd(originalEvent);
  if (end.kind === 'cancel') return null;
  return end.kind === 'point' ? columnAtPoint(lanes(), end.x, end.y) : overColumn.value;
}

function endDrag(originalEvent: DragEndEventLike | undefined): void {
  const current = drag.value;
  const target = targetOf(originalEvent);
  resetDrag();
  if (!current || !target || target === current.from) return;
  if (!allowedTargets(props.board, current.from).includes(target)) return;
  const task = props.tasks.find((t) => t.id === current.taskId);
  if (task && task.column === current.from) emit('move', task, target);
}

// SSE убрал колонку-источник посреди жеста: её Sortable уничтожается (destroy() → _onDrop() без
// события), `end` не придёт никогда — без этого зеркала всех колонок остались бы замороженными.
watch(
  () => props.board.columns,
  (columns) => {
    const from = drag.value?.from;
    if (from !== undefined && !columns.some((c) => c.id === from)) resetDrag();
  },
);

onBeforeUnmount(() => listen(false));
</script>

<template>
  <div ref="boardEl" class="board">
    <Column
      v-for="column in board.columns"
      :key="column.id"
      :column="column"
      :tasks="byColumn.get(column.id) ?? []"
      :board="board"
      :dragged-from="drag?.from ?? null"
      :over-column="overColumn"
      @open="emit('open', $event)"
      @drag-start="startDrag"
      @drag-end="endDrag"
    />
  </div>
</template>
