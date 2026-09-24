<template>
  <div class="control-field" :class="{'control-field--required': required === true, 'tn-dark-theme': true}">
    <div v-if="desc" class="control-description">{{ desc }}</div>
    <div class="control-field__control">
      <div class="control-field__control__field">
        <slot />
      </div>
      <div class="control-field__control__clear" @click="handleReset"><TNIcon name="reload" size="16"/></div>
    </div>
    <div v-if="fieldType" class="control-field__field-type">Тип: <code>{{ fieldType }}</code></div>
    <div v-if="defaultValue" class="control-field__default-value">Значение по умолчанию: <code>{{ defaultValue }}</code></div>
  </div>
</template>

<script lang="ts" setup>
import TNIcon from "../../../../components/icons/icon.vue";
import type { ControlFieldProps } from "./control-field.type";

defineProps<ControlFieldProps>();

const emit = defineEmits<{
  (e: "reset"): void;
}>()

const handleReset = () => emit("reset")
</script>

<style lang="css" scoped>
.control-field {
  --text-color: var(--neutral-100);
  --hover-bg: var(--neutral-15);
  --code-bg: var(--neutral-25);
  --code-text: var(--neutral-100);
}

html.htw-dark .control-field {
  --text-color: var(--neutral-5);
  --hover-bg: var(--neutral-80);
  --code-bg: var(--neutral-95);
  --code-text: var(--neutral-10);
}

.control-field {
  padding: 10px;
  color: var(--text-color);
}



.control-field:hover {
  background: var(--hover-bg);
}

.control-description {
  margin-bottom: 0.5rem;
}

.control-field code {
  background: var(--code-bg);
  color: var(--code-text);
  display: inline-block;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 5px;
  font-family: monospace;
}

.control-field__control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.control-field__control__field {
  width: 100%;
}

.control-field :deep(.histoire-wrapper) {
  padding: 3px 0;
}

.control-field :deep(.histoire-wrapper:hover) {
  background-color: unset;
}

.control-field--required :deep(.histoire-wrapper > span:first-of-type:after ) {
  content: '*';
  font-weight: bold;
  color: red;
  margin-left: 2px;
}
</style>

