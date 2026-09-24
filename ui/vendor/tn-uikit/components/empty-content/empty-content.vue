<template>
  <div :class="['tn-empty-content', `tn-empty-content__${type}`]">
    <slot name="icon">
      <component :is="iconImage" class="tn-empty-content__icon" />
    </slot>
    <h3 v-if="title" class="tn-empty-content__title" v-html="title"></h3>
    <p v-if="text" class="tn-empty-content__text" v-html="text"></p>
    <div v-if="buttons.length || $slots.buttons" class="tn-empty-content__button-wrapper">
      <slot name="buttons">
        <TNButton
          v-for="(button, index) in buttons"
          :key="index"
          class="tn-empty-content__button"
          v-bind="button?.props"
          @click="executeAction($event, button)"
        >
          {{ button.title }}
        </TNButton>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import TNButton from "../button/button.vue";
import type { ITNFloatingButton } from "../floating-buttons/floating-buttons.types";
import { type Component, computed, defineAsyncComponent, VNode } from "vue";
import { EmptyContentIcon } from "./empty-content.types";

defineOptions({
  name: "TNEmptyContent"
});

const props = withDefaults(
  defineProps<{
    /** Тип оформления компонента (перекрашивается background контейнера) **/
    type?: "light" | "neutral" | "transparent";
    /** Используемая иконка **/
    icon?: EmptyContentIcon;
    /** Заглавный текст **/
    title?: string;
    /** Уточняющий текст **/
    text?: string;
    /** Массив кнопок **/
    buttons?: ITNFloatingButton[];
  }>(),
  {
    type: "transparent",
    icon: "empty-alert",
    buttons: () => []
  }
);

defineSlots<{
  /** Слот для кастом иконки **/
  icon?: () => VNode[];
  /** Слот для кастом кнопок **/
  buttons?: () => VNode[];
}>();

const executeAction = (event: MouseEvent, button: ITNFloatingButton) => {
  if (button.click) {
    button.click(event);
  }
};

const iconImageLoaders: Record<EmptyContentIcon, () => Promise<Component>> = {
  "empty-list": () => import("./components/empty-content-empty-list.icon.vue"),
  "empty-alert": () => import("./components/empty-content-empty-alert.icon.vue"),
  "empty-chat": () => import("./components/empty-content-empty-chat.icon.vue"),
  "no-connection": () => import("./components/empty-content-no-connection.icon.vue"),
  "not-found": () => import("./components/empty-content-not-found.icon.vue"),
  "no-access": () => import("./components/empty-content-no-access.icon.vue")
};

const iconImage = computed(() =>
  defineAsyncComponent({
    loader: iconImageLoaders[props.icon]
  })
);
</script>

<style>
.tn-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 16px;
  --base-layer: var(--neutral-20);
  --first-layer: var(--neutral-5);
  --second-layer: var(--neutral-10);
  --third-layer: var(--neutral-20);
  --fourth-layer: var(--neutral-25);
}

.tn-empty-content__light {
  background-color: var(--content-primary-b-enabled);
}

.tn-empty-content__neutral {
  background-color: var(--background-secondary-a-enabled);
}

.tn-empty-content__icon {
  border-radius: 50%;
  color: var(--background-secondary-a-pressed);
}

.tn-empty-content__icon:not(:last-child) {
  margin-bottom: 24px;
}

.tn-empty-content__title {
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-headline-small);
  line-height: var(--font-lineHeight-headline-small);
  margin: 0 0 8px 0;
  color: var(--content-secondary-enabled);
  text-align: center;
}

.tn-empty-content__text {
  font-weight: var(--font-weight-text);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  text-align: center;
  color: var(--content-secondary-enabled);
}

.tn-empty-content__button-wrapper {
  display: flex;
  flex-direction: column;
  margin: 24px 0 0 0;
}

.tn-empty-content__button:not(:first-child) {
  margin: 12px 0 0 0;
}

.tn-dark-theme {
  .tn-empty-content {
    --base-layer: var(--neutral-90);
    --first-layer: var(--neutral-75);
    --second-layer: var(--neutral-70);
    --third-layer: var(--neutral-60);
    --fourth-layer: var(--neutral-55);
  }
}
</style>
