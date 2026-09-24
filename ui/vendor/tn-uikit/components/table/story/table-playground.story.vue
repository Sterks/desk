<template>
  <keep-alive>
    <Story :layout="{ type: 'grid', width: '90%' }" group="data" title="TNTable/Playground">
      <template #controls="{ state }">
        <ControlFieldJson v-model="state.header" desc="Массив колонок" field-type="TNTable.Header[]" required title="header" />
        <ControlFieldJson v-model="state.data" desc="Массив строк для таблицы" field-type="TNTable.Data[]" required title="data" />
        <ControlFieldJson v-model="state.sort" default-value="[]" desc="Массив объектов сортировки" field-type="TNTable.sort[]" title="sort" />
        <ControlFieldJson v-model="state.selectList" default-value="[]" desc="Массив ID выбранных строк" field-type="(string | number)[]" title="selectList" />
        <ControlFieldJson v-model="state.rowMenu" desc="Массив пунктов для выпадающего меню строки" field-type="ITNDropdownMenu[]" title="rowMenu" />
        <ControlFieldJson
          v-model="state.selectListOptions"
          desc="Массив опций для выбранных строк таблицы"
          field-type="TNTable.ListOption[]"
          title="selectListOptions"
        />
        <ControlFieldBoolean
          v-model="state.filterableColumns"
          desc="Добавляет возможность фильтровать столбцы таблицы"
          field-type="boolean"
          title="filterableColumns"
        />
        <ControlFieldBoolean
          v-model="state.sortableColumns"
          desc="Возможность сортировать колонки, а так же менять их местами"
          field-type="boolean"
          title="sortableColumns"
        />
        <ControlFieldBoolean
          v-model="state.selectable"
          default-value="false"
          desc="Возможность выбрать строку таблицы"
          field-type="boolean"
          title="selectable"
        />
        <ControlFieldSelect
          v-model="state.loading"
          :options="['full', 'partial', 'none']"
          default-value="none"
          desc="Состояние загрузки таблицы"
          field-type="full | partial | none"
          title="loading"
        />
        <ControlFieldSelect
          v-model="state.selectAllLogic"
          :options="[0, 1]"
          default-value="TNTable.SelectAllLogic.DataReset"
          desc='Функционал изменение поведения кнопки "выбрать все" при выбранных элементах'
          field-type="TNTable.SelectAllLogic"
          numeric
          title="selectAllLogic"
        />
        <ControlFieldJson v-model="state.initialVisibleFields" desc="Начальные видимые столбцы" field-type="String[]" title="initialVisibleFields" />
        <ControlFieldJson v-model="state.disabledFields" default-value="[]" desc="Отключенные поля" field-type="String[]" title="disabledFields" />
        <ControlFieldNumber
          v-model="state.headerScrollAppear"
          default-value="48"
          desc='Расстояние скролла, при котором появится "липкий" хедер'
          field-type="number"
          title="headerScrollAppear"
        />
        <ControlFieldBoolean v-model="state.scrollOnUpdate" desc="Прокрутка вверх таблицы при обновлении данных" field-type="boolean" title="scrollOnUpdate" />
        <ControlFieldBoolean v-model="state.clickableRows" desc="Возможность кликать на строку таблицы" field-type="boolean" title="clickableRows" />
        <ControlFieldText v-model="state.infoPanel" desc="Текст для отображения в панели справа снизу" field-type="string" title="infoPanel" />
        <ControlFieldNumber
          v-model="state.skeletonItemsCount"
          default-value="10"
          desc="Количество строк скелетона при загрузке"
          field-type="number"
          title="skeletonItemsCount"
        />
        <ControlFieldUnavailable desc="Функция для коррекции ширины нижней панели" field-type="(width: number) => number" title="stickyPanelWidthCallback" />
        <ControlFieldBoolean v-model="state.showHeader" default-value="true" desc="Отображение хедера" field-type="boolean" title="showHeader" />
        <ControlFieldJson v-model="state.disabledFields" desc="Начальное состояние сортировки столбцов" field-type="String[]" title="initialFieldsSort" />
        <ControlFieldBoolean v-model="state.resizableColumns" desc="Возможность менять ширину колонок" field-type="boolean" title="resizableColumns" />
        <ControlFieldBoolean
          v-model="state.resettableFilter"
          desc="Добавляет кнопку сброса фильтрации в меню фильтрации столбцов"
          field-type="boolean"
          title="resettableFilter"
        />
        <ControlFieldJson
          v-model="state.resetFields"
          desc="Cтолбцы к которым произойдёт сброс фильтрации при нажатии кнопки сброса"
          field-type="String[]"
          title="resetFields"
        />
        <ControlFieldNumber
          v-model="state.scrollAutoHideDelay"
          desc="Задержка авто-скрытия скроллбаров"
          field-type="Number | String"
          title="scrollAutoHideDelay"
        />
        <ControlFieldJson
          v-model="state.outerVisibleFields"
          desc="Принимает в себя массив полей, которые будут видны"
          field-type="String[]"
          title="outerVisibleFields"
        />
        <ControlFieldBoolean
          v-model="state.closeSettingsOnScroll"
          default-value="true"
          desc="Возможность закрытия настроек при скролле"
          field-type="boolean"
          title="closeSettingsOnScroll"
        />
        <ControlFieldText v-model="state.selectedRowId" desc="ID выбранной строки таблицы" field-type="string" title="selectedRowId" />
        <ControlFieldSelect
          v-model="state.scrollAutoHide"
          :options="['never', 'scroll', 'move', 'leave']"
          default-value="scroll"
          desc="Настройка параметра autoHide для TNScroll тела таблицы"
          field-type="boolean | string"
          title="scrollAutoHide"
        />
      </template>
      <Variant id="main" :init-state="() => defaultProps" auto-props-disabled title="TNTable">
        <template #default="{ state }">
          <TNTabs v-model="selectedTab" :options="tabOptions" @update:model-value="selectTabHandler" />
          <div class="table-wrapper">
            <TNTable
              v-if="selectedTab === 'main'"
              class="table-wrapper__item"
              v-bind="filterState(state)"
              :data="data"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'select'"
              class="table-wrapper__item"
              v-bind="filterState(state)"
              selectable
              :data="data"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'load-state'"
              class="table-wrapper__item"
              v-bind="filterState(state)"
              loading="full"
              :data="[]"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'column'"
              class="table-wrapper__item"
              v-bind="filterState(state)"
              :disabled-fields="['name']"
              :data="data"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'component'"
              class="table-wrapper__item"
              v-bind="state"
              :header="componentHeader"
              :data="componentData"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'filter-select'"
              class="table-wrapper__item"
              v-bind="state"
              :header="filterHeader"
              :data="data"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
            <TNTable
              v-else-if="selectedTab === 'filter-method'"
              class="table-wrapper__item"
              v-bind="state"
              :header="filterMethodHeader"
              :data="data"
              @column-sort-update="logEvent('columnSortUpdate', { $event })"
              @scroll="logEvent('scroll', { $event })"
              @select="(selectHandler($event, state), logEvent('select', { $event }))"
              @toggle-sort="(toggleSortHandler($event, state), logEvent('toggleSort', { $event }))"
              @click:link="(openLinkHandler($event), logEvent('click:link', { $event }))"
              @click:copy="(copyLinkHandler($event), logEvent('click:copy', { $event }))"
              @click:row="logEvent('click:row', { $event })"
              @click:context="logEvent('click:context', { $event })"
              @click:option="logEvent('click:option', { $event })"
              @click:tag="logEvent('click:tag', { $event })"
              @filter:input="logEvent('filter:input', { $event })"
              @filter:select-method="logEvent('filter:selectMethod', { $event })"
              @select:dropdown="logEvent('select:dropdown', { $event })"
              @select:filter="logEvent('select:filter', { $event })"
            />
          </div>
        </template>
      </Variant>
    </Story>
  </keep-alive>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from "vue";
import type { TNTable as TNTableType } from "../table.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import {
  adminsDataList,
  getComponentData,
  componentHeader,
  descriptionDataList,
  faceDataList,
  header,
  linkDataList,
  nameDataList,
  photoDataList,
  sbeDataList,
  selectListOptions,
  statusDataList,
  tabOptions,
  filterHeader,
  rowMenu,
  filterMethodHeader
} from "./common";

const data = ref<TNTableType.Data[]>([]);
const isTableDataLoading = ref<"full" | "partial" | "none">("none");
const scrollOnUpdate = ref<boolean>(false);
const selectedTab = ref<string | null>(null);
const paging = ref<{ offset: number; take: number }>({
  offset: 0,
  take: 20
});
const sorting = ref<{ id: string; direction: number }>({
  id: "",
  direction: 0
});
const defaultProps = computed(() => ({
  header,
  rowMenu,
  loadState: isTableDataLoading,
  filterableColumns: true,
  selectListOptions,
  selectList: [],
  sort: []
}));
const componentData = computed<TNTableType.Data[]>(() => getComponentData(data.value));

const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + min;
const selectHandler = (value: number[], state) => {
  state.selectList = value;
};
const toggleSortHandler = (sortItem: TNTableType.Sort, state) => {
  const sortItemIndex = state.sort.findIndex(s => s.fieldName === sortItem.fieldName);

  state.sort = [];

  sorting.value.id = sortItem.fieldName;
  sorting.value.direction = sortItem.direction;

  if (sortItemIndex === -1) {
    state.sort.push(sortItem);
  } else {
    state.sort.splice(sortItemIndex, 1, sortItem);
  }

  loadData();
};
const copyLinkHandler = (payload: { value: string }) => {
  void navigator.clipboard.writeText(payload.value);
};
const openLinkHandler = (payload: { value: string }) => {
  window.open(payload.value, "_blank");
};
const loadData = (append: boolean = false) => {
  isTableDataLoading.value = "partial";
  if (!append) {
    isTableDataLoading.value = "full";
    data.value = [];
  }
  setTimeout(() => {
    const newList = [];
    for (let i = 0; i < paging.value.take; i++) {
      newList.push({
        id: paging.value.offset + i,
        data: {
          photo: photoDataList[getRandomInt(0, photoDataList.length - 1)],
          name: nameDataList[getRandomInt(0, nameDataList.length - 1)],
          author: nameDataList[getRandomInt(0, nameDataList.length - 1)],
          status: statusDataList[getRandomInt(0, statusDataList.length - 1)],
          description: descriptionDataList[getRandomInt(0, descriptionDataList.length - 1)],
          admins: adminsDataList[getRandomInt(0, adminsDataList.length - 1)],
          link: linkDataList[getRandomInt(0, linkDataList.length - 1)],
          face: faceDataList[getRandomInt(0, faceDataList.length - 1)],
          sbe: sbeDataList[getRandomInt(0, sbeDataList.length - 1)]
        },
        rowMenu: getRandomInt(0, 2) > 1 ? rowMenu : undefined
      });
    }

    if (append) {
      data.value = sortData([...data.value, ...newList]);
    } else {
      data.value = sortData(newList);
    }
    isTableDataLoading.value = "none";
    nextTick().then(() => {
      scrollOnUpdate.value = false;
    });
  }, 1000);
};
const sortData = (list: TNTableType.Data[]): TNTableType.Data[] => {
  if (!sorting.value.id) return list;

  return list.sort((a, b) => {
    let aVal = a.data[sorting.value.id];
    let bVal = b.data[sorting.value.id];

    if (typeof aVal === "object" && aVal !== null) aVal = aVal.value;
    if (typeof bVal === "object" && bVal !== null) bVal = bVal.value;

    if (aVal === undefined || bVal === undefined) return 0;

    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sorting.value.direction === 0) {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
};
const selectTabHandler = (tab: string) => {
  const url = new URL(location.href);

  url.searchParams.set("variant", tab);

  window.history.pushState({}, "", url);
};

onMounted(() => {
  loadData();

  const variant = new URL(location.href).searchParams.get("variant");

  selectedTab.value = variant ?? "main";
});
</script>

<style scoped>
.table-wrapper {
  overflow: hidden;
  height: 800px;
  width: 100%;
}

.table-wrapper__item {
  height: 100%;
  width: 100%;
}
</style>

<docs lang="md">
[Документация](./table.story.md)
</docs>
