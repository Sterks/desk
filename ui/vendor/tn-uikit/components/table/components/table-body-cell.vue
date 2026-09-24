<template>
  <td
    :class="{
      'tn-table__body-cell_text': typeof dataFieldItem === 'object' && dataFieldItem.type === TNTable.DataType.Text
    }"
    :style="dataCellStyle(index)"
    class="tn-table__body-cell"
  >
    <slot name="default">
      <p v-if="typeof dataFieldItem === 'string' || typeof dataFieldItem === 'undefined'" class="tn-table__body-text">
        {{ dataFieldItem || "—" }}
      </p>
      <p v-else-if="typeof dataFieldItem === 'number'" class="tn-table__body-text">
        {{ dataFieldItem }}
      </p>
      <Component
        :is="dataFieldItem.component"
        v-else-if="dataFieldItem.type === TNTable.DataType.Component && dataFieldItem.component"
        v-bind="dataFieldItem.bind || {}"
        v-on="dataFieldItem.events || {}"
      />
      <p
        v-else-if="dataFieldItem.type === TNTable.DataType.Text"
        :class="{
          'tn-table__body-text_copyable': dataFieldItem.copyable
        }"
        class="tn-table__body-text"
        @mouseenter="bodyTextMouseEnterHandler(dataItem.id, index)"
        @mouseleave="$emit('bodyTextMouseLeave')"
        @click.stop="copyClickHandler(dataItem.id, index, dataFieldItem.value)"
      >
        <span class="tn-table__body-link-text">{{ dataFieldItem.value || "—" }}</span>
        <TNIcon v-if="dataFieldItem.value && dataFieldItem.copyable" class="tn-table__body-link-icon" name="copy-light" size="22" />
        <transition name="tn-fade">
          <TNTooltip
            v-show="visibleTooltip.fieldName === index && visibleTooltip.dataId === dataItem.id"
            :text="dataFieldItem.tooltip"
            :popper-options="popperOptions?.textCellTooltip || {}"
            arrow-position="top-left"
            class="tn-table__body-tooltip"
            light
            no-scroll
          />
        </transition>
        <span v-show="visibleTooltip.fieldName === index && visibleTooltip.dataId === dataItem.id" class="tn-table__body-tooltip-overlay" />
      </p>
      <TNUserPicture
        v-else-if="dataFieldItem.type === TNTable.DataType.UserPicture"
        :icon="dataFieldItem.icon"
        :image="dataFieldItem.imageUrl"
        :style="{
          '--secondary-color': dataFieldItem.iconSecondaryColor,
          color: dataFieldItem.iconColor
        }"
        :text="dataFieldItem.value"
        hide-on-error
        class="tn-table__body-user-picture"
      />
      <TNTag
        v-else-if="dataFieldItem.type === TNTable.DataType.Tag"
        :icon="dataFieldItem.icon"
        :icon-color="dataFieldItem.iconColor"
        :right-icon="dataFieldItem.rightIcon"
        :right-icon-color="dataFieldItem.rightIconColor"
        :text="dataFieldItem.label ?? dataFieldItem.value"
        class="tn-table__body-tag"
        interactive
        size="md"
        @click.stop="tagClickHandler(dataItem.id, index)"
      />
      <p
        v-else-if="dataFieldItem.type === TNTable.DataType.Link"
        :title="dataFieldItem.value"
        class="tn-table__body-link"
        @click.stop="linkClickHandler(dataItem.id, index, dataFieldItem.value)"
      >
        <span class="tn-table__body-link-text">
          {{ dataFieldItem.label || dataFieldItem.value }}
        </span>
        <TNIcon class="tn-table__body-link-icon" name="copy-light" size="22" @click.stop="copyClickHandler(dataItem.id, index, dataFieldItem.value)" />
      </p>
    </slot>
  </td>
</template>

<script lang="ts" setup generic="TId extends string | number = string | number">
import { TNTable } from "../table.types";
import type { IPopoverOptions } from "../../popover/popover.types";
import TNIcon from "../../icons/icon.vue";
import TNTooltip from "../../tooltip/tooltip.vue";
import TNUserPicture from "../../user-picture/user-picture.vue";
import TNTag from "../../tag/tag.vue";

type TableBodyCellPopperOptions = {
  headerDatepicker?: IPopoverOptions;
  headerSelect?: IPopoverOptions;
  headerDropdown?: IPopoverOptions;
  contextDropdown?: IPopoverOptions;
  textCellTooltip?: IPopoverOptions;
  disabledAnnotationTooltip?: IPopoverOptions;
};

const props = withDefaults(
  defineProps<{
    dataFieldItem?: TNTable.Value;
    dataItem: TNTable.Data<TId, string | number>;
    index: string;
    header: TNTable.Header[];
    resizedColumns: Record<string, number>;
    cellPadding: number;
    visibleTooltip: { dataId: TId | null; fieldName: string };
    popperOptions?: TableBodyCellPopperOptions;
  }>(),
  {
    popperOptions: () => ({})
  }
);

const emit = defineEmits<{
  (e: "bodyTextMouseEnter", dataId: TId, fieldName: string): void;
  (e: "bodyTextMouseLeave"): void;
  (e: "copyClick", itemId: TId, fieldName: string, value?: string): void;
  (e: "tagClick", itemId: TId, fieldName: string): void;
  (e: "linkClick", itemId: TId, fieldName: string, value: string): void;
}>();

const dataCellStyle = (fieldName: string): { width: string; flexBasis: string } => {
  const headerWidth = props.header.find(hi => hi.fieldName === fieldName);

  const resized = props.resizedColumns[fieldName];

  return {
    width: resized ? resized + props.cellPadding + "px" : headerWidth ? headerWidth.width + props.cellPadding + "px" : "",
    flexBasis: resized ? resized + props.cellPadding + "px" : headerWidth ? headerWidth.width + props.cellPadding + "px" : ""
  };
};
const bodyTextMouseEnterHandler = (dataId: TId, fieldName: string) => {
  emit("bodyTextMouseEnter", dataId, fieldName);
};
const copyClickHandler = (itemId: TId, fieldName: string, value?: string) => {
  emit("copyClick", itemId, fieldName, value);
};
const tagClickHandler = (itemId: TId, fieldName: string) => {
  emit("tagClick", itemId, fieldName);
};
const linkClickHandler = (itemId: TId, fieldName: string, value: string) => {
  emit("linkClick", itemId, fieldName, value);
};
</script>
