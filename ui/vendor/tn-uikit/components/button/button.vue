<template>
  <button class="tn-button" :disabled="disabled" :class="classList" @click="onClickButton">
    <span
      v-if="hasIcon"
      class="tn-button__icon"
      :class="{
        'tn-button__icon_left': !isOnlyIcon
      }"
    >
      <slot name="icon">
        <TNIcon v-if="icon" :size="iconSize" :name="icon" />
      </slot>
    </span>
    <span v-if="hasContent" class="tn-button__text"><slot></slot></span>
    <span v-if="hasRightIcon" class="tn-button__icon tn-button__icon_right">
      <slot name="icon-right">
        <TNIcon v-if="iconRight" :size="iconSize" :name="iconRight" />
      </slot>
    </span>

    <transition name="tn-fade">
      <span v-if="loading" class="tn-button__loader">
        <TNIcon :size="iconSize" class="tn-button__loader-icon" name="load" />
      </span>
    </transition>
  </button>
</template>

<script lang="ts" setup>
import { computed, VNode } from "vue";
import TNIcon from "../icons/icon.vue";
import type { IconNames } from "../icons/icon-names";
import { ButtonType } from "./button.types";

defineOptions({
  name: "TNButton"
});

const props = withDefaults(
  defineProps<{
    /** Размер кнопки */
    size?: "sm" | "md" | "lg" | "xl";
    /** Стиль кнопки */
    type?: ButtonType;
    /** Скруглить углы кнопки */
    rounded?: boolean;
    /** Отключить кнопку (применяется disabled стиль) */
    disabled?: boolean;
    /** Применяет кнопке стиль "display: block", из-за чего ширина кнопки становится 100% от родительского контейнера */
    block?: boolean;
    /** Отключает кнопку и включает состояние загрузки (loader) */
    loading?: boolean;
    /** Вставка иконки слева */
    icon?: IconNames;
    /** Вставка иконки справа */
    iconRight?: IconNames;
    /** Открывает проброшенную ссылку. Должна быть валидным URL */
    href?: string;
    /** Открывает проброшенную в параметре href ссылку в новой вкладке. */
    target?: "_blank";
    /** Устанавливает размер иконки (в пикселях) */
    iconSizeOverride?: string | number;
  }>(),
  {
    size: "sm",
    type: "action",
    action: true,
    rounded: false,
    loading: false
  }
);

const emit = defineEmits<{
  /** Событие вызывается при клике */
  (e: "click", event: MouseEvent): void;
}>();

const slots = defineSlots<{
  /** Слот для контента */
  default?: () => VNode[];
  /** Слот для кастомной иконки слева */
  icon?: () => VNode[];
  /** Слот для кастомной иконки справа */
  "icon-right"?: () => VNode[];
}>();

const hasContent = computed<boolean>(() => {
  if (!slots.default) {
    return false;
  } else {
    const slotList = slots.default();
    return slotList.length >= 2 || slotList.every(si => si.children);
  }
});
const hasIconSlot = computed<boolean>(() => !!slots["icon"]);
const hasRightIconSlot = computed<boolean>(() => !!slots["icon-right"]);
const hasIcon = computed<boolean>(() => hasIconSlot.value || !!props.icon);
const isOnlyIcon = computed<boolean>(() => !hasContent.value && hasIcon.value);
const hasLeftIcon = computed<boolean>(() => hasIcon.value);
const hasRightIcon = computed<boolean>(() => hasRightIconSlot.value || !!props.iconRight);
const iconSize = computed<number>(() => {
  if (props.iconSizeOverride) {
    return Number(props.iconSizeOverride);
  }
  switch (props.size) {
    case "sm":
      return 20;
    case "md":
    case "lg":
      return 24;
    case "xl":
      return 28;
    default:
      return 20;
  }
});
const classList = computed<string[]>(() => {
  const list: string[] = [];
  list.push({ sm: "tn-button_small", md: "tn-button_medium", lg: "tn-button_large", xl: "tn-button_xlarge" }[props.size]);
  list.push("tn-button_" + props.type);

  if (props.disabled) {
    list.push("tn-button_disabled");
  }
  if (props.block) {
    list.push("tn-button_wide");
  }
  if (isOnlyIcon.value) {
    list.push("tn-button_only-icon");
  }
  if (hasLeftIcon.value) {
    list.push("tn-button_left-icon");
  }
  if (hasRightIcon.value) {
    list.push("tn-button_right-icon");
  }
  if (props.loading) {
    list.push("tn-button_loading");
  }
  list.push(`tn-button_${props.rounded ? "" : "not-"}rounded`);

  return list;
});

function onClickButton(e: MouseEvent) {
  if (props.loading) {
    return false;
  }

  if (props.href) {
    if (props.target === "_blank") {
      window.open(props.href, "_blank");
    } else {
      window.location.assign(props.href);
    }
  }

  emit("click", e);
}
</script>
<style lang="css">
/*Общие----------------------------------------*/
.tn-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  vertical-align: middle;
  max-width: 100%;
  font-family: var(--font-family-body);
  font-weight: var(--font-weight-accent);
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  transition-property: background-color, color, border-color, padding;
  transition-duration: 0.1s;
  transition-timing-function: linear;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
  position: relative;
  border: none;
}

.tn-button_rounded {
  border-radius: 50px;
}

.tn-button_not-rounded {
  border-radius: 12px;
}

.tn-button .tn-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.tn-button__icon svg {
  pointer-events: none;
}

.tn-button__icon_left + .tn-button__text {
  margin-left: 8px;
}

.tn-button__text + .tn-button__icon_right {
  margin-left: 8px;
}

.tn-button_disabled {
  pointer-events: none;
}

.tn-button_wide {
  width: 100%;
}

.tn-button * {
  display: inline-block;
  vertical-align: middle;
}

.tn-button__text {
  display: inline;
  overflow: hidden;
  text-overflow: ellipsis;

  &:empty {
    display: none;
  }
}

.tn-button_loading .tn-button__text {
  color: transparent;
}

.tn-button_loading .tn-button__icon {
  color: transparent;
}

.tn-button__loader {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
/*Цвет - действие-----------------------------------------*/
.tn-button_action {
  background-color: var(--background-accent-enabled);
  color: var(--content-primary-b-enabled);
}

.tn-button_action:hover {
  background-color: var(--background-accent-hover);
}

.tn-button_action:active {
  background-color: var(--background-accent-pressed);
}

.tn-button_action.tn-button_disabled {
  background-color: var(--background-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}

/*Цвет - white-----------------------------------------*/
.tn-button_white {
  background-color: var(--background-primary-a-enabled);
  color: var(--content-primary-a-enabled);
}

.tn-button_white:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-button_white:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-button_white.tn-button_disabled {
  background-color: var(--background-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}

/*Цвет - outline-----------------------------------------*/
.tn-button_outline {
  background-color: var(--background-primary-a-enabled);
  color: var(--content-accent-enabled);
  border: 1px solid var(--content-accent-enabled);

  &:hover {
    background-color: var(--background-primary-a-hover);
    border-color: var(--background-accent-hover);
    color: var(--content-accent-hover);
  }

  &:active {
    background-color: var(--background-primary-a-pressed);
    border-color: var(--background-accent-pressed);
    color: var(--content-accent-pressed);
  }

  &.tn-button_disabled {
    background-color: var(--background-primary-a-disabled);
    color: var(--content-primary-a-disabled);
    border-color: var(--border-secondary-disabled);
  }
}

/*Цвет - стандарт----------------------------------------*/
.tn-button_default {
  background-color: var(--background-tertiary-enabled);
  color: var(--content-primary-a-enabled);

  &:hover {
    background-color: var(--background-tertiary-hover);
  }

  &:active {
    background-color: var(--background-tertiary-pressed);
  }

  &.tn-button_disabled {
    background-color: var(--background-tertiary-disabled);
    color: var(--content-tertiary-disabled);
  }
}

/*Цвет - ссылки----------------------------------------*/
.tn-button_link {
  height: 32px;
  padding: 4px 7px;
  background-color: transparent;
  color: var(--content-accent-enabled);
  border-radius: 0;
}

.tn-button_link:hover {
  color: var(--content-accent-hover);
}

.tn-button_link:active {
  color: var(--content-accent-pressed);
}

.tn-button_link.tn-button_default {
  color: var(--content-primary-a-enabled);
}

.tn-button_link.tn-button_default:hover {
  background-color: var(--background-tertiary-hover);
}

.tn-button_link.tn-button_default:active {
  background-color: var(--background-tertiary-pressed);
}

.tn-button_link.tn-button_disabled {
  color: var(--content-primary-a-disabled);
}

.tn-button_link.tn-button_outline {
  color: var(--content-primary-b-enabled);
  background-color: transparent;
}

/*Размер--------------------------------------*/
.tn-button_small {
  height: 32px;
  padding: 6px 12px;
  font-size: var(--font-size-body-small);
  line-height: 1;
}

.tn-button_small.tn-button_only-icon {
  padding: 6px;
  width: 32px;
}

.tn-button_small.tn-button_only-icon .tn-button__icon {
  font-size: 16px;
}

.tn-button_small.tn-button_only-icon .tn-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-button_small.tn-button_not-rounded {
  border-radius: 8px;
}

.tn-button_small .tn-button__loader-icon {
  font-size: 20px;
}

.tn-button_medium {
  height: 40px;
  padding: 8px 16px;
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
}

.tn-button_medium.tn-button_only-icon {
  padding: 8px;
  width: 40px;
}

.tn-button_medium.tn-button_only-icon .tn-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-button_medium .tn-button__loader-icon {
  font-size: 24px;
}

.tn-button_medium .tn-button__icon {
  font-size: 20px;
}

.tn-button_large {
  height: 48px;
  padding: 12px 24px;
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
}

.tn-button_large .tn-button__icon {
  font-size: 24px;
}

.tn-button_large.tn-button_only-icon {
  padding: 12px 10px;
  width: 48px;
}

.tn-button_large.tn-button_only-icon .tn-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-button_large .tn-button__loader-icon {
  font-size: 24px;
}

.tn-button_xlarge {
  height: 72px;
  padding: 22px 44px;
  font-size: var(--font-size-headline-small);
  line-height: var(--font-lineHeight-headline-small);
}

.tn-button_xlarge .tn-button__icon {
  font-size: 26px;
}

.tn-button_xlarge.tn-button_only-icon {
  padding: 12px 10px;
  width: 72px;
}

.tn-button_xlarge.tn-button_only-icon .tn-button__icon {
  font-size: 34px;
}

.tn-button_xlarge.tn-button_only-icon .tn-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-button_xlarge .tn-button__loader-icon {
  font-size: 28px;
}

.tn-dark-theme {
  .tn-button_outline {
    color: var(--content-primary-a-enabled);

    &:hover {
      color: var(--content-primary-a-hover);
    }

    &:active {
      color: var(--content-primary-a-pressed);
    }

    &.tn-button_disabled {
      color: var(--content-primary-a-disabled);
    }
  }
}
</style>
<style src="../../app.css"></style>
