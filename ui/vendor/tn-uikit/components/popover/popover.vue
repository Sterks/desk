<template>
  <div :class="classList">
    <div v-if="haveTriggerSlot" ref="stickElement" :class="['tn-popover__trigger-wrapper', { 'tn-popover__trigger-wrapper_inline': inline }]">
      <slot name="trigger"></slot>
    </div>
    <teleport :to="popperOptions?.teleport" :disabled="!popperOptions?.teleport">
      <transition :name="transition">
        <div v-if="trigger === 'hover' || visible" ref="floatingElement" :class="wrapperClassList" :style="wrapperStyles" class="tn-popover__wrapper">
          <div :class="{ 'tn-popover__wrapper-inner': windowStyled }">
            <slot name="content">
              {{ text }}
            </slot>
          </div>
          <div v-if="arrow" ref="arrowElement" :class="arrowClassList" />
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, useSlots, VNode } from "vue";
import { autoUpdate, flip as floatingFlip, offset as floatingOffset, arrow as floatingArrow, useFloating, shift as floatingShift } from "@floating-ui/vue";

import type { ITNPopoverPosition, ITNPopoverArrowPosition, IPopoverOptions } from "./popover.types";
import { Placement } from "@floating-ui/dom";

interface reverseData {
  reverse: string;
  transform: number;
}

interface reverseDataList {
  [key: string]: reverseData;
}

defineOptions({
  name: "TNPopover"
});

const props = withDefaults(
  defineProps<{
    /** Текст внутри компонента (если не задано наполнение для slot'a content) **/
    text?: string;
    /** Ширина контейнера компонента (обязательно указывать единицу измерения) **/
    width?: string;
    /** Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента **/
    position?: ITNPopoverPosition;
    /** Позиционирование стрелки (не работает без arrow) **/
    arrowPosition?: ITNPopoverArrowPosition;
    /** Настроить отступ всплывающего окна относительно триггер-элемента **/
    offset?: number | { crossAxis?: number; mainAxis?: number };
    /** Опции для всплывающего окна (popper-элемента) **/
    popperOptions?: IPopoverOptions;
    /** Режим отображения компонента. default - зависит от состояния параметра visible; hover - при наведении на trigger-элемент, не зависит от visible **/
    trigger?: "default" | "hover";
    /** Название используемой анимации **/
    transition?: string;
    /** Включить/отключить стрелку рядом с компонентом (не работает без arrow-position) **/
    arrow?: boolean;
    /** Включить/отключить стили темной темы для компонента **/
    darkTheme?: boolean;
    /** Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу **/
    flip?: boolean;
    /** Управление видимостью компонента **/
    visible: boolean;
    /** Добавить/убрать `display: inline-block` для элемента-обертки trigger-элемента **/
    inline?: boolean;
    /** Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана **/
    shift?: boolean;
    /** Добавить класс tn-popover__wrapper-inner контейнеру контента **/
    windowStyled?: boolean;
    /** Добавление функционала плавающего компонента (реагирует на оставшееся место под контент, если места мало, то отрисовывает с другой стороны) **/
    floating?: boolean;
    /** Отключение расчета ширины в inline-стиле (требуется для ручной настройки ширины через CSS) **/
    disabledWidth?: boolean;
    /** Кастомный класс для wrapper-элемента **/
    wrapperCustomClass?: string;
  }>(),
  {
    text: undefined,
    width: "200px",
    position: "bottom-left",
    offset: () => ({ crossAxis: 0, mainAxis: 8 }),
    trigger: "default",
    transition: "tn-fade",
    flip: false,
    inline: true,
    windowStyled: true,
    floating: true
  }
);

defineSlots<{
  /** Слот для trigger-элемента, вокруг которого будет отрисовываться компонент	 **/
  trigger?: () => VNode;
  /** Слот для контента	**/
  content?: () => VNode;
}>();

const stickElement = ref<HTMLElement | null>(null);
const floatingElement = ref<HTMLElement | null>(null);
const arrowElement = ref<HTMLElement | null>(null);

const staticSides: reverseDataList = {
  top: { reverse: "bottom", transform: 180 },
  bottom: { reverse: "top", transform: 0 },
  left: { reverse: "right", transform: 90 },
  right: { reverse: "left", transform: -90 }
};

const replacementSides: Record<string, string> = {
  top: "start",
  left: "start",
  bottom: "end",
  right: "end"
};

const slots = useSlots();
const haveTriggerSlot = computed<boolean>(() => !!slots.trigger);

const classList = computed<string[]>(() => ["tn-popover", `tn-popover_trigger-${props.trigger}`]);
const wrapperClassList = computed<Record<string, boolean>>(() => ({
  "tn-popover__wrapper_floating": props.floating,
  [`tn-popover__wrapper_theme-${props.darkTheme ? "dark" : "light"}`]: true,
  [props.wrapperCustomClass ?? ""]: !!props.wrapperCustomClass
}));
const arrowClassList = computed<string>(() => {
  let arrowClass = "tn-popover__arrow";

  if (!props.arrowPosition) return "";

  const tempPosition = normalizedPosition(props.arrowPosition);

  if (props.position || !!props.arrowPosition) {
    if (props.arrowPosition && props.arrowPosition !== "auto") {
      arrowClass += ` tn-popover__arrow_${tempPosition}`;
    } else {
      arrowClass += ` tn-popover__arrow_${reversePosition(props.position)}`;
    }
  }

  return arrowClass;
});
const wrapperStyles = computed<Record<string, string | undefined>>(() => ({
  ...(props.floating ? floatingStyles.value : {}),
  width: props.disabledWidth ? undefined : props.width,
  zIndex: String(props.popperOptions?.zIndex)
}));

function reversePosition(position: string) {
  const middlewareOverflowData = middlewareData.value.flip?.overflows?.[0]?.placement?.split("-");
  let currentPosition: string[];

  if (middlewareOverflowData) {
    currentPosition = middlewareOverflowData;
  } else {
    currentPosition = position.split("-");
    currentPosition[0] = staticSides[currentPosition[0]]?.reverse;
    if (currentPosition.length > 1) {
      currentPosition[1] = replacementSides[currentPosition[1]];
    }
  }

  return currentPosition.join("-");
}

function normalizedPosition(position: string) {
  let normalizedPosition: string[] = position.split("-");

  if (normalizedPosition[1]) {
    normalizedPosition[1] = replacementSides[normalizedPosition[1]];
  }

  return normalizedPosition.join("-");
}

const positionOptions: IPopoverOptions = {
  placement: (normalizedPosition(props.position) ?? "bottom") as Placement,
  middleware: [
    floatingOffset(
      typeof props.offset === "number"
        ? props.offset
        : {
            mainAxis: props.offset?.mainAxis || 0,
            crossAxis: props.offset?.crossAxis || 0
          }
    ),
    floatingArrow({ element: arrowElement })
  ],
  whileElementsMounted: autoUpdate,
  ...props.popperOptions
};

if (positionOptions.middleware && Array.isArray(positionOptions.middleware)) {
  if (props.flip) {
    positionOptions.middleware.push(floatingFlip());
  }

  if (props.shift) {
    positionOptions.middleware.push(
      floatingShift({
        mainAxis: true,
        crossAxis: true
      })
    );
  }
}

const { floatingStyles, middlewareData } = useFloating(stickElement, floatingElement, positionOptions);
</script>

<style lang="css">
.tn-popover__trigger-wrapper_inline {
  display: inline-block;
}

.tn-popover__wrapper {
  position: relative;
  transition:
    visibility 0.2s linear,
    opacity 0.2s;
  border-radius: 12px;
  box-shadow: var(--shadow-small);
}

.tn-popover__wrapper_floating {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.tn-popover__wrapper-inner {
  position: relative;
  z-index: 2;
  border-radius: 12px;
  background-color: var(--background-primary-a-enabled);
  color: var(--content-primary-a-enabled);
  order: 1;
}

.tn-popover__wrapper_theme-dark .tn-popover__wrapper-inner {
  background-color: var(--background-primary-b-enabled);
  color: var(--content-primary-b-enabled);
}

.tn-popover__wrapper:has(.tn-popover__arrow_top) .tn-popover__wrapper-inner {
  z-index: 3;
}

.tn-popover__wrapper-inner > * {
  border-radius: 12px;
}

.tn-popover_trigger-hover .tn-popover__wrapper {
  opacity: 0;
  visibility: hidden;
}

.tn-popover_trigger-hover .tn-popover__trigger-wrapper:hover + .tn-popover__wrapper {
  opacity: 1;
  visibility: visible;
}

.tn-popover__arrow {
  position: absolute;
  content: "";
  left: 10px;
  width: 24px;
  height: 12px;
  display: block;
  z-index: 2;
  order: -1;
}

.tn-popover__arrow::after {
  position: relative;
  display: block;
  background-size: 100%;
  width: 100%;
  height: 100%;
  content: "";
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='6' viewBox='0 0 12 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.32757 4.7479C1.81081 5.52974 0.936638 6 0 6H12C11.0635 6 10.1895 5.52941 9.67343 4.74724L6.83766 0.449328C6.44255 -0.149489 5.56473 -0.149841 5.16915 0.44866L2.32757 4.7479Z' fill='%231E2228'/%3E%3C/svg%3E");
  z-index: 2;
}

.tn-popover__wrapper_theme-light .tn-popover__arrow::after {
  filter: brightness(10);
}

.tn-popover__arrow::before {
  position: absolute;
  transform-origin: center;
  display: block;
  background-size: 100%;
  width: 100%;
  height: 100%;
  content: "";
  filter: drop-shadow(-4px 6px 7px rgba(30, 34, 40, 0.17)) drop-shadow(0px 0px 2px rgba(30, 34, 40, 0.19));
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='6' viewBox='0 0 12 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.32757 4.7479C1.81081 5.52974 0.936638 6 0 6H12C11.0635 6 10.1895 5.52941 9.67343 4.74724L6.83766 0.449328C6.44255 -0.149489 5.56473 -0.149841 5.16915 0.44866L2.32757 4.7479Z' fill='%231E2228'/%3E%3C/svg%3E");
  z-index: 2;
}

.tn-popover__wrapper_theme-light .tn-popover__arrow::before {
  filter: brightness(10) drop-shadow(-4px 6px 7px rgba(30, 34, 40, 0.17)) drop-shadow(0px 0px 2px rgba(30, 34, 40, 0.19));
}

.tn-popover__arrow_bottom,
.tn-popover__arrow_bottom-start,
.tn-popover__arrow_bottom-end {
  transform: rotate(180deg);
  top: 100%;
}

.tn-popover__arrow_top,
.tn-popover__arrow_top-start,
.tn-popover__arrow_top-end {
  top: -12px;
}

.tn-popover__arrow_top,
.tn-popover__arrow_bottom {
  left: calc(50% - 12px);
}

.tn-popover__arrow_top-start,
.tn-popover__arrow_bottom-start {
  left: 16px;
}

.tn-popover__arrow_top-end,
.tn-popover__arrow_bottom-end {
  left: calc(100% - 40px);
}

.tn-popover__arrow_right,
.tn-popover__arrow_right-start,
.tn-popover__arrow_right-end {
  left: calc(100% - 6px);
  transform: translateY(-50%) rotate(90deg);
}

.tn-popover__arrow_left,
.tn-popover__arrow_left-start,
.tn-popover__arrow_left-end {
  left: -18px;
  transform: translateY(-50%) rotate(270deg);
}

.tn-popover__arrow_right,
.tn-popover__arrow_left {
  top: 50%;
}

.tn-popover__arrow_right-start,
.tn-popover__arrow_left-start {
  top: 24px;
}

.tn-popover__arrow_right-end,
.tn-popover__arrow_left-end {
  bottom: 22px;
}

.tn-popover__wrapper_theme-light .tn-popover__arrow_bottom::before,
.tn-popover__wrapper_theme-light .tn-popover__arrow_bottom-start::before,
.tn-popover__wrapper_theme-light .tn-popover__arrow_bottom-end::before {
  filter: brightness(10) drop-shadow(4px -6px 7px rgba(30, 34, 40, 0.17)) drop-shadow(0px 0px 2px rgba(30, 34, 40, 0.19));
}

.tn-popover__wrapper_theme-light .tn-popover__arrow_right::before,
.tn-popover__wrapper_theme-light .tn-popover__arrow_right-start::before,
.tn-popover__wrapper_theme-light .tn-popover__arrow_right-end::before {
  filter: brightness(10) brightness(10) drop-shadow(4px 6px 7px rgba(30, 34, 40, 0.17)) drop-shadow(0px 0px 2px rgba(30, 34, 40, 0.19));
}

.tn-popover__wrapper_theme-light .tn-popover__arrow_left::after,
.tn-popover__wrapper_theme-light .tn-popover__arrow_left-start::after,
.tn-popover__wrapper_theme-light .tn-popover__arrow_left-end::after {
  filter: brightness(10) drop-shadow(-6px 4px 7px rgba(30, 34, 40, 0.17)) drop-shadow(0px 0px 2px rgba(30, 34, 40, 0.19));
}

.tn-dark-theme {
  .tn-popover__wrapper_theme-dark .tn-popover__wrapper-inner {
    box-shadow: 0 0 0 1px var(--border-secondary-enabled);
    background-color: var(--neutral-100);
  }

  .tn-popover__wrapper_theme-dark .tn-popover__arrow_bottom,
  .tn-popover__wrapper_theme-dark .tn-popover__arrow_bottom-start,
  .tn-popover__wrapper_theme-dark .tn-popover__arrow_bottom-end {
    filter: drop-shadow(0 -1px 0 var(--border-secondary-enabled));
  }

  .tn-popover__arrow::before {
    filter: drop-shadow(0 -1px 0 var(--border-secondary-enabled));
  }

  .tn-popover__wrapper_theme-light {
    box-shadow: 0 0 0 1px var(--border-secondary-enabled);
  }

  .tn-popover__wrapper_theme-light .tn-popover__arrow::after {
    filter: drop-shadow(0.5px -0.5px 0px var(--border-secondary-enabled)) drop-shadow(-0.5px -0.5px 0px var(--border-secondary-enabled));
  }
}
</style>
