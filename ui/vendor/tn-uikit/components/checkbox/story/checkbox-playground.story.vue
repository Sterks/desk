<template>
  <Story title="TNCheckbox/Playground" group="form" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean v-model="state.modelValue" title="modelValue" field-type="boolean" required desc="Значение для чекбокса" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" required desc="Отключение чекбокса" />
      <ControlFieldText v-model="state.label" title="label" field-type="string" desc="Текст для заголовка компонента" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" desc="Текст для описания компонента" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст для предупреждения" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст для ошибки" />
    </template>
    <Variant title="TNCheckbox" :init-state="() => checkboxDefaultValue" auto-props-disabled>
      <template #default="{ state }">
        <TNCheckbox v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant title="Отключенный чекбокс (disabled)" :init-state="() => ({ ...checkboxDefaultValue, disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNCheckbox v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant title="Чекбокс с описанием" :init-state="() => ({ ...checkboxDefaultValue, description: 'Checkbox description' })" auto-props-disabled>
      <template #default="{ state }">
        <TNCheckbox v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant title="Чекбокс с текстом предупреждения" :init-state="() => ({ ...checkboxDefaultValue, warn: 'Checkbox warn' })" auto-props-disabled>
      <template #default="{ state }">
        <TNCheckbox v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant title="Чекбокс с текстом ошибки" :init-state="() => ({ ...checkboxDefaultValue, error: 'Checkbox error' })" auto-props-disabled>
      <template #default="{ state }">
        <TNCheckbox v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import { logEvent } from "histoire/client";
import { filterState } from "../../../consts/consts";

const checkboxDefaultValue = {
  label: "Checkbox text"
};
</script>

<docs lang="md">
[Документация](./checkbox.story.md)
</docs>
