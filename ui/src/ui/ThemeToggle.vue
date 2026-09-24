<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const STORAGE_KEY = 'desk-theme';
type ThemeOverride = 'light' | 'dark' | null;

function readOverride(): ThemeOverride {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

function apply(isDark: boolean): void {
  document.documentElement.classList.toggle('tn-dark-theme', isDark);
}

const override = ref<ThemeOverride>(readOverride());
const media = window.matchMedia('(prefers-color-scheme: dark)');

function sync(): void {
  apply(override.value === null ? media.matches : override.value === 'dark');
}

function onMediaChange(): void {
  if (override.value === null) sync();
}

onMounted(() => {
  sync();
  media.addEventListener('change', onMediaChange);
});
onUnmounted(() => media.removeEventListener('change', onMediaChange));

function toggle(): void {
  const currentlyDark = override.value === null ? media.matches : override.value === 'dark';
  override.value = currentlyDark ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, override.value);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тема переключается только на эту сессию.
  }
  sync();
}

const isDark = computed(() => (override.value === null ? media.matches : override.value === 'dark'));
</script>

<template>
  <button type="button" class="icon-btn" aria-label="Переключить тему" @click="toggle">{{ isDark ? '☾' : '☀' }}</button>
</template>
