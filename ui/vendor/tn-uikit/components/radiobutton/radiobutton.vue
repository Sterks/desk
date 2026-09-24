<template>
  <label
    class="tn-radio"
    :class="{
      'tn-radio_has-label': label,
      'tn-radio_disabled': disabled
    }"
  >
    <div class="tn-radio__checkbox">
      <button
        :id="inputId"
        class="tn-radio__button"
        type="button"
        :class="{
          'tn-radio__button_disabled': disabled,
          'tn-radio__button_checked': isChecked
        }"
        :disabled="disabled"
        @click="onChecked"
        @mouseup="handleMouseUp"
      />
    </div>

    <div v-if="label || hasLabelSlot" class="tn-radio__text">
      <label v-if="hasLabelSlot" class="tn-radio__text-inner" :for="inputId">
        <slot name="label"></slot>
      </label>
      <label v-else class="tn-radio__text-inner" :for="inputId">
        {{ label }}
      </label>
      <p v-if="error" class="tn-radio__text-error">
        {{ error }}
      </p>
      <p v-if="warn" class="tn-radio__text-warn">
        {{ warn }}
      </p>
    </div>
  </label>
</template>

<script lang="ts" setup generic="TValue extends number | string | boolean">
import { computed, VNode } from "vue";

defineOptions({
  name: "TNRadio"
});

const props = withDefaults(
  defineProps<{
    /** Значение данного элемента в списке радио-кнопок */
    itemValue: TValue;
    /** Значение выбранного элемента в списке радио-кнопок */
    modelValue?: TValue;
    /** Делает радио-кнопку недоступной к выбору, не влияя на ее выбранность */
    disabled?: boolean;
    /** Текст ошибки (включает «error» стиль у компонента) */
    error?: string;
    /** Текст предупреждения (включает «warning» стиль у компонента) */
    warn?: string;
    /** Текст рядом с кнопкой */
    label?: string;
  }>(),
  {}
);

const emit = defineEmits<{
  /** Вызывается при выборе данной радио-кнопки */
  (e: "input", value: TValue): void;
  /** Вызывается при выборе данной радио-кнопки */
  (e: "update:modelValue", value: TValue): void;
}>();

const slots = defineSlots<{
  /** Слот для текста рядом с кнопкой	 */
  label?: () => VNode[];
}>();

const inputId = computed<string>(() => "tn-radiobutton-" + Math.floor(Math.random() * 9999) + 1);

const isChecked = computed<boolean>(() => props.itemValue === props.modelValue);
const hasLabelSlot = computed<boolean>(() => !!slots.label);

const handleMouseUp = (event: MouseEvent) => {
  (event.target as HTMLButtonElement).blur();
};

const onChecked = () => {
  emit("input", props.itemValue);
  emit("update:modelValue", props.itemValue);
};
</script>

<style lang="css">
.tn-radio {
  --tn-radio-size: 20px;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
  flex-wrap: nowrap;
  font-family: var(--font-family-body);
}

.tn-radio_has-label {
  display: flex;
  width: 100%;
}

.tn-radio__checkbox {
  /* бокс высотой в одну строку лейбла: кнопка центрируется по первой строке текста */
  display: flex;
  align-items: center;
  flex: none;
  height: var(--font-lineHeight-body-medium);
}

.tn-radio__text {
  align-self: center;
  padding-left: 10px;
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
}

.tn-radio__text-error {
  margin-top: 4px;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  color: var(--content-accent-enabled);
}

.tn-radio__text-warn {
  margin-top: 4px;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  color: var(--content-system-warning);
}

.tn-radio_disabled {
  pointer-events: none;
}

.tn-radio_disabled .tn-radio__text {
  opacity: 0.6;
}

.tn-radio__button {
  appearance: none;
  width: var(--tn-radio-size);
  height: var(--tn-radio-size);
  border: 2px solid var(--content-tertiary-enabled);
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  margin: 0;
  transition: 0.25s;
  position: relative;
  background-color: var(--background-primary-a-enabled);
  box-shadow: none;
  padding: 0;
}

.tn-radio__button:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  transform: scale(0.25);
  opacity: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: transparent;
  transition: 0.25s;
}

.tn-radio__button:hover {
  border-color: var(--content-tertiary-hover);
  background-color: var(--background-secondary-a-hover);
}

.tn-radio__button:active {
  border-color: var(--content-tertiary-pressed);
  background-color: var(--background-secondary-a-pressed);
}

.tn-radio__button_disabled {
  pointer-events: none;
  border-color: var(--border-secondary-disabled);
}

.tn-radio__button_checked {
  border-color: var(--border-accent-enabled);
}

.tn-radio__button_checked:after {
  opacity: 1;
}

.tn-radio__button_checked:active {
  border-color: var(--border-accent-pressed);
}

.tn-radio__button_checked:active:after {
  background-color: var(--border-accent-pressed);
}

.tn-radio__button_checked:hover {
  border-color: var(--border-accent-hover);
}

.tn-radio__button_checked:after {
  background-color: var(--border-accent-enabled);
  transform: scale(1);
}

.tn-radio__button_checked:hover:after {
  background-color: var(--border-accent-hover);
}

.tn-radio__button_disabled.tn-radio__button_checked {
  border-color: var(--content-action-disabled);
}

.tn-radio__button_disabled.tn-radio__button_checked:after {
  background-color: var(--content-action-disabled);
}

.tn-radio__text-inner {
  cursor: pointer;
}
</style>
