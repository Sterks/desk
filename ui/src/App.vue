<script setup lang="ts">
import { computed, ref } from 'vue';
import { api, errorMessage, type FieldChanges } from './api/client';
import type { TaskItem } from './api/types';
import Board from './board/Board.vue';
import FilterBar from './filters/FilterBar.vue';
import { useBoardData } from './composables/useBoardData';
import { useProject } from './composables/useProject';
import { useUrlFilters } from './composables/useUrlFilters';
import { applyFilters } from './lib/filters';
import { missingForMove } from './lib/transitions';
import CreateTaskDialog from './task-panel/CreateTaskDialog.vue';
import RequiresDialog from './task-panel/RequiresDialog.vue';
import TaskPanel from './task-panel/TaskPanel.vue';
import Banners from './ui/Banners.vue';
import ErrorBoundary from './ui/ErrorBoundary.vue';
import ThemeToggle from './ui/ThemeToggle.vue';

interface Toast {
  id: number;
  text: string;
}

interface PendingMove {
  task: TaskItem;
  to: string;
  missing: string[];
}

const { board, list, error, version, refresh } = useBoardData();
const project = useProject();
const { filters, setFilters } = useUrlFilters();
const creating = ref(false);
const pendingMove = ref<PendingMove | null>(null);
const toasts = ref<Toast[]>([]);
let nextToastId = 1;

function pushToast(text: string): void {
  const id = nextToastId++;
  toasts.value = [...toasts.value, { id, text }];
  window.setTimeout(() => dismissToast(id), 6000);
}
function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function openTask(id: string): void {
  setFilters({ task: id });
}
function closeTask(): void {
  setFilters({ task: null });
}

async function performMove(id: string, to: string, fields: FieldChanges): Promise<void> {
  await api.move(id, to, fields);
  await refresh();
}

// Board.vue (Task 4) is still static and only emits `open` today — Task 8 adds drag-and-drop and
// the matching `move` emit to Board. `handleMove` already has the exact signature TaskPanel's
// column <select> needs (`(task: TaskItem, to: string)`); Task 8 wires the same handler to
// `<Board @move="handleMove">` once that emit exists, unchanged.
function handleMove(task: TaskItem, to: string): void {
  if (!board.value) return;
  const missing = missingForMove(board.value, task, to);
  if (missing.length > 0) {
    pendingMove.value = { task, to, missing };
    return;
  }
  performMove(task.id, to, {}).catch((e: unknown) => pushToast(errorMessage(e)));
}

const visible = computed(() => (list.value ? applyFilters(list.value.tasks, filters.value) : []));
</script>

<template>
  <main v-if="!board || !list" class="app-state">{{ error ?? 'Загрузка доски…' }}</main>
  <div v-else class="app">
    <header class="app-header">
      <div class="app-brand">
        <span class="app-mark" aria-hidden="true">▦</span>
        <h1>{{ board.name }}</h1>
        <span v-if="project" class="app-project">{{ project.name }}</span>
      </div>
      <FilterBar :board="board" :tasks="list.tasks" :filters="filters" @change="setFilters" @create="creating = true" />
      <ThemeToggle />
    </header>
    <Banners :board="board" :list="list" :error="error" @open="openTask" />
    <main class="app-main">
      <Board :board="board" :tasks="visible" @open="openTask" />
    </main>
    <ErrorBoundary v-if="filters.task" :key="filters.task">
      <TaskPanel :board="board" :task-id="filters.task" :version="version" @close="closeTask" @error="pushToast" @move="handleMove" />
      <template #fallback="{ message }">
        <div class="panel-backdrop" @mousedown="closeTask" />
        <aside class="panel" role="dialog" aria-modal="true" :aria-label="filters.task ?? ''">
          <header class="panel-head">
            <span class="panel-id">{{ filters.task }}</span>
            <button type="button" class="button panel-close" aria-label="Закрыть панель" @click="closeTask">Esc</button>
          </header>
          <div class="panel-body">
            <p class="banner banner-error" role="alert">Панель задачи не отрисовалась: {{ message }}</p>
          </div>
        </aside>
      </template>
    </ErrorBoundary>
    <CreateTaskDialog
      v-if="creating"
      :board="board"
      @close="creating = false"
      @created="(task) => { creating = false; void refresh(); openTask(task.id); }"
    />
    <RequiresDialog
      v-if="pendingMove"
      :board="board"
      :task="pendingMove.task"
      :to="pendingMove.to"
      :missing="pendingMove.missing"
      :on-submit="async (fields) => { await performMove(pendingMove!.task.id, pendingMove!.to, fields); pendingMove = null; }"
      @cancel="pendingMove = null"
    />
    <div class="toasts" role="status" aria-live="polite" aria-label="Уведомления">
      <div v-for="t in toasts" :key="t.id" class="toast" data-kind="error">
        <span>{{ t.text }}</span>
        <button type="button" aria-label="Закрыть уведомление" @click="dismissToast(t.id)">×</button>
      </div>
    </div>
  </div>
</template>
