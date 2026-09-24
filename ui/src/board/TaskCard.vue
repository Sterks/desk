<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityClass, priorityTone } from '../lib/priority';

const props = defineProps<{ task: TaskItem; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

// Цвет пилюли — по позиции значения в values поля priority из board.yaml, не по его имени (spec §6).
const toneClass = computed(() => priorityClass(priorityTone(props.board, props.task.fields.priority)));
const priority = computed(() => (typeof props.task.fields.priority === 'string' ? props.task.fields.priority : null));
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
    role="group"
    aria-roledescription="карточка задачи"
    :aria-label="`${task.id}: ${task.title}`"
    :data-testid="`card-${task.id}`"
    :data-task-id="task.id"
    :data-invalid="task.invalid || undefined"
  >
    <header class="card-head">
      <span v-if="priority" class="priority-pill" :class="toneClass">{{ priority }}</span>
      <time class="card-time" :datetime="task.created_at">{{ time }}</time>
    </header>
    <button type="button" class="card-title" @click="emit('open', task.id)">{{ task.title }}</button>
    <span v-if="showAgent" class="card-agent" title="Тип сабагента">{{ task.agent }}</span>
    <span v-if="task.invalid" class="card-flag" :title="task.errors.join('\n')">ошибка схемы</span>
    <footer class="card-meta">
      <span v-if="task.assignee" class="assignee" :style="{ '--agent-color': agentColor(task.assignee) }">{{ task.assignee }}</span>
    </footer>
  </div>
</template>
