<template>
  <label
    class="tn-checkbox"
    :class="{
      'tn-checkbox_has-label': !!label,
      'tn-checkbox_disabled': disabled
    }"
  >
    <button
      :id="inputId"
      class="tn-checkbox__btn"
      type="button"
      :class="{
        'tn-checkbox__btn_disabled': disabled,
        'tn-checkbox__btn_checked': modelValue
      }"
      :disabled="disabled"
      @click="clickHandler"
      @mouseup="handleMouseUp"
    ></button>

    <span v-if="label || hasLabelSlot" class="tn-checkbox__text">
      <label v-if="hasLabelSlot" class="tn-checkbox__text-inner" :for="inputId">
        <slot name="label"></slot>
      </label>
      <label v-else class="tn-checkbox__text-inner" :for="inputId">
        {{ label }}
      </label>

      <span v-if="description" class="tn-checkbox__description">
        {{ description }}
      </span>

      <span v-if="!!error" class="tn-checkbox__text-error">
        {{ error }}
      </span>
      <span v-if="!!warn" class="tn-checkbox__text-warn">
        {{ warn }}
      </span>
    </span>
  </label>
</template>

<script lang="ts" setup>
import { computed, VNode } from "vue";

defineOptions({
  name: "TNCheckbox"
});

const props = defineProps<{
  /** Текст для заголовка компонента */
  label?: string;
  /** Значение для чекбокса */
  modelValue?: boolean;
  /** Отключение чекбокса */
  disabled?: boolean;
  /** Текст ошибки (включает «error» стиль у компонента) */
  error?: string;
  /** Текст предупреждения (включает «warning» стиль у компонента) */
  warn?: string;
  /** Текст для описания компонента */
  description?: string;
}>();

const emit = defineEmits<{
  /** Событие вызывается при изменении параметра modelValue */
  (e: "update:modelValue", value?: boolean): void;
}>();

const slots = defineSlots<{
  /** Слот для label */
  label?: () => VNode[];
}>();

const inputId = computed<string>(() => `tn-checkbox-${Math.floor(Math.random() * 9999) + 1}`);

const hasLabelSlot = computed<boolean>(() => !!slots.label);

const handleMouseUp = (event: MouseEvent) => {
  (event.target as HTMLButtonElement).blur();
};

const clickHandler = () => {
  emit("update:modelValue", !props.modelValue);
};
</script>

<style lang="css">
.tn-checkbox {
  --tn-checkbox-size: 22px;
  cursor: pointer;
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  word-break: break-word;
  font-family: var(--font-family-body);
}

.tn-checkbox_has-label {
  width: 100%;
}

.tn-checkbox__text {
  padding-left: 10px;
}

.tn-checkbox__description {
  color: var(--content-secondary-enabled);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  margin-top: 6px;
  display: block;
}

.tn-checkbox__text-inner {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  cursor: pointer;
}

.tn-checkbox__text-error {
  margin-top: 7px;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  display: block;
  color: var(--content-accent-enabled);
}

.tn-checkbox__text-warn {
  margin-top: 7px;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  display: block;
  color: var(--content-system-warning);
}

.tn-checkbox__btn {
  padding: 0;
  /* центр бокса по первой строке лейбла, независимо от метрик шрифта */
  margin-top: calc((var(--font-lineHeight-body-medium) - var(--tn-checkbox-size)) / 2);
  width: var(--tn-checkbox-size);
  height: var(--tn-checkbox-size);
  flex: 0 0 var(--tn-checkbox-size);
  border: 2px solid var(--content-tertiary-enabled);
  background-color: var(--background-primary-a-enabled);
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  position: relative;
  transform: translate3d(0, 0, 0);
  transition-property: background-color, border;
  transition-duration: 0.1s;
  transition-timing-function: linear;
}

.tn-checkbox__btn:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: all 0.25s 0s ease;
  box-shadow: none;
}

.tn-checkbox__btn:after {
  content: "";
  position: absolute;
  height: 14px;
  left: 2px;
  top: 2px;
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 8.30501L6.15251 12.4575L14.4575 4.1525' stroke='white' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E%0A");
  background-position: left center;
  background-size: cover;
  border-radius: 2px;
  width: 0;
  transition: width 0.3s linear;
  overflow: hidden;
}

.tn-checkbox__btn:hover {
  border-color: var(--content-tertiary-hover);
  background-color: var(--background-secondary-a-hover);
}

.tn-checkbox__btn:active {
  border-color: var(--content-tertiary-pressed);
  background-color: var(--background-secondary-a-pressed);
}

.tn-checkbox__btn_disabled {
  background-color: var(--background-secondary-a-disabled);
  border-color: var(--content-tertiary-disabled);
  pointer-events: none;
}

.tn-checkbox__btn_checked {
  background-color: var(--content-accent-enabled);
  border-color: var(--border-accent-enabled);
}

.tn-checkbox__btn_checked:after {
  width: 14px;
}

.tn-checkbox__btn_checked:hover {
  background-color: var(--background-accent-hover);
  border-color: var(--border-accent-hover);
}

.tn-checkbox__btn_checked.tn-checkbox__btn_disabled {
  background-color: var(--content-accent-disabled);
  border-color: var(--content-accent-disabled);
}

.tn-checkbox__btn_checked:active {
  background-color: var(--content-accent-enabled);
  border-color: var(--border-accent-enabled);
}

.tn-checkbox_disabled {
  pointer-events: none;
}

.tn-checkbox_disabled .tn-checkbox__text {
  opacity: 0.6;
}
</style>
