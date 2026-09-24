<template>
  <TNFormItem
    class="tn-select"
    :required="required"
    :error="error"
    :warn="warn"
    :success="success"
    :smooth-message="smoothMessage"
    :label="label"
    :description="description"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    <TNPopover
      :flip="flip"
      :inline="false"
      :popper-options="popperOptions"
      :offset="popperOptions?.offset"
      :position="position"
      :shift="shift"
      :visible="!isMobile && isOpen"
      :width="floatElementWidth"
      :window-styled="false"
      class="tn-select__popover"
    >
      <template #trigger>
        <div
          ref="rootElement"
          :class="{
            'tn-select__inner-input_disabled': disabled,
            'tn-select__inner-input_clearable': clearable,
            'tn-select__inner-input_error': !!error,
            'tn-select__inner-input_warn': !!warn,
            'tn-select__inner-input_success': !!success,
            'tn-select__inner-input_medium': size === 'm',
            'tn-select__inner-input_open': isOpen
          }"
          class="tn-select__inner-input"
          @click.self="openSelector"
        >
          <p v-if="placeholder && (chipsUnderWrapper || !modelValue?.length)" class="tn-select__inner-input-placeholder" @click.self="openSelector">
            {{ placeholder }}
          </p>
          <teleport :to="chipsUnderWrapperElement" :disabled="!chipsUnderWrapper || !isMounted">
            <ul v-if="modelValue?.length && !hasValueSlot" class="tn-select__inner-input-list">
              <li v-for="item in modelValue" :key="item" class="tn-select__inner-input-item">
                <p class="tn-select__inner-input-item-text">
                  {{ getValueItemTitle(item) }}
                </p>
                <TNButton block class="tn-select__inner-input-item-close" icon="close-small" type="link" @click.stop="itemClick(item)" />
              </li>
            </ul>
            <ul v-else-if="modelValue?.length && selectedOption" class="tn-select__inner-input-slot" @click="!chipsUnderWrapper && openSelector">
              <li v-for="option in selectedOption" :key="option.id" class="tn-select__inner-input-slot-item">
                <slot :is-selected="true" :option="option" name="value" />
              </li>
            </ul>
          </teleport>
          <TNIcon :class="{ 'tn-select__inner-arrow_open': isOpen }" class="tn-select__inner-arrow" name="down-m" size="22" @click.self="toggleSelector" />
          <TNButton
            v-if="modelValue?.length && clearable && !disabled"
            class="tn-select__inner-clear"
            icon="close-filled"
            type="link"
            @click.stop="$emit('update:modelValue', [])"
          />
        </div>
      </template>
      <template #content>
        <div v-if="!isMobile && isOpen" ref="desktopWrapper" class="tn-select__desktop-menu">
          <TransitionCollapse>
            <div
              v-if="isInnerContainerOpened"
              v-click-outside="closeSelector"
              :class="{ 'tn-select__wrapper-desktop_search': searchable }"
              class="tn-select__wrapper-desktop"
            >
              <div v-if="searchable" class="tn-select__wrapper-desktop-input-wrapper">
                <TNSearch
                  ref="searchComponent"
                  :model-value="searchQuery"
                  :placeholder="searchPlaceholder"
                  class="tn-select__desktop-searcher"
                  clearable
                  @update:model-value="searchQueryHandler"
                />
              </div>
              <template v-if="!hasItemsSlot">
                <p v-if="emptyListHint && !options?.length" class="tn-select__empty-list-hint">
                  {{ emptyListHint }}
                </p>
                <div v-if="isLoading" class="tn-select__inner-loader">
                  <TNIcon class="tn-select__inner-loader-icon" name="load" />
                </div>
                <template v-else-if="flat">
                  <ul class="tn-select__flat-list-container">
                    <li
                      v-for="option in options"
                      :key="option.id"
                      :class="{
                        'tn-select__flat-list-item_selected': modelValue?.some(v => v === option.id),
                        'tn-select__flat-list-item_disabled': option.disableSelect
                      }"
                      class="tn-select__flat-list-item"
                      @click="flatItemHandler(option.id)"
                    >
                      <p class="tn-select__flat-list-title">
                        {{ option.title }}
                      </p>
                      <div class="tn-select__flat-list-icon-container">
                        <TNIcon
                          v-if="modelValue?.some(v => v === option.id)"
                          class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon_selected"
                          name="check"
                        />
                        <TNIcon
                          v-if="option.iconButton"
                          :name="option.iconButton"
                          class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon"
                          @click.stop="iconButtonClickHandler(option.id)"
                        />
                      </div>
                    </li>
                  </ul>
                </template>
                <template v-else>
                  <div v-if="options?.length" class="tn-select__wrapper-desktop-tree-wrapper">
                    <TNTree
                      :max-count-settings="null"
                      :model-value="modelValue ?? []"
                      :options="options"
                      @icon-button-click="iconButtonClickHandler"
                      @update:model-value="treeItemHandler"
                    />
                  </div>
                </template>
              </template>
              <template v-else>
                <p v-if="emptyListHint && !options?.length" class="tn-select__empty-list-hint">
                  {{ emptyListHint }}
                </p>
                <div v-if="isLoading" class="tn-select__inner-loader">
                  <TNIcon class="tn-select__inner-loader-icon" name="load" />
                </div>
                <ul v-else-if="options?.length" class="tn-select__slot-list-container">
                  <li v-for="option in options" :key="option.id" class="tn-select__slot-list-item" @click="slotItemClickHandler(option.id)">
                    <slot :is-selected="modelValue?.includes(option.id) ?? false" :option="option" name="items"></slot>
                  </li>
                </ul>
              </template>
            </div>
          </TransitionCollapse>
        </div>
      </template>
    </TNPopover>
    <div ref="chipsUnderWrapperElement" class="tn-select__chips-under-wrapper"></div>

    <TNBs
      v-if="isMobile"
      :custom-class="['tn-select__bottom-sheet', bottomSheetCustomClass ?? '']"
      :header="{ title: label, description: description }"
      :is-mobile-mini-app="isMobileMiniApp"
      :is-open="isOpen"
      :teleport-to="teleportTo"
      :full-height="searchable"
      @hide="closeSelector"
    >
      <template v-if="searchable" #header>
        <TNSearch
          v-if="searchable"
          ref="searchComponent"
          :model-value="searchQuery"
          :placeholder="searchPlaceholder"
          class="tn-selector__searcher"
          clearable
          size="s"
          @update:model-value="searchQueryHandler"
        />
      </template>
      <template v-if="!hasItemsSlot">
        <p v-if="emptyListHint && !options?.length" class="tn-select__empty-list-hint">
          {{ emptyListHint }}
        </p>
        <div v-if="isLoading" class="tn-select__inner-loader">
          <TNIcon class="tn-select__inner-loader-icon" name="load" />
        </div>
        <template v-else-if="flat">
          <ul ref="bottomSheet" class="tn-select__flat-list-container">
            <li
              v-for="option in options"
              :key="option.id"
              :class="{
                'tn-select__flat-list-item_selected': modelValue?.some(v => v === option.id),
                'tn-select__flat-list-item_disabled': option.disableSelect
              }"
              class="tn-select__flat-list-item"
              @click="flatItemHandler(option.id)"
            >
              <p class="tn-select__flat-list-title">{{ option.title }}</p>
              <div class="tn-select__flat-list-icon-container">
                <TNIcon
                  v-if="modelValue?.some(v => v === option.id)"
                  class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon_selected"
                  name="check"
                />
                <TNIcon
                  v-if="option.iconButton"
                  :name="option.iconButton"
                  class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon"
                  @click.stop="iconButtonClickHandler(option.id)"
                />
              </div>
            </li>
          </ul>
        </template>
        <template v-else>
          <TNTree
            :max-count-settings="null"
            :model-value="modelValue ?? []"
            :options="options"
            @icon-button-click="iconButtonClickHandler"
            @update:model-value="treeItemHandler"
          />
        </template>
      </template>
      <template v-else>
        <p v-if="emptyListHint && !options?.length" class="tn-select__empty-list-hint">
          {{ emptyListHint }}
        </p>
        <div v-if="isLoading" class="tn-select__inner-loader">
          <TNIcon class="tn-select__inner-loader-icon" name="load" />
        </div>
        <ul v-else-if="options?.length" class="tn-select__slot-list-container">
          <li v-for="option in options" :key="option.id" class="tn-select__slot-list-item" @click="slotItemClickHandler(option.id)">
            <slot :is-selected="modelValue?.includes(option.id) ?? false" :option="option" name="items"></slot>
          </li>
        </ul>
      </template>
    </TNBs>
  </TNFormItem>
</template>

<script lang="ts" setup generic="TId extends string | number = string | number">
import { computed, nextTick, onMounted, onUnmounted, ref, VNode, watch } from "vue";
import TNTree from "../tree/tree.vue";
import TNBs from "../bottom-sheet/bottom-sheet.vue";
import TransitionCollapse from "../transitions/transition-collapse.vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import { TNTreeProps } from "../tree/tree.types";
import TNSearch from "../search/search.vue";
import TNButton from "../button/button.vue";
import TNIcon from "../icons/icon.vue";
import TNPopover from "../popover/popover.vue";
import { recursive } from "../tree/helpers";
import { TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { vClickOutside } from "../../directives/click-outside";
import TNFormItem from "../form-item/form-item.vue";

defineOptions({
  name: "TNMultiSelector"
});

const props = withDefaults(
  defineProps<
    TNFormItemProps & {
      /** Размер компонента. */
      size?: "s" | "m";
      /** Текст ошибки поиска. */
      searchError?: string;
      /** Включение поисковой строки. */
      searchable?: boolean;
      /** Placeholder для поисковой строки. */
      searchPlaceholder?: string;
      /** Placeholder для поля компонента. */
      placeholder?: string;
      /** Отключение компонента. */
      disabled?: boolean;
      /** Функционал очистки содержимого по кнопке. */
      clearable?: boolean;
      /** Текст из поисковой строки. */
      searchQuery?: string;
      /** Массив опций для селектора. */
      options?: TNTreeProps.Option<TId>[];
      /** Значение value переменной для компонента. */
      modelValue?: TId[];
      /** Состояние загрузки компонента. */
      isLoading?: boolean;
      /** Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева. */
      teleportTo?: string;
      /** Передача одноименного параметра для боттом-шита. */
      isMobileMiniApp?: boolean;
      /** Отображает одноуровневый список без вложенности. */
      flat?: boolean;
      /** Подсказка для пустого списка опций выбора. */
      emptyListHint?: string;
      /** Кастомный класс для компонента TNBottomSheet. */
      bottomSheetCustomClass?: string;
      /** Включение функционала скролла к выбранным опциям. */
      scrollSelectedIntoView?: boolean;
      /** Позиционирование всплывающего окна относительно триггер-элемента. */
      position?: ITNPopoverPosition;
      /** Отображать всплывающее окно с другой стороны, если с нужной не хватает места. */
      flip?: boolean;
      /** Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана. */
      shift?: boolean;
      /** Опции для всплывающего окна. */
      popperOptions?: IPopoverOptions;
      /** Установить фокус на поле ввода при открытии селектора при включенном searchable. */
      searchFocus?: boolean;
      /** Отрисовывает выбранные чипсины под компонентом. */
      chipsUnderWrapper?: boolean;
    }
  >(),
  {
    size: "m",
    searchError: "",
    searchPlaceholder: "Искать",
    placeholder: " ",
    clearable: true,
    searchQuery: "",
    modelValue: () => [],
    options: () => [],
    teleportTo: "main",
    bottomSheetCustomClass: "",
    position: "bottom-left",
    flip: true,
    shift: true,
    chipsUnderWrapper: false
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении modelValue. */
  (e: "update:modelValue", optionId?: TId[], initial?: boolean): void;
  /** Событие вызывается при открытии селектора. */
  (e: "open"): void;
  /** Событие вызывается при закрытии селектора. */
  (e: "close"): void;
  /** Событие вызывается при вводе текста в строку поиска. */
  (e: "searchHandler", queryString: string): void;
  /** Событие вызывается при нажатии на иконку у опции. */
  (e: "iconButtonClick", optionId: TId): void;
}>();

const slots = defineSlots<
  TNFormItemSlots & {
    /** Слот для кастомного отображения выбранного элемента. */
    value?: (scope: { isSelected: boolean; option: TNTreeProps.Option<TId> }) => VNode[];
    /** Слот для кастомного отображения списка опций селектора. */
    items?: (scope: { isSelected: boolean; option: TNTreeProps.Option<TId> }) => VNode[];
  }
>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(mobileBreakPoint ?? 0);

const hasValueSlot = computed<boolean>(() => !!slots.value);
const hasItemsSlot = computed<boolean>(() => !!slots.items);
const isOpen = ref<boolean>(false);
const isDirty = ref<boolean>(false);
const bottomSheet = ref<HTMLElement | null>(null);
const rootElement = ref<HTMLElement | null>(null);
const desktopWrapper = ref<HTMLElement | null>(null);
const isInnerContainerOpened = ref<boolean>(false);
const searchComponent = ref<InstanceType<typeof TNSearch> | null>(null);
const isMounted = ref<boolean>(false);
const chipsUnderWrapperElement = ref<HTMLElement | null>(null);

const floatElementWidth = computed<string>(() => (props.popperOptions?.strategy === "fixed" ? (rootElement.value?.offsetWidth ?? "0") + "px" : "100%"));
const selectedOption = computed<TNTreeProps.Option<TId>[]>(() => {
  let selectedOption: TNTreeProps.Option<TId>[] = [];
  recursive(props.options, o => {
    if (props.modelValue?.includes(o.id)) {
      selectedOption.push(o);
    }
  });
  return selectedOption;
});

onMounted(() => {
  isMounted.value = true;
});

function itemClick(item: TId) {
  const index = props.modelValue?.findIndex(el => el === item);
  if (index !== undefined && index !== null && index >= 0) {
    const value = [...(props.modelValue || [])];
    value.splice(index, 1);
    emit("update:modelValue", value);
  }
}

onUnmounted(() => {
  window.removeEventListener("scroll", closeSelector);
});

nextTick(() => {
  if (!isMobile.value) {
    window.addEventListener("scroll", closeSelector);
  }
});

function treeItemHandler(result: TId[], initial: boolean) {
  isDirty.value = true;
  emit("update:modelValue", result, initial);
}

function flatItemHandler(result: TId) {
  const resultIndex = props.modelValue?.findIndex(v => v === result);
  const value = [...(props.modelValue || [])];
  if (resultIndex !== undefined && resultIndex !== -1) {
    value.splice(resultIndex, 1);
    emit("update:modelValue", value);
  } else {
    emit("update:modelValue", [...value, result]);
  }
  isDirty.value = true;
}

function openSelector() {
  emit("open");
  isOpen.value = true;

  isInnerContainerOpened.value = true;

  if (props.scrollSelectedIntoView) {
    setTimeout(() => {
      let element: HTMLElement | null = null;
      if (bottomSheet.value) {
        element = bottomSheet.value;
      } else if (desktopWrapper.value) {
        element = desktopWrapper.value;
      }
      if (element) {
        const selectedItem: HTMLElement | null = element.querySelector(".tn-select__flat-list-item_selected, .tn-checkbox__btn_checked");
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: "smooth"
          });
        }
      }
    }, 300);
  }
  if (props.searchFocus && props.searchable) {
    const focus = () => {
      if (searchComponent.value) {
        searchComponent.value.$el.querySelector(".tn-search__inner-input")?.focus();
      }
    };
    if (isMobile.value) {
      setTimeout(focus, 300);
    } else {
      nextTick(focus);
    }
  }
}

function closeSelector() {
  emit("close");
  isInnerContainerOpened.value = false;
  isOpen.value = false;
}

function toggleSelector() {
  if (isOpen.value) {
    closeSelector();
  } else {
    openSelector();
  }
}

function searchQueryHandler(event: string) {
  emit("searchHandler", event);
}

watch(
  () => isOpen.value,
  next => {
    if (next) {
      if (!isMobile.value) {
        window.addEventListener("scroll", closeSelector);
      }
    } else {
      window.removeEventListener("scroll", closeSelector);
      isDirty.value = false;
    }
  }
);

const getValueItemTitle = (value: TId): string => {
  let title = String(value);
  recursive(props.options, o => {
    if (o.id === value) {
      title = o.title;
    }
  });
  return title;
};

const iconButtonClickHandler = (id: TId) => {
  closeSelector();
  emit("iconButtonClick", id);
};

function slotItemClickHandler(result: TId) {
  const foundItem = props.options.find(option => option.id === result);
  if (foundItem && !foundItem.disableSelect && !foundItem.disabled) {
    const resultIndex = props.modelValue?.findIndex(v => v === result);
    const value = [...(props.modelValue || [])];

    if (resultIndex !== undefined && resultIndex !== -1) {
      value.splice(resultIndex, 1);
      emit("update:modelValue", value);
    } else {
      emit("update:modelValue", [...value, result]);
    }
    isDirty.value = true;
  }
}
</script>

<style lang="css" src="../select/select.css"></style>

<style lang="css">
.tn-select__inner-input-list {
  display: flex;
  max-width: 100%;
  overflow: auto;
  margin-left: -10px;
}

.tn-select__inner-input-item {
  display: flex;
  flex: 0 1 auto;
  background-color: var(--background-secondary-a-enabled);
  border-radius: 5px;
  font-size: var(--font-size-body-medium);
  padding: 5px 9px;
  height: 31px;
  align-items: center;
  white-space: nowrap;
}

.tn-button.tn-select__inner-input-item-close {
  cursor: pointer;
  margin-left: 11px;
  width: 11px;
  height: 11px;
  flex: 11px 0 0;
  padding: 0;
  border-radius: 0;
  color: var(--content-tertiary-enabled);
}

.tn-button.tn-select__inner-input-item-close:hover {
  color: var(--content-tertiary-hover);
}

.tn-button.tn-select__inner-input-item-close:active {
  color: var(--content-tertiary-pressed);
}

.tn-select__inner-input-list::-webkit-scrollbar {
  display: none;
}

.tn-select__inner-input-item:not(:last-child) {
  margin-right: 4px;
}

.tn-select_multiselect .tn-select__inner-input-slot {
  overflow: auto;
}

.tn-select_multiselect .tn-select__inner-input-slot::-webkit-scrollbar {
  display: none;
}

.tn-select__chips-under-wrapper {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;

  .tn-select__inner-input-slot,
  .tn-select__inner-input-list {
    margin-left: unset;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tn-select__inner-input-item {
    margin: 0;
  }
}
</style>
