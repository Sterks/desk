<script setup lang="ts">
// The actual component mounted by main.ts. `createApp` takes a single root component, not JSX
// children, so the whole-app crash boundary that the React version wired at `main.tsx`'s render
// call (`<ErrorBoundary><App/></ErrorBoundary>`) has to live in its own component here instead of
// inside App.vue itself — this is that component.
import App from './App.vue';
import ErrorBoundary from './ui/ErrorBoundary.vue';

// Не reload(): падение, вызванное текущим URL (?task=…, фильтр), повторялось бы при каждой
// перезагрузке. Путь без query даёт чистую попытку — так же было в React-версии.
function reloadBoard(): void {
  window.location.assign(window.location.pathname);
}
</script>

<template>
  <ErrorBoundary>
    <App />
    <template #fallback="{ message }">
      <main class="app-state">
        <div role="alert">
          <p>Интерфейс desk не отрисовался: {{ message }}</p>
          <button type="button" class="button" @click="reloadBoard">Перезагрузить доску</button>
        </div>
      </main>
    </template>
  </ErrorBoundary>
</template>
