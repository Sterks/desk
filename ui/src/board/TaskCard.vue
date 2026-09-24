<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityTone } from '../lib/priority';

const props = defineProps<{ task: TaskItem; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

const tone = computed(() => priorityTone(props.board, props.task.fields.priority));
const priority = computed(() => (typeof props.task.fields.priority === 'string' ? props.task.fields.priority : null));
const showAgent = computed(() => props.task.agent && props.task.agent !== props.task.assignee);
const time = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(
    new Date(props.task.created_at),
  ),
);
</script>

<template>
  <article
    class="card"
    :data-testid="`card-${task.id}`"
    :data-invalid="task.invalid || undefined"
  >
    <header class="card-head">
      <span v-if="priority" class="priority-pill" :class="`priority-${priority}`">{{ priority }}</span>
      <time class="card-time" :datetime="task.created_at">{{ time }}</time>
    </header>
    <button type="button" class="card-title" @click="emit('open', task.id)">{{ task.title }}</button>
    <span v-if="showAgent" class="card-agent" title="Тип сабагента">{{ task.agent }}</span>
    <span v-if="task.invalid" class="card-flag" :title="task.errors.join('\n')">ошибка схемы</span>
    <footer class="card-meta">
      <span v-if="task.assignee" class="assignee" :style="{ '--agent-color': agentColor(task.assignee) }">{{ task.assignee }}</span>
    </footer>
  </article>
</template>
