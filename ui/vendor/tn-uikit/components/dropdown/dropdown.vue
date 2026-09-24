<template>
  <transition name="tn-dropdown">
    <TNPopover
      :flip="flip"
      :inline="!nested"
      :offset="offset"
      :popper-options="popperOptions"
      :position="position"
      :shift="shift"
      :visible="isVisible || isMobile"
      :wrapper-custom-class="customClass"
      :window-styled="false"
      width="auto"
    >
      <template v-if="haveTriggerSlot" #trigger>
        <slot></slot>
      </template>
      <template #content>
        <div
          v-if="isVisible || isMobile"
          :id="idAttribute"
          ref="root"
          v-click-outside="clickOutsideHandler"
          class="tn-dropdown"
          @mouseenter="$emit('bodyMouseEnter', $event)"
          @mouseleave="$emit('bodyMouseLeave', $event)"
        >
          <template v-if="isMobile">
            <TNBottomSheet
              :custom-class="['tn-dropdown__bottom-sheet', ...(bottomSheetCustomClass ? [bottomSheetCustomClass] : [])]"
              :is-open="!!isVisible"
              :teleport-to="bottomSheetTeleportTo"
              @hide="closeBottomSheetHandler"
            >
              <div v-for="(cellItem, index) in cellList" :key="cellItem.id" class="tn-dropdown__bottom-sheet-content">
                <TNCell :cell-data="cellItem" class="tn-dropdown__cell" @body-click="cellClickHandler(cellItem)" @icon-click="cellClickHandler(cellItem)" />
                <TNDropdown
                  v-if="options[index] && options[index].childList"
                  :bottom-sheet-custom-class="bottomSheetCustomClass"
                  :is-visible="cellItem.id === expandedOptions"
                  :mobile-left-icon="mobileLeftIcon"
                  :options="options[index].childList"
                  :scrollable-content="scrollableContent"
                  :id-attribute="`nested-${cellItem.id}`"
                  class="tn-dropdown__nested-dropdown"
                  nested
                  shift
                  @select="nestedDropdownSelectHandler"
                  @click:outside="closeExpanded"
                  @click:outside:children="$emit('click:outside:children', $event)"
                />
              </div>
            </TNBottomSheet>
          </template>
          <div
            v-else
            :class="{ 'tn-dropdown__list-wrapper_scroll': scrollableContent }"
            :style="{ 'max-height': maxHeight ? maxHeight + 'px' : undefined }"
            class="tn-dropdown__list-wrapper"
          >
            <template v-for="cellItem in cellList">
              <div
                v-if="cellItem.childList && cellItem.childList.length"
                :key="'nest-' + cellItem.id"
                class="tn-dropdown__cell-container tn-dropdown__cell-container_dropdown"
              >
                <TNDropdown
                  :key="cellItem.id"
                  ref="nestedDropdown"
                  :collapse-by-click="collapseByClick"
                  :expand-by-click="expandByClick"
                  :flip="flip"
                  :is-visible="cellItem.id === expandedOptions"
                  :max-height="maxHeight"
                  :options="cellItem.childList"
                  :scrollable-content="scrollableContent"
                  :shift="shift"
                  :id-attribute="`nested-${cellItem.id}`"
                  class="tn-dropdown__nested-dropdown"
                  nested
                  position="right"
                  @body-mouse-enter="nestedDropdownMouseEnterHandler(cellItem, $event)"
                  @body-mouse-leave="nestedDropdownMouseLeaveHandler(cellItem, $event)"
                  @select="nestedDropdownSelectHandler"
                  @click:outside:children="$emit('click:outside:children', $event)"
                  @hover-option="nestedDropdownHoverHandler(cellItem)"
                >
                  <TNCell
                    :cell-data="cellItem"
                    class="tn-dropdown__cell"
                    dropdown
                    @body-click="cellClickHandler(cellItem)"
                    @icon-click="cellClickHandler(cellItem)"
                    @mouseenter="cellMouseEnterHandler(cellItem, $event)"
                    @mouseleave="cellMouseLeaveHandler(cellItem, $event)"
                  />
                </TNDropdown>
              </div>
              <div v-else :key="cellItem.id" class="tn-dropdown__cell-container">
                <TNCell
                  :cell-data="cellItem"
                  class="tn-dropdown__cell"
                  dropdown
                  @body-click="cellClickHandler(cellItem)"
                  @icon-click="cellClickHandler(cellItem)"
                  @mouseenter="cellMouseEnterHandler(cellItem, $event)"
                  @mouseleave="cellMouseLeaveHandler(cellItem, $event)"
                />
              </div>
            </template>
          </div>
        </div>
      </template>
    </TNPopover>
  </transition>
</template>

<script lang="ts" setup generic="TId extends string | number = string">
import { computed, nextTick, ref, Ref, VNode, watch } from "vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import type { ITNDropdownMenu } from "./dropdown.types";
import type { ICellDataItem } from "../cell/cell.types";
import TNCell from "../cell/cell.vue";
import TNBottomSheet from "../bottom-sheet/bottom-sheet.vue";
import TNDropdown from "./dropdown.vue";
import TNPopover from "../popover/popover.vue";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { vClickOutside } from "../../directives/click-outside";

interface IDropdownCellDataItem<TId extends string | number = string> extends ICellDataItem<TId> {
  childList: ITNDropdownMenu<TId>[];
}

defineOptions({
  name: "TNDropdown"
});

const props = withDefaults(
  defineProps<{
    /** Массив элементов выпадающего меню. */
    options: ITNDropdownMenu<TId>[];
    /** Раскрывать элементы меню при клике. */
    expandByClick?: boolean;
    /** Сворачивать элементы меню при клике. */
    collapseByClick?: boolean;
    /** Показать выпадающее меню. */
    isVisible?: boolean;
    /** Флаг вложенного dropdown-списка. */
    nested?: boolean;
    /** Отображать иконку слева в мобильном виде. */
    mobileLeftIcon?: boolean;
    /** Максимальная высота всплывающего окна меню (работает в паре с `scrollableContent`). */
    maxHeight?: number;
    /** Кастомный класс для `TNBottomSheet`. */
    bottomSheetCustomClass?: string;
    /** Позиция всплывающего окна меню относительно trigger-элемента. */
    position?: ITNPopoverPosition;
    /** Переворачивать всплывающее окно, если с указанной стороны не хватает места. */
    flip?: boolean;
    /** Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана. */
    shift?: boolean;
    /** Опции для всплывающего окна (`TNPopover`). */
    popperOptions?: IPopoverOptions;
    /** Отступ всплывающего окна относительно trigger-элемента. */
    offset?: number | { crossAxis?: number; mainAxis?: number };
    /** Добавить возможность скролла контента при ограниченной высоте меню. */
    scrollableContent?: boolean;
    /** Селектор teleport-контейнера для `TNBottomSheet` в мобильной версии. */
    bottomSheetTeleportTo?: string;
    /** Значение id-атрибута корневого DOM-элемента списка. */
    idAttribute?: string;
    /** Кастомный класс для popover-элемента. */
    customClass?: string;
  }>(),
  {
    position: "bottom-left",
    offset: () => ({ mainAxis: 8, crossAxis: 0 }),
    bottomSheetTeleportTo: "main"
  }
);

const emit = defineEmits<{
  /** Выбран элемент выпадающего списка, возвращает `id` выбранного элемента. */
  (e: "select", id: TId): void;
  /** Клик за пределами выпадающего списка. */
  (e: "click:outside", event?: MouseEvent | TouchEvent): void;
  /** Закрытие/сброс состояния раскрытого дочернего списка. Возвращает id закрытого узла. */
  (e: "click:outside:children", value?: TId): void;
  /** Наведение на опцию с дочерним списком. */
  (e: "hoverOption", id: TId): void;
  /** Наведение курсора на body dropdown-списка. */
  (e: "bodyMouseEnter", event: MouseEvent): void;
  /** Уход курсора с body dropdown-списка. */
  (e: "bodyMouseLeave", event: MouseEvent): void;
}>();

const slots = defineSlots<{
  /** Слот для trigger-элемента. */
  default?: () => VNode[];
}>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(Number(mobileBreakPoint ?? 0));

// Каст к Ref<TId | null>: у ref() .value разворачивается через UnwrapRef<TId>,
// который на дженерике не сводится к TId — из-за этого ломались присваивания
// expandedOptions.value = cell.id и emit("click:outside:children", ...).
const expandedOptions = ref<TId | null>(null) as Ref<TId | null>;
const root = ref<HTMLElement | null>(null);
const nestedDropdown = ref<{ $el: HTMLElement }[] | null>(null);

let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.isVisible,
  () => {
    if (!props.isVisible) closeExpanded();
  }
);

const haveTriggerSlot = computed<boolean>(() => !!slots.default);
const cellList = computed<IDropdownCellDataItem<TId>[]>(() =>
  props.options.map<IDropdownCellDataItem<TId>>(option => ({
    ...option,
    leftIcon: isMobile.value && !props.mobileLeftIcon ? undefined : option.icon,
    rightIcons:
      isMobile.value && !props.mobileLeftIcon && option.icon
        ? [option.icon]
        : option.childList?.length
          ? ["right-s-light"]
          : option.rightIcon
            ? [option.rightIcon]
            : undefined,
    rightIconsAlignment: "center",
    enabled: expandedOptions.value === option.id,
    childList: option.childList ?? []
  }))
);

const cellClickHandler = async (cell: ICellDataItem<TId>) => {
  const option = props.options.find(o => o.id === cell.id);
  if (option && option.childList && option.childList.length) {
    if (expandedOptions.value === cell.id) {
      if (props.collapseByClick) {
        closeExpanded();
      }
    } else {
      expandedOptions.value = cell.id;
      emit("select", cell.id);
      await nextTick();
    }
  } else {
    emit("select", cell.id);
  }
};
const cellMouseEnterHandler = (cell: ICellDataItem<TId>, event: MouseEvent) => {
  if (!props.expandByClick) {
    const element = event.target as HTMLElement;
    const option = props.options.find(o => o.id === cell.id);
    if (option && option.childList && option.childList.length) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      hoverTimeout = setTimeout(async () => {
        if (element.matches(":hover")) {
          emit("hoverOption", cell.id);
          expandedOptions.value = cell.id;
          hoverTimeout = null;
          await nextTick();
        }
      }, 300);
    }
  }
};
const cellMouseLeaveHandler = (cell: ICellDataItem<TId>, event: MouseEvent) => {
  if (!props.collapseByClick) {
    const element = event.target as HTMLElement;
    const option = props.options.find(o => o.id === cell.id);
    if (option && option.childList && option.childList.length) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      hoverTimeout = setTimeout(() => {
        if (!element.matches(":hover")) {
          closeExpanded();
          hoverTimeout = null;
        }
      }, 300);
    }
  }
};
const nestedDropdownMouseLeaveHandler = (_: ICellDataItem<TId>, event: MouseEvent) => {
  if (!props.collapseByClick) {
    const element = event.target as HTMLElement;
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hoverTimeout = setTimeout(() => {
      if (!element.matches(":hover")) {
        closeExpanded();
        hoverTimeout = null;
      }
    }, 300);
  }
};
const nestedDropdownMouseEnterHandler = (cell: ICellDataItem<TId>, event: MouseEvent) => {
  if (!props.expandByClick) {
    const element = event.target as HTMLElement;
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hoverTimeout = setTimeout(() => {
      if (element.matches(":hover")) {
        expandedOptions.value = cell.id;
        hoverTimeout = null;
      }
    }, 300);
  }
};
const clickOutsideHandler = () => {
  setTimeout(() => {
    if (!isMobile.value && props.isVisible) {
      emit("click:outside");
    }
  }, 100);
};
const closeBottomSheetHandler = (event?: MouseEvent | TouchEvent) => {
  closeExpanded();
  emit("click:outside", event);
};
const nestedDropdownSelectHandler = (event: TId) => {
  emit("select", event);
};
const closeExpanded = () => {
  emit("click:outside:children", expandedOptions.value ?? undefined);
  expandedOptions.value = null;
};
const nestedDropdownHoverHandler = (cell: ICellDataItem<TId>) => {
  emit("hoverOption", cell.id);
};
</script>

<style>
.tn-dropdown__list-wrapper {
  min-width: 280px;
  max-width: 720px;
  background-color: var(--background-primary-a-enabled);
  border-radius: 12px;
}

.tn-dropdown__list-wrapper_scroll {
  max-height: 100vh;
  overflow: auto;
}

.tn-dropdown__list-wrapper::-webkit-scrollbar {
  background-color: transparent;
  width: 12px;
}

.tn-dropdown__list-wrapper::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 24px;
  background-color: var(--border-secondary-enabled);
}

.tn-dropdown__cell-container:first-child > .tn-dropdown__cell,
.tn-dropdown__cell-container_dropdown:first-child > .tn-dropdown__nested-dropdown > .tn-popover__trigger-wrapper > .tn-dropdown__cell,
.tn-dropdown__cell-container_dropdown:first-child > .tn-dropdown__nested-dropdown > .tn-popover__trigger-wrapper > .tn-dropdown__cell {
  border-top-right-radius: 12px;
  border-top-left-radius: 12px;
}

.tn-dropdown__cell-container:last-child > .tn-dropdown__cell,
.tn-dropdown__cell-container_dropdown:last-child > .tn-dropdown__nested-dropdown > .tn-popover__trigger-wrapper > .tn-dropdown__cell {
  border-bottom-right-radius: 12px;
  border-bottom-left-radius: 12px;
}

.tn-dropdown__nested-dropdown_left {
  left: 0;
  transform: translateX(calc(-100% + 10px));
}

.tn-button.tn-dropdown__scroll-button {
  width: 100%;
  padding: 0;
  height: 24px;
  border-radius: 12px;
}

.tn-dropdown__bottom-sheet .tn-bottom-sheet__content {
  padding: 28px 0 24px;
}

.tn-dropdown-enter,
.tn-dropdown-leave-to {
  opacity: 0;
}

.tn-dropdown-enter-active,
.tn-dropdown-leave-active {
  transition-property: opacity;
  transition-timing-function: ease;
  transition-duration: 0.1s;
  opacity: 0;
}

.tn-dropdown-enter-to,
.tn-dropdown-leave {
  opacity: 1;
}
</style>
