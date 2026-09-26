<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityClass, priorityTone } from '../lib/priority';

const props = defineProps<{ task: TaskItem; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

const copied = ref(false);
let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

async function copyId(event: MouseEvent) {
  event.stopPropagation();
  await navigator.clipboard.writeText(props.task.id);
  copied.value = true;
  clearTimeout(copiedTimeout);
  copiedTimeout = setTimeout(() => (copied.value = false), 1200);
}

// Цвет пилюли — по позиции значения в values поля priority из board.yaml, не по его имени (spec §6).
const toneClass = computed(() => priorityClass(priorityTone(props.board, props.task.fields.priority)));
const priority = computed(() => (typeof props.task.fields.priority === 'string' ? props.task.fields.priority : null));
// Поле parent (task_ref) — соглашение проекта для подзадач, не встроенная в board.yaml сущность:
// если оно есть, карточка визуально отличается от корневых (см. .card--child) и ссылается на родителя.
const parentId = computed(() => (typeof props.task.fields.parent === 'string' ? props.task.fields.parent : null));

function openParent(event: MouseEvent): void {
  event.stopPropagation();
  if (parentId.value) emit('open', parentId.value);
}
const showAgent = computed(() => props.task.agent && props.task.agent !== props.task.assignee);
const time = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(
    new Date(props.task.created_at),
  ),
);
</script>

<template>
  <!-- Сам <div> — перетаскиваемый элемент SortableJS (прямой потомок списка VueDraggable,
       обёртки нет): data-task-id читает Column.vue в onStart. role="group", а не button: внутри
       есть кнопка названия. aria-roledescription — «карточка задачи», а не «перетаскиваемая
       задача», как было при @dnd-kit: у SortableJS нет перетаскивания с клавиатуры, и обещать его
       скринридеру нельзя. Перенос без мыши — поле «Колонка» в панели задачи. <div>, а не <article>:
       axe (aria-allowed-role) не разрешает role="group" на <article>; так же было в React-версии. -->
  <div
    class="card"
    :class="{ 'card--child': parentId }"
    role="group"
    aria-roledescription="карточка задачи"
    :aria-label="`${task.id}: ${task.title}`"
    :data-testid="`card-${task.id}`"
    :data-task-id="task.id"
    :data-invalid="task.invalid || undefined"
  >
    <header class="card-head">
      <span class="card-head-left">
        <span class="card-id">{{ task.id }}</span>
        <button
          type="button"
          class="card-copy-id"
          :class="{ 'card-copy-id--done': copied }"
          :title="copied ? 'Скопировано' : 'Скопировать ID'"
          :aria-label="copied ? 'Скопировано' : 'Скопировать ID задачи'"
          @click="copyId"
        >
          <svg v-if="!copied" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M3 10.5V3.5A1.5 1.5 0 0 1 4.5 2H10" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <svg v-else viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M3 8.5 6.2 12 13 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <span v-if="priority" class="priority-pill" :class="toneClass">{{ priority }}</span>
      </span>
      <time class="card-time" :datetime="task.created_at">{{ time }}</time>
    </header>
    <button v-if="parentId" type="button" class="card-parent" :title="`Родительская задача: ${parentId}`" @click="openParent">
      <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
        <path d="M4 2v6a2 2 0 0 0 2 2h6M9 7l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ parentId }}
    </button>
    <button type="button" class="card-title" @click="emit('open', task.id)">{{ task.title }}</button>
    <span v-if="showAgent" class="card-agent" title="Тип сабагента">{{ task.agent }}</span>
    <span v-if="task.invalid" class="card-flag" :title="task.errors.join('\n')">ошибка схемы</span>
    <footer class="card-meta">
      <span v-if="task.assignee" class="assignee" :style="{ '--agent-color': agentColor(task.assignee) }">{{ task.assignee }}</span>
    </footer>
  </div>
</template>
