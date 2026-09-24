<template>
  <div
    class="tn-tumbler"
    :class="{
      'tn-tumbler_block': block,
      'tn-tumbler_disabled': disabled
    }"
  >
    <div v-if="hasLabel && leftLabel" class="tn-tumbler__text">
      <p class="tn-tumbler__text-inner">
        <slot name="label">{{ label }}</slot>
      </p>
      <p v-if="description" class="tn-tumbler__text-description">
        {{ description }}
      </p>
      <p v-if="error" class="tn-tumbler__text-error">
        {{ error }}
      </p>
      <p v-if="warn" class="tn-tumbler__text-warn">
        {{ warn }}
      </p>
    </div>
    <button
      class="tn-tumbler__btn"
      :class="{
        'tn-tumbler__btn_active': !!modelValue,
        'tn-tumbler__btn_disabled': disabled,
        'tn-tumbler__btn_medium': size === 'md',
        'tn-tumbler__btn_large': size === 'lg'
      }"
      role="switch"
      :aria-checked="!!modelValue"
      :disabled="disabled"
      @click="onTumblerClick"
    >
      <span v-if="hasIcon" class="tn-tumbler__btn-icon">
        <slot name="icon">
          <TNIcon v-if="icon" :size="size === 'lg' ? 20 : 16" :name="icon" />
        </slot>
      </span>
      <span v-if="hasInnerIcon" class="tn-tumbler__btn-inner-icon">
        <slot name="innerIcon">
          <TNIcon v-if="innerIcon" :size="size === 'lg' ? 14 : 12" :name="innerIcon" />
        </slot>
      </span>
    </button>
    <div v-if="hasLabel && !leftLabel" class="tn-tumbler__text">
      <p class="tn-tumbler__text-inner">
        <slot name="label">{{ label }}</slot>
      </p>
      <p v-if="description" class="tn-tumbler__text-description">
        {{ description }}
      </p>
      <p v-if="error" class="tn-tumbler__text-error">
        {{ error }}
      </p>
      <p v-if="warn" class="tn-tumbler__text-warn">
        {{ warn }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, VNode } from "vue";
import TNIcon from "../icons/icon.vue";
import type { IconNames } from "../icons/icon-names";

defineOptions({
  name: "TNTumbler"
});

const props = withDefaults(
  defineProps<{
    /** Отключение элемента */
    disabled?: boolean;
    /** Элемент на всю ширину */
    block?: boolean;
    /** Размер компонента */
    size?: "md" | "lg";
    /** Значение value переменной для компонента */
    modelValue?: boolean;
    /** Название иконки */
    icon?: IconNames;
    /** Название иконки внутри кружочка */
    innerIcon?: IconNames;
    /** Текст ошибки (включает «error» стиль у компонента) */
    error?: string;
    /** Текст предупреждения (включает «warning» стиль у компонента) */
    warn?: string;
    /** Текст заголовка компонента */
    label?: string;
    /** Текст описания компонента */
    description?: string;
    /** Расположение лейбла слева от компонента */
    leftLabel?: boolean;
  }>(),
  {
    size: "md",
    leftLabel: false
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении modelValue */
  (e: "update:modelValue", val: boolean): void;
}>();

const slots = defineSlots<{
  /** Слот для кастомного названия */
  icon?: () => VNode[];
  /** Слот для кастомной иконки внутри кружочка	*/
  innerIcon?: () => VNode[];
  /** Слот для кастомной иконки	*/
  label?: () => VNode[];
}>();

const hasLabel = computed<boolean>(() => !!props.label || !!slots.label || !!props.warn || !!props.description);
const hasIcon = computed<boolean>(() => !!props.icon || !!slots.icon);
const hasInnerIcon = computed<boolean>(() => !!props.innerIcon || !!slots.innerIcon);

const onTumblerClick = () => {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
};
</script>

<style lang="css">
.tn-tumbler {
  display: inline-flex;
  gap: 10px;
  vertical-align: middle;
  justify-content: space-between;
  flex-wrap: nowrap;
  max-width: 100%;
  font-family: var(--font-family-body);
}

.tn-tumbler_block {
  display: flex;
}

.tn-tumbler_disabled .tn-tumbler__text {
  opacity: 0.6;
}

.tn-tumbler__text {
  align-self: center;
}

.tn-tumbler__text-inner {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
}

.tn-tumbler__text-description {
  margin-top: 4px;
  line-height: var(--font-lineHeight-body-medium);
  font-size: var(--font-size-body-medium);
  color: var(--content-secondary-enabled);
}

.tn-tumbler__text-error,
.tn-tumbler__text-warn {
  margin-top: 4px;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
}

.tn-tumbler__text-error {
  color: var(--content-accent-enabled);
}

.tn-tumbler__text-warn {
  color: var(--content-system-warning);
}

.tn-tumbler__btn {
  display: inline-block;
  vertical-align: middle;
  padding: 0;
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.25s;
  position: relative;
  font-size: 16px;
  line-height: 1;
  flex: 0 0 auto;
  --secondary-color: currentColor;
  background-color: var(--content-tertiary-enabled);
  color: var(--content-primary-b-enabled);
  overflow: hidden;

  &:hover {
    background-color: var(--content-tertiary-hover);
  }

  &:active {
    background-color: var(--content-tertiary-pressed);
  }
}

.tn-tumbler__btn:after {
  content: "";
  position: absolute;
  left: 2px;
  top: 2px;
  background-color: var(--background-primary-a-enabled);
  border-radius: 50%;
  pointer-events: none;
  transition: 0.3s;
}

.tn-tumbler__btn_disabled {
  pointer-events: none;
  background-color: var(--content-tertiary-disabled);
}

.tn-tumbler__btn_medium {
  width: 41px;
  height: 24px;
  border-radius: 12px;

  &:after {
    width: 20px;
    height: 20px;
  }
}

.tn-tumbler__btn_large {
  width: 64px;
  height: 32px;
  border-radius: 16px;

  &:after {
    width: 28px;
    height: 28px;
  }
}

.tn-tumbler__btn_active {
  background-color: var(--background-accent-enabled);

  &:hover {
    background-color: var(--background-accent-hover);
  }

  &:active {
    background-color: var(--background-accent-pressed);
  }

  &.tn-tumbler__btn_disabled {
    background-color: var(--red-35);
  }
}

.tn-tumbler__btn_large {
  font-size: 20px;
}

.tn-tumbler__btn_medium.tn-tumbler__btn_active:after {
  left: 18.5px;
}

.tn-tumbler__btn_large.tn-tumbler__btn_active:after {
  left: 33.5px;
}

.tn-tumbler__btn-icon {
  position: absolute;
  transition: left 0.25s ease;
  opacity: 0.6;

  .tn-icon {
    display: block;
  }
}

.tn-tumbler__btn_medium .tn-tumbler__btn-icon {
  top: 4px;
  right: 2px;
}

.tn-tumbler__btn_large .tn-tumbler__btn-icon {
  top: 6px;
  right: 7px;
}

.tn-tumbler__btn_active.tn-tumbler__btn_medium .tn-tumbler__btn-icon {
  right: 23px;
}

.tn-tumbler__btn_active.tn-tumbler__btn_large .tn-tumbler__btn-icon {
  right: 37px;
}

.tn-tumbler__btn-inner-icon {
  position: absolute;
  transition: left 0.25s ease;
  color: var(--content-tertiary-enabled);
  z-index: 1;
  top: 4px;
  left: 6px;
}

.tn-tumbler__btn:hover .tn-tumbler__btn-inner-icon {
  color: var(--content-tertiary-hover);
}

.tn-tumbler__btn:active .tn-tumbler__btn-inner-icon {
  color: var(--content-tertiary-pressed);
}

.tn-tumbler__btn_active .tn-tumbler__btn-inner-icon {
  left: 22.5px;
  color: var(--content-accent-enabled);
}

.tn-tumbler__btn_disabled .tn-tumbler__btn-inner-icon {
  color: var(--content-accent-disabled);
}

.tn-tumbler__btn_disabled.tn-tumbler__btn_active .tn-tumbler__btn-inner-icon {
  color: var(--red-35);
}
</style>
