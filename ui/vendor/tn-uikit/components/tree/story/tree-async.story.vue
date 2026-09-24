<template>
  <Story title="TNTree/Асинхронные запросы" group="form" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldJson v-model="state.modelValue" title="modelValue" field-type="Array<string | number>" desc="Значение value переменной для компонента" />
      <ControlFieldBoolean v-model="state.isAsync" title="isAsync" field-type="boolean" desc="Асинхронное дерево" />
      <ControlFieldJson v-model="state.options" title="options" field-type="TNTreeProps.Option[]" default-value="[]" desc="Массив опций для дерева" />
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
    <Variant
      id="async"
      title="Асинхронное получение элементов списка"
      :init-state="() => ({ isAsync: true, modelValue: [], options: treeAsync })"
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNTree
          v-bind="filterState(state)"
          :options="state.options"
          @load-options="(loadOptions($event, state), logEvent('loadOptions', { $event }))"
          @update:model-value="(updateAsyncValueHandler($event, state), logEvent('update:modelValue', { $event }))"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TNTreeProps } from "../tree.types";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import TNTree from "../tree.vue";

const treeAsync = ref<TNTreeProps.Option[]>([
  {
    id: 1,
    deep: 0,
    title: "Категория 1",
    isCheck: false,
    isOpen: false,
    isLoad: false
  },
  {
    id: 2,
    deep: 0,
    title: "Категория 2",
    isCheck: false,
    isLoad: false,
    isOpen: false,
    children: []
  },
  {
    id: 3,
    deep: 0,
    title: "Категория 3",
    isCheck: false
  }
]);

const findOptionIndexesById = (options: TNTreeProps.Option[], targetId: string | number): number[] | null => {
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];

    if (option.id === targetId) {
      return [index];
    }

    if (option.children?.length) {
      const childPath = findOptionIndexesById(option.children, targetId);

      if (childPath) {
        return [index, ...childPath];
      }
    }
  }

  return null;
};

const updateOptionByIndexes = (options: TNTreeProps.Option[], indexes: number[], value: Partial<TNTreeProps.Option>): TNTreeProps.Option[] => {
  if (!indexes.length) {
    return options;
  }

  const updateLevel = (currentOptions: TNTreeProps.Option[], depth: number): TNTreeProps.Option[] => {
    const targetIndex = indexes[depth];

    return currentOptions.map((option, index) => {
      if (index !== targetIndex) {
        return option;
      }

      if (depth === indexes.length - 1) {
        return {
          ...option,
          ...value
        };
      }

      return {
        ...option,
        children: option.children ? updateLevel(option.children, depth + 1) : option.children
      };
    });
  };

  return updateLevel(options, 0);
};

const loadOptions = (option: TNTreeProps.Option, state: { options: TNTreeProps.Option[]; modelValue: number[] }) => {
  setTimeout(() => {
    const optionPosition = findOptionIndexesById(state.options, option.id);

    if (!optionPosition?.length) {
      return;
    }

    if (optionPosition?.length > 2) {
      state.options = updateOptionByIndexes(state.options, optionPosition, { ...option, isLoad: false, isOpen: true });
      return;
    }

    const childrenIndex = optionPosition.map(index => {
      return index + 1;
    });

    const children = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, index) => ({
      id: Number(`${childrenIndex.join()}${index}`),
      deep: optionPosition.length,
      parent: option,
      title: `Категория ${childrenIndex.join(".")}.${index + 1}`,
      isCheck: false,
      isOpen: false,
      isLoad: false,
      children: []
    }));

    state.options = updateOptionByIndexes(state.options, optionPosition, { ...option, children, isLoad: false, isOpen: true });
  }, 1000);
};

const updateAsyncValueHandler = (value: number[], state: { options: TNTreeProps.Option[]; modelValue: number[] }) => {
  if (value) {
    state.modelValue = value;
  }
};
</script>

<docs lang="md">
[Документация](./tree.story.md)
</docs>
