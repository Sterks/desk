<template>
  <th
    :id="headerItem.fieldName"
    :class="{
      'tn-table__header-cell_dragging': headerItem.fieldName === drag.fieldName
    }"
    :style="{
      width: (resizedColumns[headerItem.fieldName] ?? headerItem.width) + 24 + 'px',
      flexBasis: (resizedColumns[headerItem.fieldName] ?? headerItem.width) + 24 + 'px'
    }"
    class="tn-table__header-cell"
  >
    <div class="tn-table__header-cell-top">
      <slot :header-item="headerItem" name="header-title-cell-before" />
      <p
        :class="{
          'tn-table__header-title_draggable': sortableColumns && loading === 'none'
        }"
        class="tn-table__header-title"
        @mousedown="startDragging($event, headerItem.fieldName)"
      >
        {{ headerItem.title }}
      </p>
      <template v-if="headerItem.sort">
        <TNButton
          :class="{
            'tn-table__sort-button_enabled': isSortEnabled(headerItem.fieldName)
          }"
          :icon="sortIcon(headerItem.fieldName)"
          class="tn-table__sort-button"
          type="link"
          size="lg"
          @click="toggleSort(headerItem.fieldName)"
        />
        <p v-if="isSortEnabled(headerItem.fieldName) && sort && sort.length > 1" class="tn-table__sort-counter">
          {{ sort.findIndex(s => s.fieldName === headerItem.fieldName) + 1 }}
        </p>
      </template>
    </div>
    <div v-if="headerItem.filter" class="tn-table__header-cell-bottom">
      <TNInput
        v-if="headerItem.filter.type === TNTable.FilterType.Text"
        :disabled="headerItem.filter.disabled"
        :model-value="textFilterModel(headerItem.fieldName)"
        :placeholder="headerItem.filter.placeholder"
        class="tn-table__header-cell-filter-input"
        clearable
        size="s"
        @update:model-value="
          $emit('filter:input', {
            fieldName: headerItem.fieldName,
            value: $event
          })
        "
      />
      <TNInput
        v-else-if="headerItem.filter.type === TNTable.FilterType.Number"
        :disabled="headerItem.filter.disabled"
        :mask-tokens="numberInputMaskToken"
        :model-value="textFilterModel(headerItem.fieldName)"
        :placeholder="headerItem.filter.placeholder"
        class="tn-table__header-cell-filter-input"
        clearable
        mask-template="G"
        numeric-keyboard="decimal"
        size="s"
        @update:model-value="
          $emit('filter:input', {
            fieldName: headerItem.fieldName,
            value: $event
          })
        "
      />
      <TNDatepicker
        v-else-if="headerItem.filter.type === TNTable.FilterType.Date"
        :disabled="headerItem.filter.disabled"
        :model-value="dateFilterModel(headerItem.fieldName)"
        :placeholder="headerItem.filter.placeholder"
        :popper-options="popperOptions?.headerDatepicker || { strategy: 'fixed' }"
        class="tn-table__header-cell-filter-input tn-table__header-cell-filter-input_datepicker"
        clearable
        size="s"
        @update:model-value="
          $emit('filter:input', {
            fieldName: headerItem.fieldName,
            value: $event
          })
        "
      />
      <TNSelector
        v-else-if="headerItem.filter.type === TNTable.FilterType.Select"
        :disabled="headerItem.filter.disabled"
        :model-value="selectorFilterModel(headerItem.fieldName)"
        :options="headerItem.filter.selectOptions || []"
        :placeholder="headerItem.filter.placeholder"
        :popper-options="popperOptions?.headerSelect || { strategy: 'fixed' }"
        chip-titles
        class="tn-table__header-cell-filter-input tn-table__header-cell-filter-input_select"
        clearable
        flat
        size="s"
        @update:model-value="
          $emit('filter:input', {
            fieldName: headerItem.fieldName,
            value: $event
          })
        "
      />
      <TNMultiSelector
        v-else-if="headerItem.filter.type === TNTable.FilterType.MultiSelect"
        :model-value="multiSelectValue(headerItem.fieldName)"
        :options="headerItem.filter?.selectOptions || []"
        :placeholder="headerItem.filter.placeholder"
        :popper-options="popperOptions?.headerSelect || { strategy: 'fixed' }"
        :disabled="headerItem.filter.disabled"
        :searchable="headerItem.filter.searchable"
        :search-placeholder="headerItem.filter.searchPlaceholder"
        :search-query="multiSelectSearchQuery"
        class="tn-table__header-cell-filter-input tn-table__header-cell-filter-input_select"
        clearable
        flat
        size="s"
        @update:model-value="
          $emit('filter:input', {
            fieldName: headerItem.fieldName,
            value: $event
          })
        "
        @search-handler="multiSelectSearchHandler"
        @close="() => multiSelectSearchHandler('')"
      />

      <template v-if="headerItem.filter.method">
        <TNDropdown
          :is-visible="headerItem.fieldName === openedColumnFilter"
          :max-height="500"
          :offset="8"
          :options="columnFilterOptionsAdapter(headerItem.filter.method)"
          :popper-options="popperOptions?.headerDropdown || { strategy: 'fixed' }"
          class="tn-table__header-cell-filter-dropdown"
          position="bottom-right"
          @select="filterDropdownSelectHandler($event, headerItem.fieldName)"
          @click:outside="closeColumnFilterDropdown"
        >
          <TNButton
            :disabled="headerItem.filter.disabled"
            class="tn-table__header-cell-filter-button"
            icon="filter-2-light"
            type="outline"
            @click="openColumnFilterDropdown(headerItem.fieldName)"
          />
        </TNDropdown>
      </template>
    </div>
    <div v-if="resizableColumns" class="tn-table__header-resize-handle" @mousedown="resizeStartHandler($event, headerItem)"></div>
  </th>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import TNButton from "../../button/button.vue";
import TNDatepicker from "../../datepicker/datepicker.vue";
import TNDropdown from "../../dropdown/dropdown.vue";
import TNInput from "../../input/input.vue";
import type { IPopoverOptions } from "../../popover/popover.types";
import { type IDrag, TNTable } from "../table.types";
import type { ITNDropdownMenu } from "../../dropdown/dropdown.types";
import TNSelector from "../../select/select.vue";
import TNMultiSelector from "../../multiselect/multiselect.vue";

import type { IconNames } from "../../icons/icon-names";

defineOptions({
  name: "TableHeaderCell"
});

type TableHeaderPopperOptions = {
  headerDatepicker?: IPopoverOptions;
  headerSelect?: IPopoverOptions;
  headerDropdown?: IPopoverOptions;
  contextDropdown?: IPopoverOptions;
  textCellTooltip?: IPopoverOptions;
  disabledAnnotationTooltip?: IPopoverOptions;
};

const props = withDefaults(
  defineProps<{
    headerItem: TNTable.Header;
    drag: IDrag;
    resizedColumns: Record<string, number>;
    sortableColumns?: boolean;
    sort?: TNTable.Sort[];
    filterModel: Record<string, TNTable.FilterValue | undefined>;
    loading: "full" | "partial" | "none";
    popperOptions?: TableHeaderPopperOptions;
    openedColumnFilter: string;
    resizableColumns?: boolean;
  }>(),
  {
    popperOptions: () => ({})
  }
);

const emit = defineEmits<{
  (e: "startDragging", event: MouseEvent, fieldName: string): void;
  (e: "toggleSort", fieldName: string): void;
  (
    e: "filter:input",
    event: {
      fieldName: string;
      value?: TNTable.FilterValue;
    }
  ): void;
  (
    e: "filter:selectMethod",
    payload: {
      fieldName: string;
      value: string;
    }
  ): void;
  (
    e: "filter:search",
    payload: {
      fieldName: string;
      value: string;
      selected: (string | number)[];
    }
  ): void;
  (e: "closeColumnFilterDropdown"): void;
  (e: "openColumnFilterDropdown", fieldName: string): void;
  (e: "resizeStartHandler", event: MouseEvent, header: TNTable.Header): void;
}>();

const multiSelectSearchQuery = ref<string>("");

const numberInputMaskToken = {
  G: {
    pattern: /(\d|\.|,)/,
    repeated: true
  }
};

const startDragging = (event: MouseEvent, fieldName: string) => {
  emit("startDragging", event, fieldName);
};
const toggleSort = (fieldName: string) => {
  emit("toggleSort", fieldName);
};
const resizeStartHandler = (event: MouseEvent, header: TNTable.Header) => {
  emit("resizeStartHandler", event, header);
};
const isSortEnabled = (fieldName: string): boolean => !!props.sort?.find(s => s.fieldName === fieldName)?.enabled;
const sortIcon = (fieldName: string): IconNames => {
  const sort = props.sort?.find(s => s.fieldName === fieldName);

  if (sort?.enabled) {
    if (sort.direction === TNTable.SortDirection.Ascend) {
      return "up-s-light";
    } else if (sort.direction === TNTable.SortDirection.Descend) {
      return "down-s-light";
    }
  }

  return "sort-light";
};
const columnFilterOptionsAdapter = (method: { options: { title: string; id: string }[]; selected: string }): ITNDropdownMenu[] =>
  method.options.map(item => ({
    title: item.title,
    id: item.id,
    accent: method.selected === item.id,
    icon: method.selected === item.id ? "check" : undefined
  }));
const filterDropdownSelectHandler = (value: string, fieldName: string) => {
  emit("filter:selectMethod", {
    fieldName,
    value
  });
  closeColumnFilterDropdown();
};
const closeColumnFilterDropdown = () => {
  emit("closeColumnFilterDropdown");
};
const openColumnFilterDropdown = (fieldName: string) => {
  emit("openColumnFilterDropdown", fieldName);
};
const textFilterModel = (fieldName: string): string | undefined => {
  const value = props.filterModel[fieldName];

  if (typeof value === "string") {
    return value;
  }

  return String(value);
};
const dateFilterModel = (fieldName: string): Date | undefined => {
  const value = props.filterModel[fieldName];

  if (value instanceof Date) {
    return value;
  }

  return undefined;
};
const selectorFilterModel = (fieldName: string): string | number | undefined => {
  const value = props.filterModel[fieldName];

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return String(value);
};
const multiSelectValue = (fieldName: string): (string | number)[] => {
  const value = props.filterModel[fieldName];

  return Array.isArray(value) ? value : [];
};

const multiSelectSearchHandler = (value: string) => {
  emit("filter:search", { fieldName: props.headerItem.fieldName, value: value.trim().toLowerCase(), selected: multiSelectValue(props.headerItem.fieldName) });
};
</script>
