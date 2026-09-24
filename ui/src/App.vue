<script setup lang="ts">
import Board from './board/Board.vue';
import Banners from './ui/Banners.vue';
import { useBoardData } from './composables/useBoardData';

const { board, list, error } = useBoardData();
const noop = (): void => undefined;
</script>

<template>
  <main v-if="!board || !list" class="app-state">{{ error ?? 'Загрузка доски…' }}</main>
  <div v-else class="app">
    <Banners :board="board" :list="list" :error="error" @open="noop" />
    <main class="app-main">
      <Board :board="board" :tasks="list.tasks" @open="noop" />
    </main>
  </div>
</template>
