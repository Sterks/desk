<template>
  <TNFormItem
    class="tn-scroll-select"
    :required="required"
    :error="error"
    :warn="warn"
    :success="success"
    :smooth-message="smoothMessage"
    :label="label"
    :description="description"
    :style="{ '--tn-scroll-select-max-height': maxHeightValue }"
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
      class="tn-scroll-select__popover"
    >
      <template #trigger>
        <div
          ref="rootElement"
          :class="{
            'tn-scroll-select__inner-input_disabled': disabled,
            'tn-scroll-select__inner-input_error': !!error,
            'tn-scroll-select__inner-input_success': !!success,
            'tn-scroll-select__inner-input_warn': !!warn,
            'tn-scroll-select__inner-input_medium': size === 'm',
            'tn-scroll-select__inner-input_open': isOpen,
            'tn-scroll-select__inner-input_clearable': clearable
          }"
          class="tn-scroll-select__inner-input"
        >
          <TNIcon
            :class="{ 'tn-scroll-select__inner-arrow_open': isOpen }"
            class="tn-scroll-select__inner-arrow"
            name="down-m"
            size="24"
            @click="handleSelectorButton"
          />
          <TNButton
            v-if="modelValue?.length && clearable && !disabled"
            class="tn-scroll-select__inner-clear"
            icon="close-filled"
            icon-size-override="20"
            type="link"
            @click.stop="$emit('update:modelValue', [])"
          />
          <TNScroll v-if="reversedModelValue.length || !searchable" class="tn-scroll-select__scroll-body" container-class="tn-scroll-select__scroll">
            <p v-if="placeholder && !modelValue?.length && !searchable" class="tn-scroll-select__inner-input-placeholder" @click.self="openSelector">
              {{ placeholder }}
            </p>
            <ul v-if="modelValue?.length" ref="listElement" class="tn-scroll-select__inner-input-list" @click.self="openSelector">
              <li v-for="item in reversedModelValue" :key="item" class="tn-scroll-select__inner-input-item-body">
                <slot :id="item" name="value">
                  <div class="tn-scroll-select__inner-input-item">
                    <p class="tn-scroll-select__inner-input-item-text">
                      {{ getValueItemTitle(item) }}
                    </p>
                    <TNButton
                      v-if="deletableChips"
                      block
                      class="tn-scroll-select__inner-input-item-close"
                      icon="close-small"
                      icon-size-override="24"
                      type="link"
                      @click.stop="itemClick(item)"
                    />
                  </div>
                </slot>
              </li>
            </ul>
          </TNScroll>
          <div v-if="searchable" class="tn-scroll-select__wrapper-desktop-input-wrapper">
            <TNSearch
              ref="searchComponent"
              :disabled="disabled"
              :model-value="searchQuery"
              :placeholder="shownPlaceholder"
              class="tn-scroll-select__desktop-searcher"
              @blur="handleSearchFocus(false)"
              @focus="handleSearchFocus(true)"
              @update:model-value="searchQueryHandler"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div v-if="!isMobile && isOpen" ref="desktopWrapper" class="tn-scroll-select__desktop-menu">
          <TransitionCollapse>
            <TNScroll
              v-if="isInnerContainerOpened"
              v-click-outside="closeSelector"
              auto-hide
              class="tn-scroll-select__desktop-menu-scroll"
              container-class="tn-scroll-select__wrapper-desktop"
            >
              <template v-if="!hasItemsSlot">
                <p v-if="emptyListHint && !options?.length" class="tn-scroll-select__empty-list-hint">
                  {{ emptyListHint }}
                </p>
                <div v-if="isLoading" class="tn-scroll-select__inner-loader">
                  <TNIcon class="tn-scroll-select__inner-loader-icon" name="load" />
                </div>
                <ul v-else class="tn-scroll-select__flat-list-container">
                  <li
                    v-for="option in options"
                    :key="option.id"
                    :class="{
                      'tn-scroll-select__flat-list-item_selected': modelValue?.some(v => v === option.id),
                      'tn-scroll-select__flat-list-item_disabled': option.disableSelect
                    }"
                    class="tn-scroll-select__flat-list-item"
                    @click="flatItemHandler(option.id)"
                  >
                    <p class="tn-scroll-select__flat-list-title">
                      {{ option.title }}
                    </p>
                    <div class="tn-scroll-select__flat-list-icon-container">
                      <TNIcon
                        v-if="modelValue?.some(v => v === option.id)"
                        class="tn-scroll-select__flat-list-item-icon tn-scroll-select__flat-list-item-icon_selected"
                        name="check"
                      />
                      <TNIcon
                        v-if="option.iconButton"
                        :name="option.iconButton"
                        class="tn-scroll-select__flat-list-item-icon"
                        @click.stop="iconButtonClickHandler(option.id)"
                      />
                    </div>
                  </li>
                </ul>
              </template>
              <template v-else>
                <p v-if="emptyListHint && !options?.length" class="tn-scroll-select__empty-list-hint">
                  {{ emptyListHint }}
                </p>
                <div v-if="isLoading" class="tn-scroll-select__inner-loader">
                  <TNIcon class="tn-scroll-select__inner-loader-icon" name="load" />
                </div>
                <ul v-else class="tn-scroll-select__slot-list-container">
                  <li v-for="option in options" :key="option.id" class="tn-scroll-select__slot-list-item" @click="flatItemHandler(option.id)">
                    <slot :is-selected="modelValue?.includes(option.id) || false" :option="option" name="items"></slot>
                  </li>
                </ul>
              </template>
            </TNScroll>
          </TransitionCollapse>
        </div>
      </template>
    </TNPopover>
    <TNBs
      v-if="isMobile"
      :custom-class="['tn-scroll-select__bottom-sheet', bottomSheetCustomClass || '']"
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
          ref="mobileSearchComponent"
          :model-value="searchQuery"
          :placeholder="searchPlaceholder"
          class="tn-scroll-select__searcher"
          :size="size"
          @update:model-value="searchQueryHandler"
        />
      </template>
      <template v-if="!hasItemsSlot">
        <p v-if="emptyListHint && !options?.length" class="tn-scroll-select__empty-list-hint">
          {{ emptyListHint }}
        </p>
        <div v-if="isLoading" class="tn-scroll-select__inner-loader">
          <TNIcon class="tn-scroll-select__inner-loader-icon" name="load" />
        </div>
        <ul v-else ref="bottomSheet" class="tn-scroll-select__flat-list-container">
          <li
            v-for="option in options"
            :key="option.id"
            :class="{
              'tn-scroll-select__flat-list-item_selected': modelValue?.some(v => v === option.id),
              'tn-scroll-select__flat-list-item_disabled': option.disableSelect
            }"
            class="tn-scroll-select__flat-list-item"
            @click="flatItemHandler(option.id)"
          >
            <p class="tn-scroll-select__flat-list-title">
              {{ option.title }}
            </p>
            <div class="tn-scroll-select__flat-list-icon-container">
              <TNIcon
                v-if="modelValue?.some(v => v === option.id)"
                class="tn-scroll-select__flat-list-item-icon tn-scroll-select__flat-list-item-icon_selected"
                name="check"
              />
              <TNIcon
                v-if="option.iconButton"
                :name="option.iconButton"
                class="tn-scroll-select__flat-list-item-icon tn-scroll-select__flat-list-item-icon"
                @click.stop="iconButtonClickHandler(option.id)"
              />
            </div>
          </li>
        </ul>
      </template>
      <template v-else>
        <p v-if="emptyListHint && !options?.length" class="tn-scroll-select__empty-list-hint">
          {{ emptyListHint }}
        </p>
        <div v-if="isLoading" class="tn-scroll-select__inner-loader">
          <TNIcon class="tn-scroll-select__inner-loader-icon" name="load" />
        </div>
        <ul v-else class="tn-scroll-select__slot-list-container">
          <li v-for="option in options" :key="option.id" class="tn-scroll-select__slot-list-item" @click="flatItemHandler(option.id)">
            <slot :is-selected="modelValue?.includes(option.id) || false" :option="option" name="items"></slot>
          </li>
        </ul>
      </template>
    </TNBs>
  </TNFormItem>
</template>

<script lang="ts" setup generic="TId extends string | number = string | number">
import { computed, ref, VNode } from "vue";
import TNBs from "../bottom-sheet/bottom-sheet.vue";
import TransitionCollapse from "../transitions/transition-collapse.vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import type { TNScrollSelectOption } from "./scroll-select.types";
import TNSearch from "../search/search.vue";
import TNButton from "../button/button.vue";
import TNIcon from "../icons/icon.vue";
import TNPopover from "../popover/popover.vue";
import TNScroll from "../scroll/scroll.vue";
import { TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import { vClickOutside } from "../../directives/click-outside";
import TNFormItem from "../form-item/form-item.vue";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";

defineOptions({
  name: "TNScrollSelect"
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
      options?: TNScrollSelectOption<TId>[];
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
      maxHeight?: number;
      deletableChips?: boolean;
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
    shift: true,
    maxHeight: 96,
    deletableChips: true
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
    value?: (scope: { id: TId }) => VNode[];
    /** Слот для кастомного отображения списка опций селектора. */
    items?: (scope: { isSelected: boolean; option: TNScrollSelectOption<TId> }) => VNode[];
  }
>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(mobileBreakPoint ?? 0);

const hasItemsSlot = computed<boolean>(() => !!slots.items);
const isOpen = ref<boolean>(false);
const bottomSheet = ref<HTMLElement | null>(null);
const rootElement = ref<HTMLElement | null>(null);
const desktopWrapper = ref<HTMLElement | null>(null);
const isInnerContainerOpened = ref<boolean>(false);
const searchComponent = ref<InstanceType<typeof TNSearch> | null>(null);
const mobileSearchComponent = ref<InstanceType<typeof TNSearch> | null>(null);

const listElement = ref<HTMLElement | null>(null);
const isSearchFocused = ref<boolean>(false);

const floatElementWidth = computed<string>(() => (props.popperOptions?.strategy === "fixed" ? (rootElement.value?.offsetWidth ?? "0") + "px" : "100%"));
const maxHeightValue = computed<string>(() =>
  props.maxHeight && Number(props.maxHeight) >= (props.size === "s" ? 40 : 48) ? `${props.maxHeight}px` : `${props.size === "s" ? "40" : "48"}px`
);
const reversedModelValue = computed<TId[]>(() => [...(props?.modelValue || [])].reverse());
const shownPlaceholder = computed<string>(() => (isSearchFocused.value || props?.modelValue?.length ? props.searchPlaceholder : props.placeholder));

function itemClick(item: TId) {
  const index = props.modelValue?.findIndex(el => el === item);
  if (index !== undefined && index >= 0) {
    const value = [...(props.modelValue || [])];
    value.splice(index, 1);
    emit("update:modelValue", value);
  }
}

function flatItemHandler(result: TId) {
  const resultIndex = props.modelValue?.findIndex(v => v === result);
  const value = [...(props.modelValue || [])];
  if (resultIndex !== undefined && resultIndex !== -1) {
    value.splice(resultIndex, 1);
    emit("update:modelValue", value);
  } else {
    emit("update:modelValue", [result, ...value]);
  }
}

function openSelector() {
  if (!props.disabled) {
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
          const selectedItem: HTMLElement | null = element.querySelector(".tn-scroll-select__flat-list-item_selected, .tn-checkbox__btn_checked");
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
        if (isMobile.value && mobileSearchComponent.value) {
          mobileSearchComponent.value.$el.querySelector(".tn-search__inner-input")?.focus();
        } else if (searchComponent.value) {
          searchComponent.value.$el.querySelector(".tn-search__inner-input")?.focus();
        }
      };
      if (isMobile.value) {
        setTimeout(focus, 300);
      } else {
        focus();
      }
    }
  }
}

function closeSelector() {
  if (!isSearchFocused.value) {
    emit("close");
    isInnerContainerOpened.value = false;
    isOpen.value = false;
  }
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

const getValueItemTitle = (value: TId): string => props.options.find(i => i.id === value)?.title || "";

const iconButtonClickHandler = (id: TId) => {
  closeSelector();
  emit("iconButtonClick", id);
};
const handleSearchFocus = (state: boolean) => {
  isSearchFocused.value = state;
  if (state) {
    toggleSelector();
  }
};
const handleSelectorButton = () => {
  if (isSearchFocused.value) {
    isSearchFocused.value = false;
  }
  toggleSelector();
};
</script>

<style lang="css">
.tn-scroll-select {
  position: relative;
  font-family: var(--font-family-body);
  --tn-scroll-select-max-height: 0px;
  --tn-scroll-select-max-height-without-border: calc(var(--tn-scroll-select-max-height) - 2px);
}

.tn-scroll-select__inner-input {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--background-primary-a-enabled);
  border: 1px solid var(--border-secondary-enabled);
  border-radius: 12px;
  outline: none;
  font-size: var(--font-size-body-medium);
  color: var(--content-primary-a-enabled);
  transition-property: color, background-color, border-color;
  transition: linear 0.3s;
  box-sizing: border-box;
  user-select: none;
  height: fit-content;
  max-height: var(--tn-scroll-select-max-height);
  flex-direction: column;
  min-height: 40px;
  overflow: auto;
  padding: 0;
}

.tn-scroll-select__inner-input_medium {
  min-height: 48px;
}

.tn-scroll-select__inner-input_medium .tn-scroll-select__wrapper-desktop-input-wrapper {
  height: 48px;
  flex-shrink: 0;
}

.tn-scroll-select__inner-input_disabled,
.tn-scroll-select__inner-input_disabled:hover {
  background-color: var(--background-primary-a-disabled);
  pointer-events: none;
  border-color: var(--background-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}

.tn-scroll-select__inner-arrow {
  position: absolute;
  right: 12px;
  transform: translateY(50%);
  bottom: 50%;
  z-index: 1;
  transition: transform 0.3s ease;
  color: var(--content-tertiary-enabled);
}

.tn-scroll-select__inner-arrow:hover {
  color: var(--content-tertiary-enabled);
}

.tn-scroll-select__inner-arrow:active {
  color: var(--content-tertiary-enabled);
}

.tn-scroll-select__inner-input:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__inner-arrow {
  bottom: 19px;
}

.tn-scroll-select__inner-input_medium:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__inner-arrow {
  bottom: 24px;
}

.tn-scroll-select__inner-arrow_open {
  transform: rotate(180deg) translateY(-50%);
}

.tn-scroll-select__inner-input_medium .tn-scroll-select__inner-input-item {
  height: 36px;
}

.tn-scroll-select__inner-input-item {
  height: 28px;
}

.tn-scroll-select__inner-input_error {
  border-color: var(--content-system-negative);
}

.tn-scroll-select__inner-input_success {
  border-color: var(--content-system-positive);
}

.tn-scroll-select__inner-input.tn-scroll-select__inner-input_open {
  border-color: var(--content-secondary-disabled);
}

.tn-scroll-select__inner-input.tn-scroll-select__inner-input_open.tn-scroll-select__inner-input_error {
  border-color: var(--content-accent-hover);
}

.tn-scroll-select__inner-input.tn-scroll-select__inner-input_open.tn-scroll-select__inner-input_success {
  border-color: var(--content-system-positive);
}

.tn-scroll-select__inner-clear.tn-button {
  position: absolute;
  right: 48px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  color: var(--content-tertiary-enabled);
  top: 50%;
  z-index: 1;
  transition-property: color;
  border-radius: 50%;
}

.tn-scroll-select__inner-input:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__inner-clear {
  top: 20px;
  right: 14px;
}

.tn-scroll-select__inner-input_medium:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__inner-clear {
  top: 23px;
  right: 14px;
}

.tn-scroll-select__inner-input_medium:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__inner-clear {
  top: 23px;
}

.tn-scroll-select__inner-clear.tn-button:hover {
  color: var(--content-tertiary-hover);
}

.tn-scroll-select__inner-clear.tn-button:active {
  color: var(--content-tertiary-pressed);
}

.tn-scroll-select__inner-input .tn-scroll-select__scroll {
  min-height: 38px;
}

.tn-scroll-select__scroll-body {
  height: inherit;
  max-height: var(--tn-scroll-select-max-height-without-border);
  margin-right: 36px;
  width: calc(100% - 36px);
}

.tn-scroll-select__scroll {
  display: flex;
  flex-flow: column-reverse;
  align-items: flex-start;
}

.tn-scroll-select__inner-input:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__scroll-body {
  margin-right: 0;
  width: 100%;
}

.tn-scroll-select__inner-input_clearable:has(.tn-scroll-select__desktop-searcher) .tn-scroll-select__scroll-body {
  margin-right: 40px;
  width: calc(100% - 40px);
}

.tn-scroll-select__inner-input_clearable:not(:has(.tn-scroll-select__desktop-searcher)) .tn-scroll-select__scroll-body {
  margin-right: 72px;
  width: calc(100% - 72px);
}

.tn-scroll-select__inner-input_medium .tn-scroll-select__scroll {
  min-height: 46px;
}

.tn-scroll-select__inner-input-placeholder {
  color: var(--content-secondary-enabled);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  width: 100%;
}

.tn-scroll-select__inner-input-list {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  min-height: fit-content;
  gap: 4px;
  margin: 0;
  padding: 5px 16px;
  position: relative;
}

.tn-scroll-select__inner-input:has(.tn-scroll-select__wrapper-desktop-input-wrapper) .tn-scroll-select__inner-input-list {
  padding-bottom: 0;
}

.tn-scroll-select__inner-input-item {
  display: flex;
  flex: 0 1 auto;
  width: fit-content;
  background-color: var(--background-secondary-a-enabled);
  border-radius: 5px;
  padding: 4px 8px;
  align-items: center;
  white-space: nowrap;
  box-sizing: border-box;
  margin: 0;
}

.tn-scroll-select__inner-input-item-text {
  color: var(--content-secondary-enabled);
}

.tn-scroll-select__wrapper-desktop-input-wrapper {
  width: 100%;
  padding-right: 24px;
  height: 40px;
  background-color: var(--background-primary-a-enabled);
}

.tn-scroll-select__desktop-searcher .tn-search__input-container {
  border: none;
}

.tn-scroll-select__desktop-searcher .tn-search__inner-input {
  background: none;
  padding: 0 40px 0 16px;
  height: 40px;
}

.tn-scroll-select__inner-input_medium .tn-search__inner-input {
  height: 46px;
}

.tn-scroll-select__inner-input-item-close.tn-button {
  cursor: pointer;
  margin-left: 8px;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  padding: 0;
  border-radius: 0;
  color: var(--content-secondary-enabled);
}

.tn-scroll-select__inner-input-item-close.tn-button:hover {
  color: var(--content-secondary-hover);
}

.tn-scroll-select__inner-input-item-close.tn-button:active {
  color: var(--content-secondary-pressed);
}

.tn-scroll-select .tn-popover__wrapper {
  overflow: hidden;
}

.tn-scroll-select__desktop-menu {
  z-index: 10;
  max-width: 100%;
  height: fit-content;
  overflow: hidden;
}

.tn-scroll-select__desktop-menu-scroll {
  max-height: 350px;
}

.tn-scroll-select__wrapper-desktop {
  border-radius: 12px;
  background-color: var(--background-primary-a-enabled);
  overflow: auto;
  z-index: 10;
}

.tn-scroll-select__wrapper-desktop .tree__item:not(:last-child) {
  margin-bottom: 0;
}

.tn-scroll-select__empty-list-hint {
  color: var(--content-secondary-enabled);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  padding: 8px 12px;
  word-break: break-word;
}

.tn-scroll-select__bottom-sheet .tn-scroll-select__empty-list-hint {
  padding: 0 0 8px;
}

.tn-scroll-select__inner-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
}

.tn-scroll-select__inner-loader-icon {
  color: var(--content-secondary-enabled);
}

.tn-scroll-select__slot-list-container,
.tn-scroll-select__flat-list-container {
  margin: 0;
  padding: 8px 0;

  &:empty {
    display: none;
  }
}

.tn-scroll-select__slot-list-container:empty {
  display: none;
}

.tn-scroll-select__bottom-sheet .tn-scroll-select__slot-list-container,
.tn-scroll-select__bottom-sheet .tn-scroll-select__flat-list-container {
  padding: 0;
}

.tn-scroll-select__flat-list-item {
  padding: 5px 12px;
  background-color: var(--background-primary-a-enabled);
  transition: background-color 0.1s linear;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  cursor: pointer;
}

.tn-scroll-select__slot-list-item {
  background-color: var(--background-primary-a-enabled);
  transition: background-color 0.1s linear;
  display: flex;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  max-width: 100%;
  max-height: 100%;
}

.tn-scroll-select__slot-list-item:hover,
.tn-scroll-select__flat-list-item:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-scroll-select__slot-list-item:active,
.tn-scroll-select__flat-list-item:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-scroll-select__flat-list-item_selected {
  color: var(--content-accent-enabled);
}

.tn-scroll-select__flat-list-item_disabled {
  pointer-events: none;
}

.tn-scroll-select__flat-list-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tn-scroll-select__bottom-sheet .tn-scroll-select__flat-list-item {
  padding: 5px 0;
  background-position: right center;
}

.tn-scroll-select__flat-list-item-icon {
  cursor: pointer;
  color: var(--content-tertiary-enabled);
}

.tn-scroll-select__flat-list-item-icon:hover {
  color: var(--content-tertiary-hover);
}

.tn-scroll-select__flat-list-item-icon:active {
  color: var(--content-tertiary-pressed);
}

.tn-scroll-select__flat-list-item-icon:not(:last-child) {
  margin-right: 8px;
}

.tn-scroll-select__flat-list-item-icon_selected,
.tn-scroll-select__flat-list-item-icon_selected:hover,
.tn-scroll-select__flat-list-item-icon_selected:active {
  cursor: default;
  color: var(--content-accent-enabled);
}

.tn-scroll-select__wrapper-desktop-tree-wrapper {
  padding: 8px 12px;
}

.tn-scroll-select__searcher {
  margin-top: 10px;
}

.tn-scroll-select__flat-list-icon-container {
  display: flex;
}
</style>
