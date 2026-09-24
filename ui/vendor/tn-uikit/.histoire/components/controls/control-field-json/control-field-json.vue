<template>
  <ControlField :title="title" :field-type="fieldType" :required="required === true" :default-value="defaultValue" :desc="desc" @reset="handleUpdate()">
    <HstJson :model-value="modelValue" :title="title" @update:model-value="handleUpdate" />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import type { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldTextProp = ControlFieldProps & { modelValue?: unknown };


defineProps<ControlFieldTextProp>();
const emit = defineEmits<{
  (e: "update:model-value", val?: unknown);
}>();
const handleUpdate = (val?: unknown) => emit("update:model-value", val);
</script>
