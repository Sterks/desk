<template>
  <div v-if="buttons?.length" class="tn-floating-buttons" :class="classes" :style="styles">
    <TNButton v-for="(button, key) in adaptedButtons" :key="key" class="tn-floating-button" v-bind="button.props" @click="button.click">
      {{ button.title }}
    </TNButton>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { StyleValue } from "vue";
import TNButton from "../button/button.vue";
import type { ITNFloatingButton, ITNFloatingPosition } from "./floating-buttons.types";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { useLibraryOptions } from "../../composables/library-options";

defineOptions({
  name: "TNFloatingButtons"
});

const props = withDefaults(
  defineProps<{
    /** Массив с кнопками **/
    buttons: ITNFloatingButton[];
    /** Добавить тень родительскому контейнеру с кнопками **/
    addShadow?: boolean;
    /** Максимальная ширина мобильного разрешения в пикселях **/
    maxMobileWidth?: number;
    /** Расположение кнопок - вертикально/горизонтально **/
    position?: ITNFloatingPosition;
    /** Радиус скругления углов в пикселях **/
    borderRadius?: `${number}` | number;
    /** Отключение кнопок **/
    disabled?: boolean;
  }>(),
  {
    position: "horizontal",
    borderRadius: 16
  }
);

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(props?.maxMobileWidth ?? mobileBreakPoint ?? 0);

const styles = computed<StyleValue>(() => {
  const borderRadius = props.borderRadius + "px";
  const styles: StyleValue = {};

  if (isMobile.value) {
    styles.padding = "12px 16px 16px";
  } else {
    styles.borderRadius = `0 0 ${borderRadius} ${borderRadius}`;
  }

  return styles;
});

const classes = computed<string[]>(() => {
  const list: string[] = [];

  if (isMobile.value) {
    list.push("tn-floating-buttons_mobile");
  }

  if (props.addShadow) {
    list.push("tn-floating-buttons_shadow");
  }

  list.push(`tn-floating-buttons_${calculatedPosition.value}`);

  return list;
});

const adaptedButtons = computed<ITNFloatingButton[]>(() =>
  props.buttons.map((button, index, array) => ({
    ...button,
    props: {
      ...button.props,
      size: button.props?.size || "lg",
      block: button.props?.block ?? true,
      type: button.props?.type ?? (array.length === 2 && !index ? "outline" : "action"),
      disabled: props.disabled || button.props?.disabled
    }
  }))
);

const calculatedPosition = computed<ITNFloatingPosition>(() => {
  if (typeof props.position === "string") {
    return props.position;
  }

  if (typeof props.position === "object" && isMobile.value) {
    return props.position.mobile || "horizontal";
  } else {
    return props.position.desktop || "horizontal";
  }
});
</script>

<style>
.tn-floating-buttons {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px 24px;
  gap: 16px;
  background-color: var(--background-primary-a-enabled);
}

.tn-floating-buttons_vertical {
  flex-direction: column;
}

.tn-floating-buttons_horizontal {
  flex-direction: row;
}

.tn-floating-buttons_shadow {
  box-shadow: var(--shadow-large);
}

.tn-floating-buttons_mobile {
  gap: 12px;
}
</style>
