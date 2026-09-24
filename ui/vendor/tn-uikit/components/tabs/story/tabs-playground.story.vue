<template>
  <Story title="TNTabs/Playground" group="navigation" :layout="{ type: 'grid', width: '40%' }" auto-props-disabled>
    <template #controls="{ state }">
      <ControlFieldJson
        v-model="state.modelValue"
        title="modelValue"
        field-type="String | Number"
        default-value="0"
        desc="Значение value переменной для компонента"
      />
      <ControlFieldSelect v-model="state.type" title="type" field-type='"soft" | "accent"' desc="Стиль компонента" :options="['soft', 'accent']" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" default-value="false" desc="Выключение компонента" />
      <ControlFieldBoolean v-model="state.scrollIntoView" title="scrollIntoView" field-type="boolean" default-value="false" desc="Функция скролла к табу" />
      <ControlFieldSelect
        v-model="state.size"
        title="size"
        field-type="'sm' | 'md' | 'lg'"
        default-value="md"
        desc="Размер компонента"
        :options="['sm', 'md', 'lg']"
      />
      <ControlFieldJson v-model="state.options" title="options" field-type="TNTabsOption[]" required desc="Варианты выбора табов" />
    </template>
    <Variant id="tabs" title="TNTabs" :init-state="() => tabsDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="disabled" title="Блокировка" :init-state="() => ({ ...tabsDefaultState, disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="soft" title="Тонкое оформление" :init-state="() => ({ ...tabsDefaultState, type: 'soft' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="large" title="Большой размер" :init-state="() => ({ ...tabsDefaultState, size: 'lg' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="small" title="Маленький размер" :init-state="() => ({ ...tabsDefaultState, size: 'sm' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="icons" title="Иконки в пунктах" :init-state="() => ({ ...tabsDefaultState, options: optionsWithIcons })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
      </template>
    </Variant>
    <Variant id="slots" title="Использование слотов" :init-state="() => ({ ...tabsDefaultState })" auto-props-disabled>
      <template #default="{ state }">
        <TNTabs v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })">
          <template #beforeContent="props">
            {{ props.item.id }}
          </template>
          <template #afterContent="props">
            <TNIcon v-if="props.active" name="check" />
          </template>
        </TNTabs>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import type { TNTabsOption } from "../tabs.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { logEvent } from "histoire/client";
import { filterState } from "../../../consts/consts";

const tabsDefaultState = {
  modelValue: 1,
  options: [
    {
      id: 1,
      name: "Label 1",
      secondaryText: "11"
    },
    {
      id: 2,
      name: "Label 2",
      secondaryText: "22"
    },
    {
      id: 3,
      name: "Label 3",
      secondaryText: "33"
    },
    {
      id: 4,
      name: "Label 4",
      secondaryText: "44"
    }
  ]
};

const optionsWithIcons: TNTabsOption[] = [
  {
    id: 1,
    name: "Label",
    icon: {
      name: "star"
    }
  },
  {
    id: 2,
    name: "Label 2",
    icon: {
      name: "bell"
    }
  },
  {
    id: 3,
    name: "Label 3",
    icon: {
      name: "filter-1"
    }
  },
  {
    id: 4,
    name: "Label 4",
    icon: {
      name: "map"
    }
  }
];
</script>

<docs lang="md">
[Документация](./tabs.story.md)
</docs>
