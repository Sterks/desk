<template>
  <Story title="TNPagination/Playground" group="data" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldNumber v-model="state.pageSize" title="pageSize" field-type="number" desc="Текущий размер страницы" />
      <ControlFieldNumber v-model="state.currentPage" title="currentPage" field-type="number" required desc="Текущая страница" />
      <ControlFieldNumber v-model="state.pagesCount" title="pagesCount" field-type="number" required desc="Общее количество страниц" />
      <ControlFieldNumber
        v-model="state.centerElementsCount"
        title="centerElementsCount"
        field-type="number"
        default-value="3"
        desc="Количество элементов в центре"
      />
      <ControlFieldBoolean v-model="state.showMoreButton" title="showMoreButton" field-type="boolean" desc="Показывает кнопку в конце списка" />
      <ControlFieldBoolean v-model="state.moreButtonDisabled" title="moreButtonDisabled" field-type="boolean" desc="Отключение кнопки в конце списка" />
      <ControlFieldText
        v-model="state.moreButtonText"
        title="moreButtonText"
        field-type="string"
        default-value="Показать ещё"
        desc="Текст кнопки в конце списка"
      />
      <ControlFieldJson v-model="state.pageSizeVariants" title="pageSizeVariants" field-type="number[]" default-value="[]" desc="Варианты размеров страниц" />
      <ControlFieldText
        v-model="state.pageSizeText"
        title="pageSizeText"
        field-type="string"
        default-value="Показать на странице"
        desc="Текст кнопки выбора размера"
      />
      <ControlFieldSelect v-model="state.size" title="size" field-type="md | lg" default-value="lg" desc="Размер компонента" :options="['md', 'lg']" />
    </template>
    <Variant title="TNPagination" :init-state="() => paginationDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNPagination
          v-bind="filterState(state)"
          @click:more="logEvent('click:more', { $event })"
          @select:size="(selectSizeHandler($event, state), logEvent('select:size', { $event }))"
          @select:page="(selectPageHandler($event, state), logEvent('select:page', { $event }))"
        />
      </template>
    </Variant>
    <Variant
      title="Кнопка загрузки следующей страницы вниз"
      :init-state="
        () => ({
          ...paginationDefaultState,
          showMoreButton: true,
          moreButtonText: 'Показать ещё'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPagination
          v-bind="filterState(state)"
          @click:more="logEvent('click:more', { $event })"
          @select:size="(selectSizeHandler($event, state), logEvent('select:size', { $event }))"
          @select:page="(selectPageHandler($event, state), logEvent('select:page', { $event }))"
        />
      </template>
    </Variant>
    <Variant
      title="Управление размером страницы"
      :init-state="
        () => ({
          ...paginationDefaultState,
          pageSizeVariants: [5, 10, 15],
          pageSizeText: 'Показать'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPagination
          v-bind="filterState(state)"
          @click:more="logEvent('click:more', { $event })"
          @select:size="(selectSizeHandler($event, state), logEvent('select:size', { $event }))"
          @select:page="(selectPageHandler($event, state), logEvent('select:page', { $event }))"
        />
      </template>
    </Variant>
    <Variant title="Размер компонента" :init-state="() => ({ ...paginationDefaultState, size: 'lg' })" auto-props-disabled>
      <template #default="{ state }">
        <TNPagination
          v-bind="filterState(state)"
          @click:more="logEvent('click:more', { $event })"
          @select:size="(selectSizeHandler($event, state), logEvent('select:size', { $event }))"
          @select:page="(selectPageHandler($event, state), logEvent('select:page', { $event }))"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";

const paginationDefaultState = {
  pageSize: 20,
  currentPage: 1,
  pagesCount: 30,
  pageSizeVariants: []
};

const selectSizeHandler = (size: number, state: { pageSize: number }) => {
  state.pageSize = size;
};

const selectPageHandler = (page: number, state: { currentPage: number }) => {
  state.currentPage = page;
};
</script>

<docs lang="md">
[Документация](./pagination.story.md)
</docs>
