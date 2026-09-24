<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import type { DragEndEventLike } from '../lib/drag';
import { allowedTargets } from '../lib/transitions';
import TaskCard from './TaskCard.vue';

export type DropState = 'idle' | 'origin' | 'allowed' | 'blocked' | 'over';

const props = defineProps<{
  column: ColumnInfo;
  tasks: TaskItem[];
  board: BoardInfo;
  /** Колонка, из которой сейчас тащат карточку (null — перетаскивания нет). Владеет Board.vue. */
  draggedFrom: string | null;
  /** Колонка под указателем во время перетаскивания — для состояния 'over'. */
  overColumn: string | null;
}>();
/** dragStart несёт колонку-источник всегда (даже если задачу по id не нашли): Board.vue по ней
 *  замораживает зеркала на время жеста и обязан получить парный dragEnd, чтобы их сбросить. */
const emit = defineEmits<{
  open: [id: string];
  dragStart: [from: string, taskId: string | undefined];
  /** originalEvent жеста: по нему Board.vue отличает бросок от отмены (Escape, вне окна, touchcancel). */
  dragEnd: [originalEvent: DragEndEventLike | undefined];
}>();

/*
 * Зеркало props.tasks, к которому привязан v-model VueDraggable. SortableJS оптимистичен: при
 * переносе между списками vue-draggable-plus сам возвращает DOM-узел на место (чтобы vdom Vue не
 * разошёлся с DOM) и пишет изменение в массив через update:modelValue. Писать ему нужно куда-то
 * своё, не в props. Но это зеркало — только «черновик жеста»: пока идёт перетаскивание, внешние
 * обновления (SSE) в него не пишутся (иначе Vue перерисует список под руками у SortableJS), а в
 * конце жеста (draggedFrom → null) оно безусловно сбрасывается к props.tasks. Карточка поэтому
 * визуально переезжает только тогда, когда сервер принял перенос и refresh() обновил props.tasks, —
 * ровно как в React-версии, где @dnd-kit вообще не трогал массивы. Отмена окна requires и отказ
 * сервера ничего не «откатывают»: откатывать нечего.
 */
const mirror = ref<TaskItem[]>([...props.tasks]);
watch(
  [() => props.tasks, () => props.draggedFrom],
  ([tasks, draggedFrom]) => {
    if (draggedFrom === null) mirror.value = [...tasks];
  },
);

const dropState = computed<DropState>(() => {
  const from = props.draggedFrom;
  if (from === null) return 'idle';
  if (from === props.column.id) return 'origin';
  if (!allowedTargets(props.board, from).includes(props.column.id)) return 'blocked';
  return props.overColumn === props.column.id ? 'over' : 'allowed';
});

const limitState = computed(() => {
  const limit = props.column.wip_limit;
  if (limit === null) return undefined;
  if (props.column.count > limit) return 'over';
  if (props.column.count >= limit) return 'full';
  return undefined;
});
const countLabel = computed(() => (props.column.wip_limit === null ? String(props.column.count) : `${props.column.count}/${props.column.wip_limit}`));

function columnIdOf(el: HTMLElement | undefined): string | undefined {
  return el?.closest<HTMLElement>('[data-column-id]')?.dataset.columnId;
}

/*
 * SortableJS вызывает onMove из опций ИСХОДНОГО списка (Sortable._onMove берёт rootEl[expando].options),
 * поэтому здесь props.column — колонка-источник, а цель — evt.to. Возврат false синхронно запрещает
 * вставку плейсхолдера в запрещённую колонку: карточка там даже не появляется.
 */
function onMove(evt: { to: HTMLElement }): boolean {
  const to = columnIdOf(evt.to);
  if (!to || to === props.column.id) return true;
  return allowedTargets(props.board, props.column.id).includes(to);
}

function onStart(evt: SortableEvent): void {
  emit('dragStart', props.column.id, evt.item.dataset.taskId);
}

function onEnd(evt: SortableEvent): void {
  // originalEvent SortableJS кладёт в каждое событие (_dispatchEvent), но @types/sortablejs его не описывает.
  emit('dragEnd', (evt as SortableEvent & { originalEvent?: DragEndEventLike }).originalEvent);
}

</script>

<template>
  <section
    class="column"
    :aria-label="column.title"
    :data-column-id="column.id"
    :data-drop="dropState"
    :data-limit="limitState"
  >
    <header class="column-head">
      <h2 class="column-title">{{ column.title }}</h2>
      <span class="column-count" :title="column.wip_limit === null ? 'Задач в колонке' : 'Задач / WIP-лимит'">{{ countLabel }}</span>
    </header>
    <p v-if="column.guide" class="column-guide">{{ column.guide }}</p>
    <div class="column-body">
      <p v-if="mirror.length === 0" class="column-empty">пусто</p>
      <!-- Внутри списка — только карточки: vue-draggable-plus восстанавливает DOM по индексу среди
           element-детей (parent.children[oldIndex]), любой посторонний элемент сдвинул бы индексы. -->
      <VueDraggable
        v-model="mirror"
        class="column-list"
        group="board"
        draggable=".card"
        ghost-class="card-ghost"
        chosen-class="card-chosen"
        :sort="false"
        :animation="150"
        :on-move="onMove"
        @start="onStart"
        @end="onEnd"
      >
        <TaskCard v-for="task in mirror" :key="task.id" :task="task" :board="board" @open="emit('open', $event)" />
      </VueDraggable>
    </div>
  </section>
</template>
