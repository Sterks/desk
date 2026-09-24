<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import TaskCard from './TaskCard.vue';

const props = defineProps<{ column: ColumnInfo; tasks: TaskItem[]; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

const limitState = computed(() => {
  const limit = props.column.wip_limit;
  if (limit === null) return undefined;
  if (props.column.count > limit) return 'over';
  if (props.column.count >= limit) return 'full';
  return undefined;
});
const countLabel = computed(() => (props.column.wip_limit === null ? String(props.column.count) : `${props.column.count}/${props.column.wip_limit}`));
</script>

<template>
  <section class="column" :aria-label="column.title" data-drop="idle" :data-limit="limitState">
    <header class="column-head">
      <h2 class="column-title">{{ column.title }}</h2>
      <span class="column-count" :title="column.wip_limit === null ? 'Задач в колонке' : 'Задач / WIP-лимит'">{{ countLabel }}</span>
    </header>
    <p v-if="column.guide" class="column-guide">{{ column.guide }}</p>
    <div class="column-body">
      <p v-if="tasks.length === 0" class="column-empty">пусто</p>
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" :board="board" @open="emit('open', $event)" />
    </div>
  </section>
</template>
