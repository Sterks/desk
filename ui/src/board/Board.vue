<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { allowedTargets, groupByColumn } from '../lib/transitions';
import Column from './Column.vue';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[] }>();
const emit = defineEmits<{ open: [id: string]; move: [task: TaskItem, to: string] }>();

interface Drag {
  from: string;
  task: TaskItem | null;
}

const byColumn = computed(() => groupByColumn(props.board, props.tasks));
const boardEl = ref<HTMLElement | null>(null);
const drag = ref<Drag | null>(null);
const overColumn = ref<string | null>(null);

/*
 * Цель переноса — колонка под указателем в момент отпускания, а не список, где SortableJS оставил
 * плейсхолдер. Иначе перенос Backlog → Done (запрещён) через соседнюю разрешённую In progress
 * отпускался бы «в In progress»: onMove не пускает плейсхолдер в Done, и он остаётся в последнем
 * разрешённом списке. Так же решала React-версия (pointerWithin в @dnd-kit). Колонка — вертикальная
 * полоса: отпускание ниже короткой колонки, но в её полосе, тоже считается броском в неё.
 */
function columnAt(x: number, y: number): string | null {
  const sections = boardEl.value?.querySelectorAll<HTMLElement>('[data-column-id]') ?? [];
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top) return section.dataset.columnId ?? null;
  }
  return null;
}

// Во время нативного HTML5-перетаскивания mouse/pointermove не приходят — только dragover; в режиме
// fallback SortableJS (тач) наоборот. Слушаем все, в фазе capture, чтобы SortableJS их не погасил.
const POINTER_EVENTS = ['dragover', 'pointermove', 'mousemove', 'touchmove'] as const;

function track(e: Event): void {
  // Не `instanceof TouchEvent`: в десктопных Firefox/Safari такого конструктора нет вовсе.
  const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
  if (!point) return;
  const column = columnAt(point.clientX, point.clientY);
  if (column !== overColumn.value) overColumn.value = column;
}

function listen(on: boolean): void {
  for (const type of POINTER_EVENTS) {
    if (on) document.addEventListener(type, track, { capture: true, passive: true });
    else document.removeEventListener(type, track, { capture: true });
  }
}

function startDrag(from: string, taskId: string | undefined): void {
  drag.value = { from, task: props.tasks.find((t) => t.id === taskId) ?? null };
  overColumn.value = from;
  listen(true);
}

function endDrag(): void {
  const current = drag.value;
  const target = overColumn.value;
  listen(false);
  // Сброс drag → null размораживает зеркала колонок: они возвращаются к props.tasks (см. Column.vue).
  drag.value = null;
  overColumn.value = null;
  if (!current?.task || !target || target === current.from) return;
  if (!allowedTargets(props.board, current.from).includes(target)) return;
  emit('move', current.task, target);
}

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
