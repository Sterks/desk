<template>
  <div
    ref="root"
    :class="{
      'tn-select-v2__control_disabled': disabled,
      'tn-select-v2__control_clearable': clearable,
      'tn-select-v2__control_error': !!error,
      'tn-select-v2__control_success': !!success,
      'tn-select-v2__control_medium': size === 'm',
      'tn-select-v2__control_open': isOpen
    }"
    class="tn-select-v2__control"
    @click.self="emit('open')"
  >
    <p v-if="!hasSelection" class="tn-select-v2__placeholder" @click.self="emit('open')">
      {{ placeholder }}
    </p>
    <div v-else-if="$slots.value" class="tn-select-v2__value-slot" @click="emit('open')">
      <slot name="value" :option="selectedOption" :value="modelValue" />
    </div>
    <p v-else :class="{ 'tn-select-v2__value_disabled': disabled }" class="tn-select-v2__value" @click="emit('open')">
      {{ displayLabel }}
    </p>

    <TNIcon :class="{ 'tn-select-v2__arrow_open': isOpen }" class="tn-select-v2__arrow" name="down-m" size="22" @click.self="emit('toggle')" />
    <TNButton v-if="clearable" class="tn-select-v2__clear" icon-size-override="20" icon="close-filled" type="link" @click.stop="emit('clear')" />
  </div>
</template>

<script lang="ts" setup generic="TOption = Record<string, any>, TModelValue = TOption">
import { ref, VNode } from "vue";
import TNIcon from "../../../icons/icon.vue";
import TNButton from "../../../button/button.vue";

defineOptions({
  name: "TNSelectV2Control"
});

defineProps<{
  /** Есть ли выбранное значение. */
  hasSelection: boolean;
  /** Отображаемый текст выбранного значения. */
  displayLabel: string;
  /** Выбранная опция (для слота `value`). */
  selectedOption: TOption | null;
  /** Текущее значение компонента (для слота `value`). */
  modelValue?: TModelValue;
  /** Текст-заглушка. */
  placeholder?: string;
  /** Отключение компонента. */
  disabled?: boolean;
  /** Размер компонента. */
  size?: "s" | "m";
  /** Текст ошибки (включает error-стиль). */
  error?: string;
  /** Текст успеха (включает success-стиль). */
  success?: string;
  /** Открыт ли селектор. */
  isOpen?: boolean;
  /** Показывать ли кнопку очистки. */
  clearable?: boolean;
}>();

const emit = defineEmits<{
  /** Открыть селектор. */
  (e: "open"): void;
  /** Переключить состояние селектора. */
  (e: "toggle"): void;
  /** Очистить значение. */
  (e: "clear"): void;
}>();

defineSlots<{
  /** Кастомное отображение выбранного значения. */
  value?: (scope: { option: TOption | null; value?: TModelValue }) => VNode[];
}>();

const root = ref<HTMLElement | null>(null);

defineExpose({
  /** Корневой DOM-элемент поля (нужен для расчёта ширины popover). */
  root
});
</script>

<style lang="css" src="./select_v2-control.css"></style>
