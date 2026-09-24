<template>
  <ControlField :title="title" :field-type="fieldType" :required="required === true" :default-value="defaultValue" :desc="desc" @reset="handleUpdate()">
    <HstText :model-value="modelValue" :title="title" @update:model-value="handleUpdate" />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import type { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldTextProp = ControlFieldProps & { modelValue?: string };


defineProps<ControlFieldTextProp>();
const emit = defineEmits<{
  (e: "update:model-value", val?: string);
}>();
const handleUpdate = (val?: string) => emit("update:model-value", val);
</script>
