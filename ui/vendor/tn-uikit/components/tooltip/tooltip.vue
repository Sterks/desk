<template>
  <div v-if="text || haveSlot" :class="classList" class="tn-tooltip">
    <TNPopover
      :arrow="!!arrowPosition"
      :arrow-position="arrowPosition"
      :dark-theme="!light"
      :flip="flip"
      :floating="haveTriggerSlot"
      :offset="offset ?? popperOptions?.offset"
      :popper-options="popperOptions"
      :position="position"
      :shift="shift"
      :visible="visible"
      :trigger="popperOptions?.trigger"
      width="unset"
    >
      <template v-if="haveTriggerSlot" #trigger>
        <slot name="trigger"></slot>
      </template>
      <template #content>
        <div class="tn-tooltip__container" :class="customClass">
          <p
            v-if="text"
            :class="{
              'tn-tooltip__text_one-line': oneLine,
              'tn-tooltip__text_no-scroll': noScroll
            }"
            class="tn-tooltip__text"
            v-html="text"
          ></p>
          <p
            v-else-if="haveSlot"
            :class="{
              'tn-tooltip__text_one-line': oneLine,
              'tn-tooltip__text_no-scroll': noScroll
            }"
            class="tn-tooltip__text"
          >
            <slot></slot>
          </p>
          <TNButton
            v-if="showCloseButton"
            :class="{
              'tn-tooltip__close-button_no-other-buttons': !previousButton && !nextButton && !stepText
            }"
            class="tn-tooltip__close-button"
            icon="close"
            type="link"
            @click="closeButtonClickHandler"
          />
          <div v-if="previousButton || nextButton || stepText" class="tn-tooltip__button-container">
            <TNButton v-if="previousButton" class="tn-tooltip__previous-button" type="link" @click="previousButtonClickHandler">
              {{ previousButton }}
            </TNButton>
            <TNButton v-if="nextButton" class="tn-tooltip__next-button" type="default" @click="nextButtonClickHandler">
              {{ nextButton }}
            </TNButton>
            <p v-if="stepText" class="tn-tooltip__step-text">{{ stepText }}</p>
          </div>
        </div>
      </template>
    </TNPopover>
  </div>
</template>

<script lang="ts" setup>
import { computed, VNode } from "vue";
import TNButton from "../button/button.vue";
import TNPopover from "../popover/popover.vue";

import type { ITNPopoverPosition, ITNPopoverArrowPosition, IPopoverOptions } from "../popover/popover.types";

defineOptions({
  name: "TNTooltip"
});

const props = withDefaults(
  defineProps<{
    /** Текст для кнопки "Далее". */
    nextButton?: string;
    /** Текст для кнопки "Назад". */
    previousButton?: string;
    /** Текущий шаг в тултипе. */
    currentStep?: string | number;
    /** Количество шагов в тултипе. */
    totalSteps?: string | number;
    /** Текст внутри тултипа. */
    text?: string;
    /** Управляет отображением кнопки закрытия. */
    showCloseButton?: boolean;
    /** Включает светлую тему оформления. */
    light?: boolean;
    /** Добавляет кастомный класс в контейнер тултипа. */
    customClass?: string;
    /** Позиционирование всплывающего окна относительно trigger-элемента. */
    position?: ITNPopoverPosition;
    /** Позиция стрелки тултипа. */
    arrowPosition?: ITNPopoverArrowPosition;
    /** Позволяет отобразить тултип с другой стороны, если не хватает места. */
    flip?: boolean;
    /** Сдвигает тултип, чтобы он не выходил за пределы экрана. */
    shift?: boolean;
    /** Дополнительные опции для popper-элемента. */
    popperOptions?: IPopoverOptions;
    /** Управляет видимостью тултипа. */
    visible?: boolean;
    /** Ограничивает текст одной строкой. */
    oneLine?: boolean;
    /** Отключает внутренний скролл текста. */
    noScroll?: boolean;
    /** Настраивает отступ тултипа относительно trigger-элемента. */
    offset?: number | { crossAxis?: number; mainAxis?: number };
  }>(),
  {
    nextButton: "",
    previousButton: "",
    currentStep: 1,
    totalSteps: 1,
    text: "",
    showCloseButton: false,
    light: false,
    customClass: "",
    position: "bottom-left",
    flip: true,
    visible: true,
    oneLine: false,
    noScroll: false
  }
);

const emit = defineEmits<{
  /** Вызывается при клике на кнопку "Далее". */
  (e: "next", event: Event): void;
  /** Вызывается при клике на кнопку "Назад". */
  (e: "previous", event: Event): void;
  /** Вызывается при клике на кнопку закрытия. */
  (e: "close", event: Event): void;
}>();

const slots = defineSlots<{
  /** Слот для trigger-элемента. */
  trigger?: () => VNode[];
  /** Слот для контента тултипа. */
  default?: () => VNode[];
}>();

const stepText = computed<string>(() => (Number(props.currentStep) > 1 || Number(props.totalSteps) > 1 ? `${props.currentStep} из ${props.totalSteps}` : ""));

const classList = computed<string[]>(() => {
  const list: string[] = [];

  if (props.showCloseButton) {
    list.push("tn-tooltip_close");
  } else if (!props.nextButton && !props.previousButton && !stepText.value) {
    list.push("tn-tooltip_simple");
  }

  return list;
});

const haveTriggerSlot = computed<boolean>(() => !!slots.trigger);
const haveSlot = computed<boolean>(() => {
  if (!slots.default) {
    return false;
  } else {
    const slotList = slots.default();
    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});

const closeButtonClickHandler = (event: Event) => {
  emit("close", event);
};

const nextButtonClickHandler = (event: Event) => {
  emit("next", event);
};

const previousButtonClickHandler = (event: Event) => {
  emit("previous", event);
};
</script>

<style lang="css">
.tn-tooltip {
  position: relative;
  font-family: var(--font-family-body);
}

.tn-tooltip {
  .tn-popover__wrapper {
    border-radius: 16px;
  }

  .tn-popover__wrapper_floating {
    width: max-content;
  }
}

.tn-tooltip_simple .tn-popover__wrapper {
  border-radius: 8px;
}

.tn-tooltip_close .tn-tooltip__container {
  padding: 0 36px 0 0;
}

.tn-tooltip__text {
  font-weight: var(--font-weight-text);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  user-select: text;
  max-height: 88px;
  overflow: auto;
  padding-right: 20px;
}

.tn-tooltip__text_one-line {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
}

.tn-tooltip__text_no-scroll {
  max-height: unset;
  padding-right: 0;
}

.tn-tooltip__text::-webkit-scrollbar {
  width: 12px;
}

.tn-tooltip__text::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 24px;
  background-color: var(--border-secondary-enabled);
}

.tn-tooltip__button-container {
  margin-top: 24px;
  display: flex;
  align-items: center;
  width: 100%;
}

.tn-tooltip__button-container > *:not(:last-child) {
  margin-right: 16px;
}

.tn-button.tn-tooltip__previous-button {
  padding: 0;
  border: none;
  color: inherit;
}

.tn-button.tn-tooltip__next-button {
  padding: 6px 16px;
  border: none;
  border-radius: 12px;
}

.tn-tooltip__step-text {
  user-select: none;
  margin-left: auto;
  color: var(--content-secondary-enabled);
}

.tn-button.tn-tooltip__close-button {
  width: 32px;
  height: 32px;
  position: absolute;
  top: 12px;
  right: 20px;
  padding: 0;
  border: none;
}

.tn-button.tn-tooltip__close-button.tn-tooltip__close-button_no-other-buttons {
  top: 10px;
}

.tn-button.tn-tooltip__close-button .tn-button__icon {
  font-size: 24px;
  line-height: 24px;
}

.tn-tooltip__close-button,
.tn-tooltip__close-button:hover,
.tn-tooltip__close-button:active {
  color: inherit;
}

.tn-tooltip .tn-popover__wrapper-inner {
  border-radius: 16px;
}

.tn-tooltip .tn-popover__wrapper_theme-light {
  display: flex;
}

.tn-tooltip:not(.tn-tooltip_simple) .tn-popover__wrapper-inner {
  padding: 16px 24px;
}

.tn-tooltip_simple .tn-popover__wrapper-inner {
  padding: 5px 12px;
  border-radius: 8px;
}

.tn-tooltip_simple .tn-popover__arrow {
  width: 12px;
  height: 6px;
}

.tn-tooltip_simple .tn-popover__arrow_left,
.tn-tooltip_simple .tn-popover__arrow_left-start,
.tn-tooltip_simple .tn-popover__arrow_left-end {
  left: -9px;
}

.tn-tooltip_simple .tn-popover__arrow_right,
.tn-tooltip_simple .tn-popover__arrow_right-start,
.tn-tooltip_simple .tn-popover__arrow_right-end {
  left: unset;
  right: -9px;
}

.tn-tooltip_simple .tn-popover__arrow_left-start,
.tn-tooltip_simple .tn-popover__arrow_right-start {
  top: 11px;
}

.tn-tooltip_simple .tn-popover__arrow_left-end,
.tn-tooltip_simple .tn-popover__arrow_right-end {
  bottom: 9px;
}

.tn-tooltip_simple .tn-popover__arrow_top,
.tn-tooltip_simple .tn-popover__arrow_bottom {
  left: calc(50% - 6px);
}

.tn-tooltip_simple .tn-popover__arrow_top,
.tn-tooltip_simple .tn-popover__arrow_top-start,
.tn-tooltip_simple .tn-popover__arrow_top-end {
  top: -6px;
}

.tn-tooltip_simple .tn-popover__arrow_top-start,
.tn-tooltip_simple .tn-popover__arrow_bottom-start {
  left: 8px;
}

.tn-tooltip_simple .tn-popover__arrow_top-end,
.tn-tooltip_simple .tn-popover__arrow_bottom-end {
  left: unset;
  right: 8px;
}
</style>
