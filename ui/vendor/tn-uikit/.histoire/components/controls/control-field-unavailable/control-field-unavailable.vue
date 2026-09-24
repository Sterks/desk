<template>
  <ControlField
    class="control-field_unavailable"
    :title="title"
    :field-type="fieldType"
    :required="required === true"
    :default-value="defaultValue"
    :desc="desc"
    :clearable="false"
    @reset="handleUpdate()"
  >
    <HstText :title="title" />
  </ControlField>
</template>
<script setup lang="ts">
import ControlField from "../control-field/control-field.vue";
import type { ControlFieldProps } from "../control-field/control-field.type";
type ControlFieldTextProp = ControlFieldProps & { modelValue?: string };

defineProps<ControlFieldTextProp>();
</script>
<style lang="css">
.control-field_unavailable .htw-grow,
.control-field_unavailable .control-field__control__clear {
  display: none;
}

.control-field_unavailable::after {
  margin-top: 10px;
  box-sizing: border-box;
  display: block;
  width: 100%;
  font-size: 14px;
  content: "Для ознакомления. Параметр не удастся применить в этой песочнице";
  line-height: 16px;
  color: var(--content-secondary-enabled);
  background-color: var(--background-tertiary-enabled);
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
