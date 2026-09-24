<template>
  <Story title="TNProgressBar/Playground" group="data" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldNumber
        v-model="state.modelValue"
        title="modelValue"
        field-type="String | Number"
        default-value="1"
        required
        desc="Значение value переменной для компонента"
      />
      <ControlFieldNumber v-model="state.quantity" title="quantity" field-type="String | Number" default-value="1" required desc="Количество табов" />
    </template>
    <Variant title="TNProgressBar" :init-state="() => progressBarDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNProgressBar
          v-model="state.modelValue"
          v-bind="filterState(state)"
          :quantity="state.quantity"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import { logEvent } from "histoire/client";
import TNProgressBar from "../progress-bar.vue";
import { filterState } from "../../../consts/consts";

const progressBarDefaultState = {
  modelValue: 1,
  quantity: 3
};
</script>

<docs lang="md">
[Документация](./progress-bar.story.md)
</docs>
