<template>
  <TNFormItem
    class="tn-input"
    :required="required"
    :error="error"
    :warn="warn"
    :success="success"
    :smooth-message="smoothMessage"
    :label="label"
    :description="description"
    :item-id="inputId"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>

    <div class="tn-input__inner">
      <input
        :id="inputId"
        v-maska="options"
        :aria-disabled="disabled"
        :class="[
          {
            'tn-input__inner-input_error': !!error,
            'tn-input__inner-input_warn': !!warn,
            'tn-input__inner-input_success': !!success,
            'tn-input__inner-input_clearable': clearable,
            ...(inputClass ? { [inputClass]: true } : {})
          },
          'tn-input__inner-input_size-' + size
        ]"
        :disabled="disabled"
        :inputmode="numericKeyboard ?? 'text'"
        :placeholder="placeholder"
        :readonly="readonly"
        :style="styles"
        :value="modelValue"
        class="tn-input__inner-input"
        type="text"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        @keyup.enter="handleEnterKey"
      />
      <div class="tn-input__icon-container">
        <TNButton v-if="modelValue && clearable && !disabled" class="tn-input__inner-clear" icon="close-filled" type="link" @click="clearHandler" />
        <slot name="icon"></slot>
      </div>
    </div>
  </TNFormItem>
</template>

<script lang="ts" setup>
import { computed, StyleValue, VNode } from "vue";
import TNButton from "../button/button.vue";
import { vMaska } from "maska/vue";
import type { MaskInputOptions, MaskTokens } from "maska";
import { useLibraryOptions } from "../../composables/library-options";
import TNFormItem from "../form-item/form-item.vue";
import { generateElementID } from "../../helpers";

defineOptions({
  name: "TNInput"
});

const props = withDefaults(
  defineProps<{
    /** Выводит звездочку после заголовка компонента. */
    required?: boolean;
    /** Запрещает изменять содержимое поля, но не влияет на отображение текущего значения. */
    readonly?: boolean;
    /** Отключает поле ввода и не влияет на отображение текущего значения. */
    disabled?: boolean;
    /** Добавляет кнопку очистки содержимого поля. */
    clearable?: boolean;
    /** Инлайн-стили для нативного элемента `input`. */
    styles?: StyleValue;
    /** Размер компонента. */
    size?: "s" | "m";
    /** Текст заголовка компонента. */
    label?: string;
    /** Текст описания компонента. */
    description?: string;
    /** Текст ошибки. Включает error-стиль компонента. */
    error?: string;
    /** Текст предупреждения. Включает warning-стиль компонента. */
    warn?: string;
    /** Текст успеха. Включает success-стиль компонента. */
    success?: string;
    /** Текст-заглушка для пустого поля ввода. */
    placeholder?: string;
    /** Значение `value` для компонента. */
    modelValue?: string;
    /** CSS-класс для элемента `input`. */
    inputClass?: string;
    /** Шаблон маски вводимого текста для Maska. */
    maskTemplate?: string;
    /** Управляет HTML-атрибутом `inputmode`. */
    numericKeyboard?: "decimal" | "numeric" | "tel" | "email" | "url";
    /** Пользовательские токены для шаблона маски. */
    maskTokens?: MaskTokens;
    /** Добавляет плавную анимацию появления текста ошибки, предупреждения или успеха. */
    smoothMessage?: boolean;
  }>(),
  {
    placeholder: ""
  }
);

const emit = defineEmits<{
  /** Вызывается при обновлении `modelValue`. */
  (e: "update:modelValue", value: string): void;
  /** Вызывается при потере фокуса и возвращает текущее значение `input`. */
  (e: "blur", value: string): void;
  /** Вызывается при получении фокуса и возвращает текущее значение `input`. */
  (e: "focus", value: string): void;
  /** Вызывается при нажатии `Enter` и возвращает текущее значение `input`. */
  (e: "enter", value: string): void;
}>();

defineSlots<{
  /** Слот для кастомного заголовка компонента. */
  label?: () => VNode[];
  /** Слот для кастомного описания компонента. */
  description?: () => VNode[];
  /** Слот для кастомного footer-блока. */
  footer?: () => VNode[];
  /** Слот для кастомного header-блока над полем ввода. */
  header?: () => VNode[];
  /** Слот для кастомной иконки справа внутри поля ввода. */
  icon?: () => VNode[];
}>();

const { inputMaskTemplates } = useLibraryOptions();

const inputId = generateElementID("tn-input");
const options = computed<MaskInputOptions | undefined>(() =>
  props.maskTemplate
    ? {
        mask: props.maskTemplate,
        tokens: { ...inputMaskTemplates, ...props.maskTokens }
      }
    : undefined
);

const clearHandler = () => {
  if (!props.disabled && !props.readonly) {
    emit("update:modelValue", "");
  }
};

const handleInput = (e: Event) => {
  // v-maska вызывает событие input второй раз из-за чего 2 события InputEvent и CustomEvent отправляются одновременно
  if (!(e instanceof InputEvent)) return;

  if (e.target instanceof HTMLInputElement) {
    emit("update:modelValue", e.target.value);
  }
};
const handleBlur = (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    emit("blur", e.target.value);
  }
};
const handleFocus = (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    emit("focus", e.target.value);
  }
};
const handleEnterKey = (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    emit("enter", e.target.value);
  }
};
</script>

<style lang="css">
.tn-input__inner-input {
  height: 40px;
  width: 100%;
  background-color: var(--background-primary-a-enabled);
  border: 1px solid var(--border-secondary-enabled);
  border-radius: 12px;
  padding: 0 12px;
  outline: none;
  font-size: var(--font-size-body-medium);
  color: var(--content-primary-a-enabled);
  transition: 0.3s;
  box-sizing: border-box;
  font-weight: var(--font-weight-text);
}

.tn-input__inner-input:focus {
  border-color: var(--border-secondary-pressed);
}

.tn-input_smooth:not(:has(.tn-input__message)) .tn-input__inner {
  margin-bottom: 24px;
}

.tn-input__inner-input_size-m {
  padding: 0 16px;
  height: 48px;
}

.tn-input__inner-input_clearable {
  padding-right: 48px;
}

.tn-input__inner-input::-ms-clear {
  display: none;
}

.tn-input__inner-input::placeholder {
  color: var(--content-secondary-enabled);
}

.tn-input__inner-input:disabled,
.tn-input__inner-input:disabled:hover {
  background-color: var(--background-primary-a-disabled);
  pointer-events: none;
  border-color: var(--border-secondary-disabled);
  color: var(--content-primary-a-disabled);
}

.tn-input__inner-input:disabled::placeholder {
  color: var(--content-secondary-disabled);
}

.tn-input__inner {
  position: relative;
}

.tn-button.tn-input__inner-clear {
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  background-color: transparent !important;
  color: var(--content-tertiary-enabled);
}

.tn-input__inner-clear .tn-icon,
.tn-input__inner-clear .tn-icon svg {
  width: 20px !important;
  height: 20px !important;
  line-height: 20px !important;
}

.tn-button.tn-input__inner-clear:hover {
  color: var(--content-tertiary-hover);
}

.tn-button.tn-input__inner-clear:active {
  color: var(--content-tertiary-pressed);
}

.tn-input__inner-clear:not(:last-child) {
  margin-right: 12px;
}

.tn-input__inner-input_error {
  border-color: var(--background-accent-enabled);
}

.tn-input__inner-input_error:focus {
  border-color: var(--background-accent-hover);
}

.tn-input__inner-input_success {
  border-color: var(--content-system-positive);
}

.tn-input__inner-input_success:focus {
  border-color: var(--content-system-positive);
}

.tn-input__inner-input_date {
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='21' viewBox='0 0 20 21' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M20 6C20 3.79086 18.2091 2 16 2H15V1C15 0.447715 14.5523 0 14 0C13.4477 0 13 0.447715 13 1V2H7V1C7 0.447715 6.55228 0 6 0C5.44772 0 5 0.447715 5 1V2H4C1.79086 2 0 3.79086 0 6V8V10V12.5V17C0 19.2091 1.79086 21 4 21H16C18.2091 21 20 19.2091 20 17V10V8V6ZM15 4H16C17.1046 4 18 4.89543 18 6V8H10.5H2V6C2 4.89543 2.89543 4 4 4H5C5 4.55228 5.44772 5 6 5C6.55228 5 7 4.55228 7 4H13C13 4.55228 13.4477 5 14 5C14.5523 5 15 4.55228 15 4ZM18 10V17C18 18.1046 17.1046 19 16 19H4C2.89543 19 2 18.1046 2 17V10.5V10H16H18Z' fill='%239CA3B6'/%3E%3C/svg%3E%0A");
  background-position: right 14px center;
  -webkit-background-size: 20px;
  background-size: 20px;
  padding-right: 48px;
  background-repeat: no-repeat;
}

.tn-input__inner-input_date.tn-input__inner-input_clearable {
  padding-right: 70px;
}

.tn-input__icon-container {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  outline: none;
  display: flex;
  align-items: center;
}
</style>
