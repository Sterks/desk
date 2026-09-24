<template>
  <div class="tn-checkbox-radio-group">
    <div v-for="(option, index) in options" :key="index" class="tn-checkbox-radio-group__item">
      <TNCheckbox
        v-if="currentType === 'checkbox'"
        :label="option.label"
        :disabled="option.disabled"
        :error="option.error"
        :warn="option.warn"
        :description="option.description"
        :model-value="Array.isArray(modelValue) && modelValue.includes(option.itemValue)"
        @update:model-value="updateCheckboxValue(option.itemValue)"
      />
      <TNRadio
        v-else
        :item-value="option.itemValue"
        :label="option.label"
        :disabled="option.disabled"
        :error="option.error"
        :warn="option.warn"
        :model-value="Array.isArray(modelValue) ? modelValue[0] : modelValue"
        @input="updateRadioValue"
      />
    </div>
    <slot />
  </div>
</template>

<script lang="ts" setup generic="TValue extends string | number | boolean, TType extends TNCheckboxRadioGroupType = 'checkbox'">
import { computed, onMounted, VNode } from "vue";
import TNCheckbox from "../checkbox/checkbox.vue";
import TNRadio from "../radiobutton/radiobutton.vue";
import type { TNCheckboxRadioGroupProps, TNCheckboxRadioGroupType, TNCheckboxRadioGroupValue } from "./checkbox-radio-group.types";

defineOptions({
  name: "TNCheckboxRadioGroup"
});

const props = withDefaults(defineProps<TNCheckboxRadioGroupProps<TValue, TType>>(), {
  options: () => []
});

const emit = defineEmits<{
  /** Событие вызывается при изменении параметра modelValue */
  (e: "update:modelValue", value: TNCheckboxRadioGroupValue<TValue, TType>): void;
}>();

defineSlots<{
  /** Слот для контента внизу списка элементов */
  default?: () => VNode[];
}>();

// Значение по умолчанию задаётся здесь, а не через `withDefaults`: `TType` выводится из пропа,
// и литерал "checkbox" не присвоить обобщённому параметру.
const currentType = computed<TNCheckboxRadioGroupType>(() => props.type ?? "checkbox");

onMounted(() => {
  if (currentType.value === "checkbox" && props.modelValue && !Array.isArray(props.modelValue)) {
    // eslint-disable-next-line no-console
    console.warn('Для списка TNCheckbox (type == "checkbox") modelValue должен иметь тип Array');
  } else if (currentType.value === "radio" && props.modelValue && Array.isArray(props.modelValue)) {
    // eslint-disable-next-line no-console
    console.warn('Для списка TNRadio (type == "radio") modelValue должен иметь тип string | number | boolean');
  }
});

const updateCheckboxValue = (itemValue: TValue) => {
  const currentModelValue = Array.isArray(props.modelValue) ? props.modelValue : [];

  const newModelValue = currentModelValue.includes(itemValue) ? currentModelValue.filter(v => v !== itemValue) : [...currentModelValue, itemValue];

  emit("update:modelValue", newModelValue as TNCheckboxRadioGroupValue<TValue, TType>);
};

const updateRadioValue = (itemValue: TValue) => {
  emit("update:modelValue", itemValue as TNCheckboxRadioGroupValue<TValue, TType>);
};
</script>

<style lang="css">
.tn-checkbox-radio-group__item {
  display: flex;
}
</style>
