<template>
  <TNFormItem
    class="tn-textarea"
    :required="required"
    :error="error"
    :warn="warn"
    :success="success"
    :smooth-message="smoothMessage"
    :label="label"
    :description="description"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    <TextareaAutosize
      :id="inputId"
      ref="textarea"
      :class="{
        'tn-textarea__textarea_disabled': isTextareaDisabled,
        'tn-textarea__textarea_error': !!error,
        'tn-textarea__textarea_success': !!success,
        'tn-textarea__textarea_warn': !!warn,
        ...(textareaClass ? { [textareaClass]: true } : {})
      }"
      :disabled="isTextareaDisabled"
      :max-height="maxHeight"
      :rows="rows"
      :min-height="minHeight"
      :model-value="modelValue"
      :placeholder="placeholder"
      :readonly="isTextareaDisabled"
      class="tn-textarea__textarea"
      @update:model-value="emitInput"
    />
  </TNFormItem>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import TextareaAutosize from "./textarea-autosize-styleless.vue";
import { type TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import { generateElementID } from "../../helpers";
import TNFormItem from "../form-item/form-item.vue";

defineOptions({
  name: "TNTextarea"
});

const props = withDefaults(
  defineProps<
    TNFormItemProps & {
      /** Плейсхолдер. */
      placeholder?: string;
      /** Делает компонент доступным только для чтения. */
      readonly?: boolean;
      /** Делает компонент неактивным. */
      disabled?: boolean;
      /** Значение value переменной для компонента. */
      modelValue?: string;
      /** Кастомный класс для тега textarea. */
      textareaClass?: string;
      /** Минимальное количество строк компонента (по умолчанию: 2). */
      rows?: number;
      /** Минимальная высота компонента (по умолчанию: 68). */
      minHeight?: number;
      /** Максимальная высота компонента (по умолчанию: 248). */
      maxHeight?: number;
    }
  >(),
  {
    minHeight: 68,
    maxHeight: 248
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении modelValue. */
  (event: "update:modelValue", value: string): void;
}>();

defineSlots<TNFormItemSlots>();

const textarea = ref(null);
const inputId = generateElementID("tn-textarea");
const isTextareaDisabled = computed<boolean>(() => props.readonly || props.disabled || false);

function emitInput(value: string) {
  emit("update:modelValue", value);
}
</script>

<style lang="css">
.tn-textarea {
  display: block;
  width: 100%;
  font-family: var(--font-family-body);
}

.tn-textarea_smooth:not(:has(.tn-textarea__message)) .tn-textarea__textarea {
  margin-bottom: 24px;
}

.tn-textarea__textarea {
  font-family: var(--font-family-body);
  width: 100%;
  background-color: var(--background-primary-a-enabled);
  border: 1px solid var(--border-secondary-enabled);
  border-radius: 12px;
  padding: 13px 16px;
  outline: none;
  font-size: var(--font-size-body-medium);
  color: var(--content-primary-a-enabled);
  transition-property: background-color, border, color;
  transition-duration: 0.3s;
  transition-timing-function: linear;
  box-sizing: border-box;
  resize: none;
}

.tn-textarea__textarea::placeholder {
  color: var(--content-secondary-enabled);
}

.tn-textarea__textarea_disabled {
  background-color: var(--background-primary-a-disabled);
  pointer-events: none;
  border-color: var(--border-secondary-disabled);
  color: rgba(46, 56, 75, 0.48);
}

.tn-textarea__textarea_disabled::placeholder {
  color: var(--content-primary-a-disabled);
}

.tn-textarea__textarea:focus {
  border-color: var(--content-primary-a-disabled);
}

.tn-textarea__textarea_error {
  border-color: var(--border-accent-enabled);
}

.tn-textarea__textarea_success {
  border-color: var(--content-system-positive);
}
</style>
