<template>
  <table
    ref="root"
    :class="{
      'tn-table_dragging': drag.dragging,
      'tn-table_vertical-dividers': resizableColumns
    }"
    class="tn-table"
    @mousemove="dragMove"
  >
    <TNScroll
      ref="scrollItem"
      class="tn-table__scroll"
      container-class="tn-table__scroll-wrapper"
      :auto-hide="scrollAutoHide"
      :auto-hide-delay="scrollAutoHideDelay"
      @scroll="scrollHandler"
    >
      <transition>
        <div v-if="haveHeaderSlot" class="tn-table__header-slot">
          <slot name="header"></slot>
        </div>
      </transition>
      <thead
        v-if="showHeader"
        ref="headerContainer"
        :class="{
          'tn-table__header-container_detached': isHeaderDetached,
          'tn-table__header-container_overflow': isHeaderSettingsVisible
        }"
        class="tn-table__header-container"
        @scroll="headerScrollHandler"
      >
        <transition>
          <div v-if="haveStickyHeaderSlot && isHeaderDetached" class="tn-table__detached-header-slot">
            <slot name="stickyHeader"></slot>
          </div>
        </transition>
        <tr class="tn-table__header-row">
          <th v-if="filterableColumns" class="tn-table__header-cell tn-table__header-cell_settings">
            <TNButton
              :class="{
                'tn-table__settings-button_enabled': isHeaderSettingsVisible
              }"
              :disabled="showLoader"
              class="tn-table__settings-button"
              icon="settings"
              type="link"
              size="lg"
              @click="settingsButtonClickHandler"
            />
          </th>
          <th
            :class="{
              'tn-table__header-cell_filler-expanded': !filterableColumns && ((rowMenu && rowMenu.length) || isAnyRowsHasMenu)
            }"
            class="tn-table__header-cell_filler"
          ></th>
          <transition name="tn-fade">
            <template v-if="isHeaderSettingsVisible">
              <slot
                v-if="haveSettingsSlot"
                name="settings"
                :column-filter-menu="columnFilterMenu"
                :disabled-fields="disabledFields"
                :visible-fields="visibleFields"
                :reset="resetFilterHandler"
                :select="toggleHeaderFilter"
                :close="closeSettingsWindow"
              />
              <TNTableFilter
                v-else
                :column-filter-menu="columnFilterMenu"
                :disabled-fields="disabledFields"
                :disabled-reset="isResetDisabled"
                :resettable="resettableFilter && !!resetFields"
                :visible-fields="visibleFields"
                class="tn-table__column-filter-menu"
                @close="closeSettingsWindow"
                @reset="resetFilterHandler"
                @select="toggleHeaderFilter"
              />
            </template>
          </transition>
          <th v-if="selectable" class="tn-table__header-cell tn-table__header-cell_checkbox">
            <TNCheckbox
              :class="{
                'tn-table__checkbox_indeterminate': !isAllItemsSelected && indeterminateHeaderCheckbox
              }"
              :model-value="isAllItemsSelected || indeterminateHeaderCheckbox"
              class="tn-table__checkbox"
              @update:model-value="selectAllHandler"
            />
          </th>
          <TransitionGroup :name="drag.headerAnimating ? 'tn-list' : undefined">
            <TableHeaderCell
              v-for="headerItem in filteredSortedHeaderItems"
              :key="headerItem.fieldName"
              ref="headerItems"
              :header-item="headerItem"
              :opened-column-filter="openedColumnFilter"
              :popper-options="popperOptions"
              :loading="loading ?? 'none'"
              :filter-model="filterModel"
              :sort="sort"
              :resized-columns="resizedColumns"
              :drag="drag"
              :resizable-columns="resizableColumns"
              @start-dragging="startDragging"
              @toggle-sort="toggleSort"
              @filter:input="filterInputHandler"
              @filter:select-method="$emit('filter:selectMethod', $event)"
              @filter:search="(...args) => $emit('filter:search', ...args)"
              @close-column-filter-dropdown="closeColumnFilterDropdown"
              @open-column-filter-dropdown="openColumnFilterDropdown"
              @resize-start-handler="resizeStartHandler"
            >
              <template #header-title-cell-before="scope">
                <slot name="header-title-cell-before" :header-item="scope.headerItem" />
              </template>
            </TableHeaderCell>
          </TransitionGroup>
          <teleport to="body">
            <th
              v-if="drag.dragging && drag.fieldName"
              :style="{ ...drag.style, ...dragItemPositionStyle }"
              class="tn-table__drag-item"
              @mouseup="releaseDragging"
              @mousemove="dragMove"
            >
              <p class="tn-table__header-title">
                {{ dragItemContent }}
              </p>
              <template v-if="drag.sort">
                <TNButton
                  :class="{
                    'tn-table__sort-button_enabled': isSortEnabled(drag.fieldName)
                  }"
                  :icon="sortIcon(drag.fieldName)"
                  class="tn-table__sort-button"
                  type="link"
                  size="lg"
                />
                <p v-if="isSortEnabled(drag.fieldName) && sort && sort.length > 1" class="tn-table__sort-counter">
                  {{ sort.findIndex(s => s.fieldName === drag.fieldName) + 1 }}
                </p>
              </template>
            </th>
          </teleport>
        </tr>
      </thead>
      <tbody class="tn-table__body-container">
        <template v-if="!showLoader || loading !== 'full'">
          <tr
            v-for="dataItem in filteredDataItems"
            :key="dataItem.id"
            :class="{
              'tn-table__body-row_clickable': isRowsClickable,
              'tn-table__body-row_selected': dataItem.id === selectedRowId
            }"
            class="tn-table__body-row"
            @click="dataItemClickHandler(dataItem.id)"
          >
            <td v-if="(rowMenu && rowMenu.length) || (dataItem.rowMenu && dataItem.rowMenu.length)" class="tn-table__body-cell tn-table__header-cell_context">
              <TNDropdown
                :is-visible="openedContextMenu === dataItem.id"
                :options="dataItem.rowMenu || rowMenu || []"
                :shrink="false"
                :popper-options="popperOptions?.contextDropdown || { strategy: 'fixed' }"
                :offset="{ mainAxis: 8 }"
                flip
                position="bottom-left"
                class="tn-table__dropdown"
                @select="dropdownSelectHandler"
                @click:outside="openedContextMenu = null"
              >
                <TNButton
                  :class="{
                    'tn-table__context-button_enabled': openedContextMenu === dataItem.id
                  }"
                  :icon="dataItem.contextIcon ? dataItem.contextIcon : 'more-vertical'"
                  class="tn-table__context-button"
                  type="link"
                  size="lg"
                  @click.stop="contextButtonClickHandler(dataItem.id)"
                />
              </TNDropdown>
            </td>
            <td v-else-if="isAnyRowsHasMenu" class="tn-table__body-cell_filler"></td>
            <td v-if="selectable" class="tn-table__body-cell tn-table__body-cell_checkbox" @click.stop>
              <TNCheckbox :model-value="selectList?.includes(dataItem.id)" @update:model-value="selectDataItem(dataItem.id)" />
            </td>
            <TransitionGroup :name="drag.bodyAnimating ? 'tn-list' : undefined">
              <TableBodyCell
                v-for="(dataFieldItem, index) in dataItem.data"
                :key="index"
                :index="index"
                :data-field-item="dataFieldItem"
                :popper-options="popperOptions"
                :cell-padding="cellPadding"
                :data-item="dataItem"
                :header="header"
                :resized-columns="resizedColumns"
                :visible-tooltip="visibleTooltip"
                @link-click="linkClickHandler"
                @body-text-mouse-enter="bodyTextMouseEnterHandler"
                @body-text-mouse-leave="bodyTextMouseLeaveHandler"
                @copy-click="copyClickHandler"
                @tag-click="tagClickHandler"
              >
                <slot :name="`cell-${index}`" :row="dataItem" :data="dataFieldItem" :field-name="index" />
              </TableBodyCell>
            </TransitionGroup>
          </tr>
        </template>
        <template v-if="showLoader">
          <div class="tn-table__skeleton-container">
            <div v-for="i in skeletonItemsCount" :key="i" :style="skeletonItemStyle" class="tn-table__skeleton-item"></div>
          </div>
        </template>

        <transition name="tn-fade">
          <div v-if="isSelectPanelVisible || infoPanel || isHeaderDetached" :style="{ width: rootWidth + 'px' }" class="tn-table__sticky-panel">
            <transition name="tn-fade">
              <TNButton v-if="isHeaderDetached" class="tn-table__to-top-button" icon="go-up" type="default" size="md" @click="scrollToTop" />
            </transition>
            <div class="tn-table__bottom-panel">
              <transition name="tn-fade">
                <div v-if="isSelectPanelVisible" class="tn-table__select-panel">
                  <div class="tn-table__select-panel-item tn-table__select-panel-item_selected">
                    <TNCheckbox
                      :class="{
                        'tn-table__checkbox_indeterminate': !isAllItemsSelected && indeterminateHeaderCheckbox
                      }"
                      :label="'Выбрано ' + selectList?.length"
                      :model-value="isAllItemsSelected || indeterminateHeaderCheckbox"
                      class="tn-table__checkbox"
                      @update:model-value="selectAllHandler"
                    />
                  </div>
                  <div
                    v-for="option in selectListOptions"
                    :key="option.id"
                    :class="{
                      'tn-table__select-panel-item_disabled': option.disabled
                    }"
                    class="tn-table__select-panel-item"
                  >
                    <TNButton
                      :disabled="option.disabled"
                      :icon="option.icon"
                      class="tn-table__select-panel-button"
                      size="sm"
                      type="white"
                      @click="optionClickHandler(option.id)"
                    >
                      {{ option.title }}
                    </TNButton>
                    <TNTooltip
                      v-if="option.disabledAnnotation"
                      :text="option.disabledAnnotation"
                      :popper-options="popperOptions?.disabledAnnotationTooltip || {}"
                      arrow-position="bottom-left"
                      class="tn-table__option-tooltip"
                      light
                      no-scroll
                    />
                  </div>
                </div>
              </transition>
              <transition name="tn-fade">
                <p v-if="infoPanel" class="tn-table__count-data">
                  {{ infoPanel }}
                </p>
              </transition>
            </div>
          </div>
        </transition>
      </tbody>
      <template v-if="haveEmptySlot && !data.length && !showLoader">
        <div class="tn-table__empty-container" :style="{ width: rootWidth + 'px' }">
          <slot name="empty"></slot>
        </div>
      </template>
      <transition>
        <div v-if="haveFooterSlot" class="tn-table__footer-slot">
          <slot name="footer"></slot>
        </div>
      </transition>
    </TNScroll>
  </table>
</template>

<script lang="ts" setup generic="TId extends string | number = string | number, TOptionId extends string = string, TMenuId extends string | number = string">
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, VNode, watch } from "vue";
import type { Ref } from "vue";

import TNButton from "../button/button.vue";
import TNCheckbox from "../checkbox/checkbox.vue";
import TNDropdown from "../dropdown/dropdown.vue";
import { TNTable } from "./table.types";
import type { IDrag } from "./table.types";
import type { ITNDropdownMenu } from "../dropdown/dropdown.types";
import type { IPopoverOptions } from "../popover/popover.types";
import TNScroll from "../scroll/scroll.vue";
import TNTooltip from "../tooltip/tooltip.vue";
import TableHeaderCell from "./components/table-header-cell.vue";
import TableBodyCell from "./components/table-body-cell.vue";
import type { ScrollbarsAutoHideBehavior } from "overlayscrollbars";

import TNTableFilter from "./components/table-filter.vue";

import type { IconNames } from "../icons/icon-names";

defineOptions({
  name: "TNTable"
});

const props = withDefaults(
  defineProps<{
    /** Конфигурация колонок таблицы */
    header: TNTable.Header[];
    /** Данные строк таблицы */
    data: TNTable.Data<TId, TMenuId>[];
    /** Состояние сортировки по колонкам */
    sort?: TNTable.Sort[];
    /** Список выбранных id строк */
    selectList?: TId[];
    /** Общий список пунктов контекстного меню строк */
    rowMenu?: ITNDropdownMenu<TMenuId>[];
    /** Список действий для панели выбранных строк */
    selectListOptions?: TNTable.ListOption<TOptionId>[];
    /** Логика кнопки "выбрать все" */
    selectAllLogic?: TNTable.SelectAllLogic;
    /** Включает меню видимости колонок */
    filterableColumns?: boolean;
    /** Включает drag&drop перестановку колонок */
    sortableColumns?: boolean;
    /** Включает выбор строк чекбоксами */
    selectable?: boolean;
    /** Состояние загрузки таблицы */
    loading?: "full" | "partial" | "none";
    /** Начальный список видимых полей */
    initialVisibleFields?: string[];
    /** Поля, которые нельзя скрыть в настройках */
    disabledFields?: string[];
    /** Порог скролла для detached header */
    headerScrollAppear?: number;
    /** Скроллить таблицу в начало при обновлении `data` */
    scrollOnUpdate?: boolean;
    /** Разрешает клик по строкам */
    clickableRows?: boolean;
    /** Текст справа в нижней sticky-панели */
    infoPanel?: string;
    /** Количество skeleton-строк при загрузке */
    skeletonItemsCount?: number;
    /** Колбэк корректировки ширины sticky-панели */
    stickyPanelWidthCallback?: (width: number) => number;
    /** Показывать заголовок таблицы */
    showHeader?: boolean;
    /** Начальный порядок колонок */
    initialFieldsSort?: string[];
    /** Добавляет кнопку сброса фильтров в настройках */
    resettableFilter?: boolean;
    /** Включает изменение ширины колонок */
    resizableColumns?: boolean;
    /** Поля, применяемые при сбросе фильтра */
    resetFields?: string[];
    /** Задержка автоскрытия скроллбаров */
    scrollAutoHideDelay?: string | number;
    /** Внешне управляемый список видимых полей */
    outerVisibleFields?: string[];
    /** Закрывать настройки таблицы при скролле */
    closeSettingsOnScroll?: boolean;
    /** ID выделенной строки */
    selectedRowId?: TId;
    /** Опции popper для внутренних элементов таблицы */
    popperOptions?: {
      headerDatepicker?: IPopoverOptions;
      headerSelect?: IPopoverOptions;
      headerDropdown?: IPopoverOptions;
      contextDropdown?: IPopoverOptions;
      textCellTooltip?: IPopoverOptions;
      disabledAnnotationTooltip?: IPopoverOptions;
    };
    /** Параметр `auto-hide` для `TNScroll` */
    scrollAutoHide?: boolean | ScrollbarsAutoHideBehavior;
  }>(),
  {
    sort: () => [],
    selectList: () => [],
    selectAllLogic: TNTable.SelectAllLogic.DataReset,
    loading: "none",
    disabledFields: () => [],
    headerScrollAppear: 48,
    skeletonItemsCount: 10,
    showHeader: true,
    closeSettingsOnScroll: true,
    popperOptions: () => ({}),
    scrollAutoHide: true
  }
);

const emit = defineEmits<{
  /** Вызывается при изменении списка выбранных строк */
  (e: "select", value: TId[]): void;
  /** Вызывается при изменении состояния сортировки колонки */
  (e: "toggleSort", value: TNTable.Sort): void;
  /** Вызывается при выборе опции в контекстном меню строки */
  (e: "select:dropdown", value: { optionId: TMenuId; itemId: TId }): void;
  /** Вызывается при изменении списка видимых полей */
  (e: "select:filter", value: string[]): void;
  /** Клик по тегу в ячейке */
  (e: "click:tag", value: { itemId: TId; fieldName: string }): void;
  /** Клик по ссылке в ячейке */
  (e: "click:link", value: { itemId: TId; fieldName: string; value: string }): void;
  /** Клик по копированию значения в ячейке */
  (e: "click:copy", value: { itemId: TId; fieldName: string; value?: string }): void;
  /** Клик по кнопке контекстного меню строки */
  (e: "click:context", value: TId): void;
  /** Клик по действию в панели выбранных строк */
  (e: "click:option", value: TOptionId): void;
  /** Клик по строке таблицы */
  (e: "click:row", value: TId): void;
  /** Обновление порядка колонок */
  (e: "columnSortUpdate", value: string[]): void;
  /** Ввод в фильтр колонки */
  (e: "filter:input", value: { fieldName: string; value?: TNTable.FilterValue }): void;
  /** Выбор метода фильтрации колонки */
  (e: "filter:selectMethod", value: { fieldName: string; value: string }): void;
  /** Вызывается при поиске в компоненте MultiSelect (если включен `searchable` в настройках столбца) */
  (
    e: "filter:search",
    value: {
      fieldName: string;
      value: string;
      selected: (string | number)[];
    }
  ): void;
  /** Событие прокрутки таблицы */
  (e: "scroll", value: Event): void;
}>();

const slots = defineSlots<
  {
    /** Слот над таблицей */
    header?: () => VNode[];
    /** Слот "липкого" хедера при скролле */
    stickyHeader?: () => VNode[];
    /** Кастомный слот настроек видимости колонок */
    settings?: (scope: {
      columnFilterMenu: ITNDropdownMenu[];
      disabledFields?: string[];
      visibleFields: string[];
      reset: () => void;
      select: (fieldValue: string) => void;
      close: () => void;
    }) => VNode[];
    /** Контент перед заголовком конкретной колонки */
    "header-title-cell-before"?: (scope: { headerItem: TNTable.Header }) => VNode[];
    /** Состояние пустой таблицы */
    empty?: () => VNode[];
    /** Слот под таблицей */
    footer?: () => VNode[];
  } & Partial<{
    /**
     * Динамический слот для кастомной отрисовки ячейки конкретного столбца
     * @example
     * ```vue
     * <TNTable :header="header" :data="data">
     *   <template v-slot:[`cell-status`]="{ row, data, fieldName }">
     *     <span>{{ row.id }}: {{ fieldName }} = {{ data }}</span>
     *   </template>
     * </TNTable>
     * ```
     * */
    [name: `cell-${string}`]: (scope: { row: TNTable.Data<TId, string | number>; data: TNTable.Value; fieldName: string }) => VNode[];
  }>
>();

const defaultDrag: IDrag = {
  dragging: false,
  fieldName: "",
  sort: false,
  headerAnimating: false,
  bodyAnimating: false,
  cursor: {
    initial: {
      top: 0,
      left: 0
    },
    delta: {
      top: 0,
      left: 0
    }
  },
  style: {
    width: "",
    height: "",
    top: 0,
    left: 0
  }
};
const defaultTooltip = { dataId: null, fieldName: "" };

const visibleFields = ref<string[]>([]);
const isHeaderSettingsVisible = ref<boolean>(false);
const openedContextMenu = ref<TId | null>(null) as Ref<TId | null>;
const drag = ref<IDrag>(defaultDrag);
const sortedFields = ref<string[]>([]);
const sortedDataFields = ref<string[]>([]);
const headerItems = ref<(typeof TableHeaderCell)[]>([]);
const headerContainer = ref<HTMLElement | null>(null);
const scrollWrapper = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);
const isHeaderDetached = ref<boolean>(false);
const visibleTooltip = ref<{ dataId: TId | null; fieldName: string }>(defaultTooltip) as Ref<{ dataId: TId | null; fieldName: string }>;
const showLoader = ref<boolean>(false);
const rootWidth = ref<number>(0);
const openedColumnFilter = ref<string>("");
const filterModel = ref<Record<string, TNTable.FilterValue | undefined>>({});
const resizeColumn = ref<{
  start: number;
  width: number;
  fieldName: string;
  startWidth: number;
} | null>(null);
const resizedColumns = ref<Record<string, number>>({});
const scrollItem = ref<typeof TNScroll | null>(null);

const scrollXDistances: { scrolled: number; fullScrollDistance: number } = {
  // Запись насколько таблица проскроллена по X оси и сколько в целом можно скроллить
  scrolled: 0,
  fullScrollDistance: 0
};
// Скроллится ли в данный момент таблица кодом
let isScrolling: boolean = false;
let timeout: ReturnType<typeof setTimeout> | null = null;
let animatingTimeout: ReturnType<typeof setTimeout> | null = null;
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;
const cellPadding = 24;

onBeforeMount(() => {
  initFilterValue();
});
onMounted(() => {
  if (props.filterableColumns && props.initialVisibleFields) {
    visibleFields.value = props.initialVisibleFields;
  } else {
    visibleFields.value = props.header.map(hi => hi.fieldName);
  }
  scrollWrapper.value = scrollItem.value?.$el?.querySelector(".tn-table__scroll-wrapper") || null;

  nextTick().then(() => {
    if (root.value) {
      rootWidth.value = (root.value.clientWidth || 0) - 32;
      if (props.stickyPanelWidthCallback) {
        rootWidth.value = props.stickyPanelWidthCallback(rootWidth.value);
      }
    }
  });

  const isPresetsIdentical =
    !props.initialFieldsSort || JSON.stringify([...props.initialFieldsSort].sort()) === JSON.stringify([...visibleFields.value].sort());

  if (props.initialFieldsSort && isPresetsIdentical) {
    sortedFields.value = [...props.initialFieldsSort];
  } else {
    sortedFields.value = [...visibleFields.value];
    // eslint-disable-next-line no-console
    console.warn("Значение параметра `initialFieldsSort` не соответствует отображаемым полям:", visibleFields.value);
  }
  sortedDataFields.value = [...sortedFields.value];
  showLoader.value = props.loading !== "none";
  windowResizeHandler();
  window.addEventListener("resize", windowResizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", windowResizeHandler);
});

const filteredHeaderItems = computed<TNTable.Header[]>(() => props.header.filter(hi => visibleFields.value.includes(hi.fieldName)));
const filteredSortedHeaderItems = computed<TNTable.Header[]>(() => {
  const list: TNTable.Header[] = [];

  const fieldNameList: string[] = props.sortableColumns
    ? sortedFields.value
    : props.header.map(hi => hi.fieldName).filter(hi => visibleFields.value.includes(hi));

  fieldNameList.forEach(sfn => {
    const field = filteredHeaderItems.value.find(f => f.fieldName === sfn);

    if (field) {
      list.push(field);
    }
  });

  return list;
});
const columnFilterMenu = computed<ITNDropdownMenu[]>(() =>
  props.header.map(hi => ({
    title: hi.title,
    id: hi.fieldName
  }))
);
const filteredDataItems = computed<TNTable.Data<TId, TMenuId>[]>(() =>
  props.data.map(di => {
    const data: { [key: string]: TNTable.Value } = {};

    const fieldNameList: string[] = props.sortableColumns
      ? sortedDataFields.value
      : props.header.map(hi => hi.fieldName).filter(hi => visibleFields.value.includes(hi));

    fieldNameList.forEach(fieldName => {
      if (visibleFields.value.includes(fieldName)) {
        data[fieldName] = di.data[fieldName];
      }
    });

    return {
      id: di.id,
      contextIcon: di.contextIcon,
      rowMenu: di.rowMenu,
      data
    };
  })
);
const isAllItemsSelected = computed<boolean>(() => !!props.selectList.length && props.data.every(di => props.selectList.includes(di.id)));
const indeterminateHeaderCheckbox = computed<boolean>(() => !!props.selectList.length);
const dragItemContent = computed<string>(() => props.header.find(h => h.fieldName === drag.value.fieldName)?.title || "");
const dragItemPositionStyle = computed<{ top: string; left: string }>(() => ({
  top: drag.value.style.top + drag.value.cursor.delta.top - 8 + "px",
  left: drag.value.style.left + drag.value.cursor.delta.left - 12 + "px"
}));
const haveHeaderSlot = computed<boolean>(() => {
  if (!slots.header) {
    return false;
  } else {
    const slotList = slots.header();

    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});
const haveStickyHeaderSlot = computed<boolean>(() => {
  if (!slots.stickyHeader) {
    return false;
  } else {
    const slotList = slots.stickyHeader();

    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});
const haveFooterSlot = computed<boolean>(() => {
  if (!slots.footer) {
    return false;
  } else {
    const slotList = slots.footer();

    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});
const haveEmptySlot = computed<boolean>(() => {
  if (!slots.empty) {
    return false;
  } else {
    const slotList = slots.empty();

    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});
const haveSettingsSlot = computed<boolean>(() => {
  if (!slots.settings) {
    return false;
  } else {
    const slotList = slots.settings({
      columnFilterMenu: columnFilterMenu.value,
      disabledFields: props.disabledFields,
      visibleFields: visibleFields.value,
      reset: resetFilterHandler,
      select: toggleHeaderFilter,
      close: closeSettingsWindow
    });

    return slotList.length >= 2 || slotList.every(si => si.children || si.props);
  }
});
const isSelectPanelVisible = computed<boolean>(() => !!props.selectList.length && !!props.selectListOptions?.length);
const skeletonItemStyle = computed<{ width: string }>(() => ({
  width: props.header.reduce<number>((pr, cr) => pr + cr.width + cellPadding, 0) + (props.rowMenu?.length ? 56 : 0) + (props.selectable ? 46 : 0) + "px"
}));
const isRowsClickable = computed<boolean>(() => props.clickableRows && openedContextMenu.value === null);
const isResetDisabled = computed<boolean>(() => JSON.stringify([...(props.resetFields || [])].sort()) === JSON.stringify([...sortedDataFields.value].sort()));
const isAnyRowsHasMenu = computed<boolean>(() => filteredDataItems.value.some(di => di.rowMenu?.length) || props.filterableColumns);

watch(
  () => props.data,
  () => {
    if (props.scrollOnUpdate) {
      scrollToTop();
    }
  },
  { deep: true }
);
watch(
  () => props.loading,
  async () => {
    if (root.value) {
      root.value.scrollBy({
        top: -1
      });
    }
    await pause(10);
    showLoader.value = props.loading !== "none";
  },
  {
    immediate: false
  }
);
watch(
  () => props.outerVisibleFields,
  to => {
    if (to) {
      visibleFields.value = [...to];
      sortedFields.value = [...to];
      sortedDataFields.value = [...to];
      emit("select:filter", visibleFields.value);
    }
  },
  {
    deep: true
  }
);
watch(
  () => drag.value.cursor,
  () => {
    // Проверка сортируются ли столбцы и что таблица смонтирована
    if (!root.value || !props.sortableColumns) return;
    // Проверка на то, что юзер именно потянул за столбец, если он его просто взял, то дельта может быть до 10 и скролл не сработает
    if (Math.abs(drag.value.cursor.delta.left) < 10) return;
    scrollIfColumnCloseBorder();
    updateScrolledDistance();
  },
  { deep: true }
);

const updateScrolledDistance = () => {
  // Фунуция обновления scrollXDistances
  const element = scrollItem.value?.$el;
  if (!element || !scrollWrapper.value) return;
  scrollXDistances.scrolled = scrollWrapper.value.scrollLeft;
  scrollXDistances.fullScrollDistance = scrollWrapper.value.scrollWidth - scrollWrapper.value.clientWidth;
};

const scrollIfColumnCloseBorder = () => {
  if (!root.value) return;
  const tableBorders = {
    // Запись границ контейнера таблицы на экране
    left: root.value.getBoundingClientRect().left,
    get right() {
      return this.left + (root.value?.clientWidth ?? 0);
    }
  };

  const dragLeftPosition = drag.value.cursor.delta.left + drag.value.cursor.initial.left; // Положение курсора на экране

  const scrollSpeed = 15; // Сколько пикселей будет скроллиться за кадр

  const getScrollCondition = (forRight: boolean = false): boolean => {
    if (forRight) return tableBorders.right - dragLeftPosition < 100 && scrollXDistances.fullScrollDistance - scrollXDistances.scrolled > scrollSpeed;
    // Условие скролла направо - разница между правой границей контейнера таблицы и курсором меньше 100 пикс и что есть куда скроллить вправо
    return !!dragLeftPosition && dragLeftPosition - tableBorders.left < 100 && scrollXDistances.scrolled > scrollSpeed;
    // Условие скролла налево - разница между левой границей контейнера таблицы и курсором меньше 100 пикс и что есть куда скроллить влево
  };

  const scrollWithDelay = (toRight: boolean = false) => {
    isScrolling = true;

    const scrollFunction = () => {
      if (isScrolling && scrollWrapper.value) {
        if (toRight) {
          scrollWrapper.value.scrollLeft += scrollSpeed;
          isScrolling = getScrollCondition(true);
        } else {
          scrollWrapper.value.scrollLeft -= scrollSpeed;
          isScrolling = getScrollCondition();
        }
        if (!drag.value.cursor.delta.left) isScrolling = false;
        // Когда отпускаешь столбец, у него становится нулевая дельта, к которой можно привязать остановку скролла
        requestAnimationFrame(scrollFunction);
        // Повтор функции в следующем кадре
      }
    };

    scrollFunction();
  };

  if (getScrollCondition(true)) {
    if (!isScrolling) scrollWithDelay(true);
    return;
  }
  if (getScrollCondition()) {
    if (!isScrolling) scrollWithDelay();
    return;
  }
  isScrolling = false;
};

const toggleHeaderFilter = (fieldValue: string) => {
  const fieldValueIndex = visibleFields.value.findIndex(vf => vf === fieldValue);

  if (fieldValueIndex === -1) {
    visibleFields.value.push(fieldValue);
    sortedFields.value.push(fieldValue);
  } else {
    visibleFields.value.splice(fieldValueIndex, 1);
    const sortFieldValueIndex = sortedFields.value.findIndex(sf => sf === fieldValue);

    if (sortFieldValueIndex !== -1) {
      sortedFields.value.splice(sortFieldValueIndex, 1);
    }
  }
  sortedDataFields.value = [...sortedFields.value];
  emit("select:filter", visibleFields.value);
};
const selectAllHandler = () => {
  if (props.selectAllLogic === TNTable.SelectAllLogic.DataReset) {
    if (props.selectList.length) {
      emit("select", []);
    } else {
      emit(
        "select",
        props.data.map(di => di.id)
      );
    }
  } else if (props.selectAllLogic === TNTable.SelectAllLogic.DataEnrichment) {
    if (isAllItemsSelected.value) {
      emit(
        "select",
        props.selectList.filter(sid => !props.data.some(el => el.id === sid))
      );
    } else {
      emit("select", [...new Set([...props.selectList, ...props.data.map(di => di.id)])]);
    }
  }
};
const contextButtonClickHandler = async (id: TId) => {
  if (openedContextMenu.value !== null && openedContextMenu.value === id) {
    openedContextMenu.value = null;
  } else {
    emit("click:context", id);
    await nextTick();
    openedContextMenu.value = id;
  }
  closeSettingsWindow();
};
const selectDataItem = (id: TId) => {
  const list = [...props.selectList];
  const selectIndex = list.findIndex(si => si === id);

  if (selectIndex === -1) {
    list.push(id);
  } else {
    list.splice(selectIndex, 1);
  }
  emit("select", list);
};
const settingsButtonClickHandler = () => {
  if (isHeaderDetached.value && root.value && headerContainer.value) {
    root.value.scrollLeft = 0;
    headerContainer.value.scrollLeft = 0;
  }
  isHeaderSettingsVisible.value = !isHeaderSettingsVisible.value;
  openedContextMenu.value = null;
};
const dropdownSelectHandler = async (id: TMenuId) => {
  if (openedContextMenu.value !== null) {
    emit("select:dropdown", {
      optionId: id,
      itemId: openedContextMenu.value
    });
    await pause(10);
    openedContextMenu.value = null;
  }
};
const tagClickHandler = (itemId: TId, fieldName: string) => {
  emit("click:tag", {
    itemId,
    fieldName
  });
};
const linkClickHandler = (itemId: TId, fieldName: string, value: string) => {
  emit("click:link", {
    itemId,
    fieldName,
    value
  });
};
const copyClickHandler = (itemId: TId, fieldName: string, value?: string) => {
  emit("click:copy", {
    itemId,
    fieldName,
    value
  });
};
const startDragging = (event: MouseEvent, fieldName: string) => {
  if (!props.sortableColumns || props.loading !== "none") return;
  const headerElement = (event.target as HTMLParagraphElement).parentElement;
  const { top, left, width, height } = headerElement!.getClientRects()[0]!;

  drag.value = {
    dragging: true,
    fieldName,
    headerAnimating: false,
    bodyAnimating: false,
    sort: props.header.some(h => h.sort && h.fieldName === fieldName),
    style: {
      top,
      left,
      width: width + cellPadding + "px",
      height: height + 16 + "px"
    },
    cursor: {
      initial: {
        top: event.clientY,
        left: event.clientX
      },
      delta: {
        top: 0,
        left: 0
      }
    }
  };
};
const resetDragging = () => {
  drag.value = { ...defaultDrag, dragging: true, bodyAnimating: true };
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    drag.value.dragging = false;
    drag.value.bodyAnimating = false;
  }, 300);
};
const releaseDragging = async () => {
  resetDragging();
  await nextTick();
  sortedDataFields.value = [...sortedFields.value];
  emit("columnSortUpdate", sortedDataFields.value);
};
const dragMove = (event: MouseEvent) => {
  if (drag.value.dragging) {
    drag.value.cursor.delta = {
      top: event.clientY - drag.value.cursor.initial.top,
      left: event.clientX - drag.value.cursor.initial.left
    };

    if (!drag.value.headerAnimating) {
      headerItems.value.forEach(({ $el: element }) => {
        if (!drag.value.headerAnimating) {
          const { left, width } = element.getClientRects()[0]!;
          const isInElement = isCursorInElement(event.clientX, {
            left,
            width
          });

          if (isInElement && element.id && drag.value.fieldName && element.id !== drag.value.fieldName) {
            drag.value.headerAnimating = true;
            void nextTick(() => {
              switchPlacesOfColumns(getIndexFromFieldName(drag.value.fieldName), getIndexFromFieldName(element.id));
            });

            if (animatingTimeout) {
              clearTimeout(animatingTimeout);
            }
            animatingTimeout = setTimeout(() => {
              drag.value.headerAnimating = false;
              animatingTimeout = null;
            }, 300);
          }
        }
      });
    }
  }
};
const getIndexFromFieldName = (fieldName: string): number => sortedFields.value.findIndex(sfi => sfi === fieldName);
const switchPlacesOfColumns = (index1: number, index2: number) => {
  const temp = sortedFields.value[index1];

  sortedFields.value[index1] = sortedFields.value[index2];
  sortedFields.value[index2] = temp;
};
const isCursorInElement = (cursorX: number, element: { left: number; width: number }): boolean =>
  cursorX >= element.left && cursorX <= element.left + element.width;
const scrollHandler = async (event: Event) => {
  emit("scroll", event);
  updateScrolledDistance();
  if (!props.showHeader) {
    return;
  }
  if (props.closeSettingsOnScroll) {
    closeSettingsWindow();
  }
  const element = event.target as HTMLElement;

  isHeaderDetached.value = element.scrollTop > props.headerScrollAppear;
  if (isHeaderDetached.value) {
    if (!headerContainer.value) {
      await nextTick();
    }
    if (headerContainer.value) {
      headerContainer.value.scrollLeft = element.scrollLeft;
      rootWidth.value = headerContainer.value.clientWidth - 32;
      if (props.stickyPanelWidthCallback) {
        rootWidth.value = props.stickyPanelWidthCallback(rootWidth.value);
      }
    }
  }
  visibleTooltip.value = defaultTooltip;
  openedContextMenu.value = null;
};
const headerScrollHandler = (event: Event) => {
  const element = event.target as HTMLElement;

  if (scrollWrapper.value) {
    scrollWrapper.value.scrollLeft = element.scrollLeft;
  }
};
const bodyTextMouseEnterHandler = (dataId: TId, fieldName: string) => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
  tooltipTimeout = setTimeout(() => {
    visibleTooltip.value = {
      dataId,
      fieldName
    };
  }, 1000);
};
const bodyTextMouseLeaveHandler = () => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
  visibleTooltip.value = defaultTooltip;
};
const sortIcon = (fieldName: string): IconNames => {
  const sort = props.sort.find(s => s.fieldName === fieldName);

  if (sort?.enabled) {
    if (sort.direction === TNTable.SortDirection.Ascend) {
      return "up-s-light";
    } else if (sort.direction === TNTable.SortDirection.Descend) {
      return "down-s-light";
    }
  }

  return "sort-light";
};
const toggleSort = (fieldName: string) => {
  const sort = props.sort.find(s => s.fieldName === fieldName);

  if (sort?.enabled) {
    if (sort.direction === TNTable.SortDirection.Descend) {
      emit("toggleSort", {
        fieldName,
        enabled: true,
        direction: TNTable.SortDirection.Ascend
      });
    } else if (sort.direction === TNTable.SortDirection.Ascend) {
      emit("toggleSort", {
        fieldName,
        enabled: false,
        direction: TNTable.SortDirection.Ascend
      });
    }
  } else {
    emit("toggleSort", {
      fieldName,
      enabled: true,
      direction: TNTable.SortDirection.Descend
    });
  }
};
const isSortEnabled = (fieldName: string): boolean => !!props.sort.find(s => s.fieldName === fieldName)?.enabled;
const scrollToTop = () => {
  scrollItem.value?.$el?.querySelector("[data-overlayscrollbars-contents]")?.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};
const pause = (duration: number = 1): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};
const optionClickHandler = (optionId: TOptionId) => {
  const option = props.selectListOptions?.find(slo => slo.id === optionId);

  if (option && !option.disabled) {
    emit("click:option", optionId);
  }
};
const windowResizeHandler = () => {
  if (root.value) rootWidth.value = root.value.clientWidth - 32;
};
const dataItemClickHandler = (dataId: TId) => {
  if (isRowsClickable.value) {
    emit("click:row", dataId);
  }
};
const resetFilterHandler = () => {
  if (props.resettableFilter && props.resetFields?.length) {
    sortedDataFields.value = [...props.resetFields];
    sortedFields.value = [...props.resetFields];
    visibleFields.value = [...props.resetFields];
    emit("columnSortUpdate", props.resetFields);
    emit("select:filter", props.resetFields);
    if (!haveSettingsSlot.value) {
      closeSettingsWindow();
    }
  }
};
const openColumnFilterDropdown = (fieldName: string) => {
  openedColumnFilter.value = fieldName;
};
const closeColumnFilterDropdown = () => {
  openedColumnFilter.value = "";
};
const resizeStartHandler = (event: MouseEvent, header: TNTable.Header) => {
  if (!props.resizableColumns) return;
  const alreadyResized = resizedColumns.value[header.fieldName];

  resizeColumn.value = {
    width: alreadyResized ?? header.width,
    startWidth: alreadyResized ?? header.width,
    fieldName: header.fieldName,
    start: event.clientX
  };
  window.addEventListener("mousemove", resizeHandler);
  window.addEventListener("mouseup", resizeEndHandler);
};
const resizeEndHandler = () => {
  resizeColumn.value = null;
  window.removeEventListener("mousemove", resizeHandler);
  window.removeEventListener("mouseup", resizeEndHandler);
};
const resizeHandler = (event: MouseEvent) => {
  if (resizeColumn.value && props.resizableColumns) {
    resizeColumn.value.width = resizeColumn.value.startWidth + (event.clientX - resizeColumn.value.start);
    resizedColumns.value[resizeColumn.value.fieldName] = resizeColumn.value.width >= 1 ? resizeColumn.value.width : 1;
  }
};
const initFilterValue = () => {
  if (props.header.some(h => h.filter)) {
    filterModel.value = props.header.reduce<Record<string, TNTable.FilterValue>>((prev, curr) => {
      if (curr.filter?.initValue !== undefined) {
        prev[curr.fieldName] = curr.filter.initValue;
      }

      return prev;
    }, {});
  }
};
const closeSettingsWindow = () => {
  isHeaderSettingsVisible.value = false;
};
const filterInputHandler = (payload: { fieldName: string; value?: TNTable.FilterValue }) => {
  filterModel.value[payload.fieldName] = payload.value;
  emit("filter:input", payload);
};
</script>

<style lang="css" src="./table.css"></style>
