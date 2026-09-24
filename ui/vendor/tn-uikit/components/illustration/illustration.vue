<template>
  <component :is="image" class="tn-illustration" />
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";

import type { IllustrationType } from "./illustration.types";
import type { Component } from "vue";

defineOptions({
  name: "TNIllustration"
});

const props = defineProps<{
  name: IllustrationType;
}>();

const illustrationLoaders: Record<IllustrationType, () => Promise<Component>> = {
  lists: () => import("./components/lists.vue"),
  warning: () => import("./components/warning.vue"),
  disconnect: () => import("./components/disconnect.vue"),
  block: () => import("./components/block.vue"),
  dialog: () => import("./components/dialog.vue"),
  user: () => import("./components/user.vue"),
  "time-1": () => import("./components/time-1.vue"),
  reload: () => import("./components/reload.vue"),
  search: () => import("./components/search.vue"),
  document: () => import("./components/document.vue"),
  "dnt-load-image": () => import("./components/dnt-load-image.vue"),
  "plane-table": () => import("./components/plane-table.vue"),
  notification: () => import("./components/notification.vue"),
  "map-illustration": () => import("./components/map-illustration.vue"),
  affiche: () => import("./components/affiche.vue"),
  "map-build": () => import("./components/map-build.vue"),
  robot: () => import("./components/robot.vue"),
  achievement: () => import("./components/achievement.vue"),
  "calendar-progress": () => import("./components/calendar-progress.vue"),
  task: () => import("./components/task.vue"),
  empty: () => import("./components/empty.vue"),
  balloons: () => import("./components/balloons.vue")
};

const image = computed<Component>(() => defineAsyncComponent(illustrationLoaders[props.name]));
</script>

<style lang="css">
.tn-illustration {
  --base: var(--neutral-25);
  --outline: var(--neutral-100);
  --suit: var(--neutral-20);
  --gloves: var(--neutral-45);
  --accent: var(--red-60);
  --star: var(--neutral-100);
}

.tn-dark-theme {
  .tn-illustration {
    --base: var(--neutral-75);
    --outline: var(--neutral-100);
    --suit: var(--neutral-30);
    --gloves: var(--neutral-60);
    --accent: var(--red-65);
    --star: var(--neutral-40);
  }
}
</style>
