<template>
  <ControlField
    :title="title"
    :field-type="fieldType"
    :required="required === true"
    :default-value="defaultValue"
    :desc="desc"
    @reset="handleUpdate()"
  >
    <HstSelect
      :model-value="modelValue"
      :title="title"
      :options
      @update:model-value="handleUpdate"
    />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import type { HstControlOption } from "@histoire/controls";
import type { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldTextProp = ControlFieldProps & {
  modelValue?: string;
  options: Record<string, any> | string[] | HstControlOption[];
  numeric?: boolean;
};

const { numeric = false } = defineProps<ControlFieldTextProp>();
const emit = defineEmits<{
  (e: "update:model-value", val?: string | number);
}>();
const handleUpdate = numeric
  ? (val?: number) => emit("update:model-value", val)
  : (val?: string) => emit("update:model-value", val);
</script>
