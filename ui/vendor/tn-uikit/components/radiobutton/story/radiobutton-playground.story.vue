<template>
  <Story title="TNRadio/Playground" group="form" :layout="{ type: 'grid', width: '15%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.label" title="label" field-type="string" desc="Текст рядом с кнопкой" />
      <ControlFieldText
        v-model="state.itemValue"
        title="itemValue"
        field-type="string | number"
        required
        desc="Значение данного элемента в списке радио-кнопок"
      />
      <ControlFieldText v-model="state.summaryValue" title="summaryValue" field-type="string | number" desc="Значение выбранного элемента" />
      <ControlFieldBoolean
        v-model="state.disabled"
        title="disabled"
        field-type="boolean"
        desc="Делает радио-кнопку недоступной к выбору, не влияя на ее выбранность"
      />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль у компонента)" />
    </template>
    <Variant title="TNRadio" :init-state="() => ({ ...radioDefaultState, itemValue: 0 })" auto-props-disabled>
      <template #default="{ state }">
        <TNRadio v-bind="filterState(state)" :model-value="currentValue" @input="((currentValue = $event), logEvent('input', { $event }))" />
      </template>
    </Variant>
    <Variant title="Блокировка" :init-state="() => ({ ...radioDefaultState, itemValue: 1, disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNRadio v-bind="filterState(state)" :model-value="currentValue" @input="((currentValue = $event), logEvent('input', { $event }))" />
      </template>
    </Variant>
    <Variant title="Текст ошибки" :init-state="() => ({ ...radioDefaultState, itemValue: 2, error: 'Radio error' })" auto-props-disabled>
      <template #default="{ state }">
        <TNRadio v-bind="filterState(state)" :model-value="currentValue" @input="((currentValue = $event), logEvent('input', { $event }))" />
      </template>
    </Variant>
    <Variant title="Текст предупреждения" :init-state="() => ({ ...radioDefaultState, itemValue: 3, warn: 'Radio warn' })" auto-props-disabled>
      <template #default="{ state }">
        <TNRadio v-bind="filterState(state)" :model-value="currentValue" @input="((currentValue = $event), logEvent('input', { $event }))" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";

const currentValue = ref<string>("");

const radioDefaultState = {
  label: "radio button"
};
</script>

<docs lang="md">
[Документация](./radiobutton.story.md)
</docs>
