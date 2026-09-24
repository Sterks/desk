<template>
  <ControlField :title="title" :field-type="fieldType" :required="required === true" :default-value="defaultValue" :desc="desc" @reset="handleUpdate()">
    <HstCheckbox :model-value="modelValue" :title="title" @update:model-value="handleUpdate" />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldTextProp = ControlFieldProps & { modelValue?: string | boolean };


defineProps<ControlFieldTextProp>();
const emit = defineEmits<{
  (e: "update:model-value", val?: string | boolean);
}>();
const handleUpdate = (val?: string | boolean) => emit("update:model-value", val);
</script>
