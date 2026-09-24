<template>
  <Story title="TNCheckboxRadioGroup/Playground" group="form" :layout="{ type: 'grid', width: '60%' }">
    <template #controls="{ state }">
      <ControlFieldSelect
        v-model="state.type"
        title="type"
        field-type="checkbox | radio"
        default-value="checkbox"
        :options="['checkbox', 'radio']"
        desc="Тип группы компонента"
      />
      <ControlFieldJson
        v-model="state.modelValue"
        title="modelValue"
        required
        field-type="Array<string | number | boolean> | (string | number | boolean)"
        desc="Значение"
      />
      <ControlFieldJson
        v-model="state.options"
        title="options"
        field-type="ITNCheckboxRadioGroupOption[]"
        desc="Массив значений для каждого внутреннего TNRadio/TNCheckbox'a"
      />
    </template>
    <Variant title="Вариант с TNCheckbox" :init-state="() => ({ ...checkboxDefaultValue, type: 'checkbox', modelValue: undefined })" auto-props-disabled>
      <template #default="{ state }">
        <b style="display: block; margin-bottom: 10px">
          У компонента есть особенность в типе данных: <br />
          при type="checkbox" используется <u>Array&lt;string | number | boolean&gt;</u>
        </b>
        <span style="display: block; margin-bottom: 14px"> modelValue: {{ state.modelValue }} </span>
        <TNCheckboxRadioGroup v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant title="Вариант с TNRadio" :init-state="() => ({ ...checkboxDefaultValue, type: 'radio', modelValue: undefined })" auto-props-disabled>
      <template #default="{ state }">
        <b style="display: block; margin-bottom: 10px"> При type="radio" используется <u>string | number | boolean</u> </b>
        <span style="display: block; margin-bottom: 14px"> modelValue: {{ state.modelValue }} </span>
        <TNCheckboxRadioGroup v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import TNCheckboxRadioGroup from "../checkbox-radio-group.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";

const checkboxDefaultValue = {
  type: "radio",
  options: [
    {
      label: "Вариант 1",
      itemValue: "value_1"
    },
    {
      label: "Вариант 2",
      itemValue: "value_2"
    }
  ]
};
</script>

<docs lang="md">
[Документация](./checkbox-radio-group.story.md)
</docs>
