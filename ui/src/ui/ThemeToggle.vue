<script setup lang="ts">
// Состояние и применение темы — в composables/useTheme.ts (initTheme в main.ts, до монтирования).
import { useTheme } from '../composables/useTheme';

const { isDark, toggle } = useTheme();
</script>

<template>
  <button type="button" class="icon-btn" aria-label="Переключить тему" @click="toggle">{{ isDark ? '☾' : '☀' }}</button>
</template>
