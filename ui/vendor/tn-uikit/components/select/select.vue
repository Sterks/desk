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
          <p v-if="placeholder && modelValue === undefined" class="tn-select__inner-input-placeholder" @click.self="openSelector">
            {{ placeholder }}
          </p>
          <p
            v-if="!hasValueSlot && modelValue !== undefined"
            :class="{ 'tn-select__inner-input-placeholder_disabled': disabled }"
            class="tn-select__inner-input-placeholder tn-select__inner-input-placeholder_main"
            @click="openSelector"
          >
            {{ getValueItemTitle(modelValue) }}
          </p>
          <div v-else-if="selectedOption" class="tn-select__inner-input-slot" @click="openSelector">
            <slot :is-selected="true" :option="selectedOption" name="value" />
          </div>
          <TNIcon :class="{ 'tn-select__inner-arrow_open': isOpen }" class="tn-select__inner-arrow" name="down-m" size="22" @click.self="toggleSelector" />
          <TNButton
            v-if="modelValue !== undefined && clearable && !disabled"
            class="tn-select__inner-clear"
            icon="close-filled"
            type="link"
            @click.stop="$emit('update:modelValue', undefined)"
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
                        'tn-select__flat-list-item_selected': modelValue === option.id,
                        'tn-select__flat-list-item_disabled': option.disableSelect
                      }"
                      class="tn-select__flat-list-item"
                      @click="flatItemHandler(option.id)"
                    >
                      <p class="tn-select__flat-list-title">
                        {{ option.title }}
                      </p>
                      <div class="tn-select__flat-list-icon-container">
                        <TNIcon v-if="modelValue === option.id" class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon_selected" name="check" />
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
                      :model-value="treeModelValue"
                      :multiple="false"
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
                    <slot :is-selected="modelValue === option.id" :option="option" name="items"></slot>
                  </li>
                </ul>
              </template>
            </div>
          </TransitionCollapse>
        </div>
      </template>
    </TNPopover>
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
                'tn-select__flat-list-item_selected': modelValue === option.id,
                'tn-select__flat-list-item_disabled': option.disableSelect
              }"
              class="tn-select__flat-list-item"
              @click="flatItemHandler(option.id)"
            >
              <p class="tn-select__flat-list-title">{{ option.title }}</p>
              <div class="tn-select__flat-list-icon-container">
                <TNIcon v-if="modelValue === option.id" class="tn-select__flat-list-item-icon tn-select__flat-list-item-icon_selected" name="check" />
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
            :model-value="treeModelValue"
            :multiple="false"
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
            <slot :is-selected="modelValue === option.id" :option="option" name="items"></slot>
          </li>
        </ul>
      </template>
    </TNBs>
  </TNFormItem>
</template>

<script lang="ts" setup generic="TId extends string | number = string | number">
import { computed, nextTick, onUnmounted, ref, VNode, watch } from "vue";
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
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import { vClickOutside } from "../../directives/click-outside";
import TNFormItem from "../form-item/form-item.vue";

defineOptions({
  name: "TNSelector"
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
      modelValue?: TId;
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
    }
  >(),
  {
    size: "m",
    searchError: "",
    searchPlaceholder: "Искать",
    placeholder: " ",
    clearable: true,
    searchQuery: "",
    options: () => [],
    teleportTo: "main",
    bottomSheetCustomClass: "",
    position: "bottom-left",
    flip: true,
    shift: true
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении modelValue. */
  (e: "update:modelValue", optionId?: TId, initial?: boolean): void;
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

const { mobileBreakPoint: defaultMobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(defaultMobileBreakPoint ?? 0);

const hasValueSlot = computed<boolean>(() => !!slots.value);
const hasItemsSlot = computed<boolean>(() => !!slots.items);
const treeModelValue = computed<Array<TId>>(() => (props.modelValue ? [props.modelValue] : []));
const isOpen = ref<boolean>(false);
const isDirty = ref<boolean>(false);
const bottomSheet = ref<HTMLElement | null>(null);
const rootElement = ref<HTMLElement | null>(null);
const desktopWrapper = ref<HTMLElement | null>(null);
const isInnerContainerOpened = ref<boolean>(false);
const searchComponent = ref<InstanceType<typeof TNSearch> | null>(null);

const floatElementWidth = computed<string>(() => (props.popperOptions?.strategy === "fixed" ? (rootElement.value?.offsetWidth ?? "0") + "px" : "100%"));

const selectedOption = computed<TNTreeProps.Option<TId> | null>(() => {
  let selectedOptionItem: TNTreeProps.Option<TId> | null = null;

  recursive(props.options, o => {
    if (o.id === props.modelValue) {
      selectedOptionItem = o;
    }
  });

  return selectedOptionItem;
});

onUnmounted(() => {
  window.removeEventListener("scroll", closeSelector);
});

nextTick(() => {
  if (!isMobile.value) {
    window.addEventListener("scroll", closeSelector);
  }
});

function treeItemHandler(result: TId[], initial: boolean) {
  closeSelector();
  isDirty.value = true;
  emit("update:modelValue", result?.[0] || undefined, initial);
}

function flatItemHandler(result: TId) {
  closeSelector();
  emit("update:modelValue", result);
  isDirty.value = true;
}

function slotItemClickHandler(result: TId) {
  const foundItem = props.options.find(option => option.id === result);
  if (foundItem && !foundItem.disableSelect && !foundItem.disabled) {
    closeSelector();
    emit("update:modelValue", result);
    isDirty.value = true;
  }
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
      searchComponent.value?.focusInput();
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
</script>

<style lang="css" src="./select.css"></style>
