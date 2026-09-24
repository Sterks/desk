<template>
  <Story title="TNTree/Блокировка элемента" group="form" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldJson v-model="state.modelValue" title="modelValue" field-type="Array<string | number>" desc="Значение value переменной для компонента" />
      <ControlFieldBoolean v-model="state.isAsync" title="isAsync" field-type="boolean" desc="Асинхронное дерево" />
      <ControlFieldBoolean v-model="state.isDependsParent" title="isDependsParent" field-type="boolean" default-value="true" desc="Авто-выбор родителя" />
      <ControlFieldBoolean
        v-model="state.multiple"
        title="multiple"
        field-type="boolean"
        default-value="true"
        desc="Опредеяет можно ли выбрать несколько элементов дерерва"
      />
      <ControlFieldBoolean
        v-model="state.childRecursiveSelect"
        title="childRecursiveSelect"
        field-type="boolean"
        default-value="true"
        desc="При true, выбор родительского элемента автоматически выберет все дочерние элементы"
      />
      <ControlFieldBoolean v-model="state.simple" title="simple" field-type="boolean" desc="Изменяет стиль заголовка элемента, когда элемент выбран" />
      <ControlFieldBoolean
        v-model="state.highlightDisable"
        title="highlightDisable"
        field-type="boolean"
        desc="Изменяет стиль заголовка элемента, когда элемент отключен или выбор элемента отключен"
      />
    </template>
    <Variant id="disabled" title="Блокировка пунктов" :init-state="() => ({ options: demoTreeDisable, modelValue: [] })" auto-props-disabled>
      <template #default="{ state }">
        <TNTree
          v-bind="filterState(state)"
          @load-options="logEvent('loadOptions', { $event })"
          @update:model-value="logEvent('update:modelValue', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";

interface Option {
  id: string | number;
  parent?: Option;
  title: string;
  isCheck: boolean;
  isOpen?: boolean;
  isLoad?: boolean;
  disabled?: boolean;
  disableSelect?: boolean;
  deep: number;
  children?: Option[];
  isDependsParent?: boolean;
  iconButton?: string;
}

const demoTreeDisable: Option[] = [
  {
    id: 1,
    deep: 0,
    title: "Категория 1",
    isCheck: false,
    isLoad: false,
    isOpen: false,
    disabled: true,
    children: []
  },
  {
    id: 2,
    deep: 0,
    title: "Категория 2",
    isCheck: false,
    isOpen: false,
    isLoad: false,
    disableSelect: true,
    children: []
  }
];
</script>

<docs lang="md">
[Документация](./tree.story.md)
</docs>
