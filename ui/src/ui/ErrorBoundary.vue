<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { errorMessage } from '../api/client';

const message = ref<string | null>(null);

onErrorCaptured((error) => {
  // В браузере нет серверного лога: консоль — единственное место для стека компонентов.
  // eslint-disable-next-line no-console
  console.error('desk ui: ошибка отрисовки', error);
  message.value = errorMessage(error);
  return false; // не даём ошибке всплыть дальше — этот компонент её обработал
});

defineExpose({ reset: () => { message.value = null; } });
</script>

<template>
  <slot v-if="message === null" />
  <slot v-else name="fallback" :message="message" />
</template>
