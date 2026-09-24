<template>
  <KeepAlive>
    <OverlayScrollbarsComponent
      v-if="!disabled || !freezeOnDisable"
      ref="root"
      :class="{ 'tn-scroll_offset': offset, 'tn-scroll_disabled': disabled }"
      :options="options"
      class="tn-scroll"
      defer
      @keydown="handleScroll"
      @os-initialized="osInitialized"
      @os-scroll="emitScroll"
      @touchmove="handleScroll"
      @wheel="handleScroll"
    >
      <slot></slot>
    </OverlayScrollbarsComponent>
    <div v-else ref="disabledRoot" class="tn-scroll tn-scroll_freeze" :class="{ 'tn-scroll_offset': offset }">
      <div :class="containerClass" data-overlayscrollbars-contents>
        <slot></slot>
      </div>
    </div>
  </KeepAlive>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, VNode, watch } from "vue";
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

import { setScrollbarsOptions } from "../../helpers";
import type { ITNScrollOptions } from "./scroll.types";

import type { OverlayScrollbars, ScrollbarsAutoHideBehavior } from "overlayscrollbars";

defineOptions({
  name: "TNScroll"
});

const props = withDefaults(
  defineProps<{
    /** Отключение скролла **/
    disabled?: boolean;
    /** Отключение компонента OverlayScrollbars при отключении скролла **/
    freezeOnDisable?: boolean;
    /** Отображение отступа скролбара от края **/
    offset?: boolean;
    /** Параметр скрытия скроллбаров **/
    autoHide?: boolean | ScrollbarsAutoHideBehavior;
    /** Задержка авто-скрытия скроллбаров **/
    autoHideDelay?: `${string}` | number;
    /** Класс для контейнера скролла **/
    containerClass?: string | string[];
  }>(),
  {
    offset: true
  }
);

const emit = defineEmits<{
  /** Событие вызывается при скролле **/
  (e: "scroll", event: Event): void;
  /** Событие вызывается при инициализации компонента OverlayScrollbars **/
  (e: "init"): void;
}>();

defineSlots<{
  /** Слот для контента	 **/
  default?: VNode[];
}>();

const root = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);
const disabledRoot = ref<HTMLElement | null>(null);

let scrollYPosition = 0;
let scrollXPosition = 0;

onMounted(() => {
  setClassesList();
});

const options = computed(() =>
  setScrollbarsOptions({
    ...props,
    autoHideDelay: props.autoHideDelay || props.autoHideDelay === 0 ? Number(props.autoHideDelay) : undefined
  } as ITNScrollOptions)
);

watch(
  () => props.containerClass,
  () => {
    setClassesList();
  },
  { deep: true }
);

watch(
  () => props.disabled,
  to => {
    if (to) {
      saveScroll();
    }
    nextTick(() => {
      applyScroll();
    });
  }
);

const emitScroll = (_: OverlayScrollbars, event: Event) => {
  emit("scroll", event);
};
const handleScroll = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault();
    event.stopPropagation();
  }
};
const setClassesList = () => {
  const container = getContainer();

  if (container && props.containerClass) {
    container.classList.remove(...Array.from(container.classList));
    if (typeof props.containerClass === "string") {
      container.classList.add(props.containerClass);
    } else {
      container.classList.add(...props.containerClass);
    }
  }
};
const saveScroll = () => {
  if (!props.freezeOnDisable) return;

  const container = getContainer();

  if (container) {
    scrollYPosition = container.scrollTop;
    scrollXPosition = container.scrollLeft;
  }
};
const applyScroll = () => {
  if (!props.freezeOnDisable) return;

  const container = getContainer();

  if (container) {
    container.scrollTop = scrollYPosition;
    container.scrollLeft = scrollXPosition;
  }
};
const getContainer = (): HTMLElement | null | undefined =>
  (root.value ? root.value.$el : disabledRoot.value)?.querySelector("[data-overlayscrollbars-contents]");
const osInitialized = () => {
  setClassesList();
  applyScroll();
  emit("init");
};
</script>

<style>
.tn-scroll {
  height: 100%;
  width: 100%;
  overflow: hidden !important;
}

.tn-scroll_freeze {
  display: flex;
  flex-direction: row;

  & > div {
    position: relative;
    flex: auto;
    height: auto;
    width: 100%;
    min-width: 0;
    padding: 0;
    margin: 0;
    border: none;
    z-index: 0;
    overflow: hidden !important;
  }
}

.tn-scroll__theme {
  --os-handle-perpendicular-size: 4px;
  --os-handle-bg: var(--border-secondary-enabled);
  --os-handle-bg-hover: var(--border-secondary-hover);
  --os-handle-bg-active: var(--border-secondary-pressed);
  --os-handle-border-radius: 20px;
  --os-handle-perpendicular-size-hover: 6px;
  --os-handle-perpendicular-size-active: 6px;
  --os-size: 4px;
  --os-handle-interactive-area-offset: 100%;
  --os-padding-axis: 5px;
}

.tn-scroll_disabled {
  user-select: none;
}

.tn-scroll_disabled .os-scrollbar {
  --os-handle-bg: var(--border-secondary-disabled);
}

.tn-scroll_disabled .os-scrollbar-handle {
  pointer-events: none !important;
}

.tn-scroll_offset .os-scrollbar-vertical {
  right: 4px;
}

.tn-scroll_offset .os-scrollbar-horizontal {
  bottom: 4px;
}
</style>
