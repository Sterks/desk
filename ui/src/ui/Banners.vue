<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskList } from '../api/types';
import { orphanTasks } from '../lib/transitions';

const props = defineProps<{ board: BoardInfo; list: TaskList; error: string | null }>();
const emit = defineEmits<{ open: [id: string] }>();

const orphans = computed(() => orphanTasks(props.board, props.list.tasks));
const hasAny = computed(() => Boolean(props.error) || props.list.duplicate_ids.length > 0 || props.list.invalid_files.length > 0 || orphans.value.length > 0);
</script>

<template>
  <div v-if="hasAny" class="banners">
    <p v-if="error" class="banner banner-error" role="alert">{{ error }}</p>
    <p v-if="list.duplicate_ids.length > 0" class="banner banner-warn">
      Дубликаты ID: {{ list.duplicate_ids.map((group) => group.join(' = ')).join('; ') }}. Переименуй файлы в .desk/tasks.
    </p>
    <p v-if="list.invalid_files.length > 0" class="banner banner-error">
      Не читаются файлы:
      <span v-for="f in list.invalid_files" :key="f.id">
        <button type="button" @click="emit('open', f.id)">{{ f.id }}</button>({{ f.errors.join('; ') }})
      </span>
      . Запусти desk validate.
    </p>
    <p v-if="orphans.length > 0" class="banner banner-warn">
      Задачи в колонках, которых нет в board.yaml:
      <button v-for="task in orphans" :key="task.id" type="button" @click="emit('open', task.id)">{{ task.id }}</button>
      . Перенеси их в существующую колонку.
    </p>
  </div>
</template>
