<template>
  <ControlField
    :title="title"
    :field-type="fieldType"
    :required="required === true"
    :default-value="defaultValue"
    :desc="desc"
    @reset="handleUpdate()"
  >
    <HstNumber
      :model-value="modelValue"
      :title="title"
      @update:model-value="handleUpdate"
    />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import type { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldNumberProp = ControlFieldProps & { modelValue?: string };

defineProps<ControlFieldNumberProp>();
const emit = defineEmits<{
  (e: "update:model-value", val?: number);
}>();
const handleUpdate = (val?: number) => emit("update:model-value", val);
</script>
