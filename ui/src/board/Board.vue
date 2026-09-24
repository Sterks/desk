<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { groupByColumn } from '../lib/transitions';
import Column from './Column.vue';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[] }>();
const emit = defineEmits<{ open: [id: string] }>();

const byColumn = computed(() => groupByColumn(props.board, props.tasks));
</script>

<template>
  <div class="board">
    <Column
      v-for="column in board.columns"
      :key="column.id"
      :column="column"
      :tasks="byColumn.get(column.id) ?? []"
      :board="board"
      @open="emit('open', $event)"
    />
  </div>
</template>
