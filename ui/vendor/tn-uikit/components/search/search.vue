<template>
  <form v-click-outside="clickOutsideHandler" class="tn-search" @keydown.enter.prevent @submit.prevent>
    <TNPopover
      :disabled-width="disabledPopoverWidth"
      :flip="flip"
      :inline="false"
      :offset="popperOptions?.offset"
      :popper-options="{ ...popperOptions, transform: false }"
      :position="position"
      :shift="shift"
      :visible="showInlineResult"
      :width="floatElementWidth"
      transition="tn-search__result"
    >
      <template #trigger>
        <div ref="rootElement" class="tn-search__container">
          <div
            :class="['tn-search__input-container_size-' + size]"
            class="tn-search__input-container"
            @mouseenter="mouseEnterInputHandler"
            @mouseleave="mouseLeaveInputHandler"
          >
            <div
              v-if="mobileSearchBottomSheet && isMobile"
              :class="[
                {
                  'tn-search__input-button_placeholder': !modelValue || !modelValue.trim(),
                  'tn-search__input-button_filled': !!modelValue?.trim()
                },
                'tn-search__input-button_size-' + size
              ]"
              class="tn-search__input-button"
              @click="inputButtonClickHandler"
            >
              {{ inputButtonText }}
              <transition name="tn-search__right-button-icon">
                <TNIcon
                  v-if="rightButtonIcon && !showResult && !modelValue"
                  :name="rightButtonIcon"
                  class="tn-search__right-button-icon"
                  @click="rightButtonClickHandler"
                />
              </transition>
            </div>
            <input
              v-else
              :id="inputId"
              ref="inputTmplRef"
              v-maska="options"
              :class="[
                {
                  [inputClass ?? '']: !!inputClass
                },
                'tn-search__inner-input_size-' + size
              ]"
              :disabled="disabled"
              :placeholder="placeholder"
              :style="styles"
              :value="modelValue"
              aria-autocomplete="none"
              :autocomplete="autocomplete"
              autocorrect="off"
              class="tn-search__inner-input"
              spellcheck="false"
              tabindex="0"
              type="search"
              @blur="blurHandler"
              @focus="focusHandler"
              @input="handleInput"
              @keyup="keyupHandler"
            />
            <div class="tn-search__btn-container">
              <transition name="tn-search__right-button-icon">
                <label v-if="isShowClearButton" :for="inputId">
                  <TNIcon class="tn-search__clear-button" name="close-filled" size="20" @click="clearButtonClickHandler" />
                </label>
              </transition>
              <transition name="tn-search__right-button-icon">
                <TNIcon
                  v-if="rightButtonIcon && !showResult && !modelValue"
                  :name="rightButtonIcon"
                  class="tn-search__right-button-icon"
                  @click="rightButtonClickHandler"
                />
              </transition>
              <slot name="inputRight"></slot>
            </div>
          </div>
          <TNButton v-if="cancelButton" :disabled="disabled" class="tn-search__cancel-button" type="link" @click.prevent="cancelButtonClickHandler">
            {{ cancelButton }}
          </TNButton>
        </div>
      </template>
      <template #content>
        <div ref="resultListContainer" :style="{ maxHeight: resultMaxHeight ? resultMaxHeight + 'px' : '' }" class="tn-search__result-container">
          <div v-if="(!result?.length && !savedResult?.length) || loading" :class="{ 'tn-search__hint_load': loading }" class="tn-search__hint">
            <TNEmptyContent
              v-if="nothingFoundBadge && nothingFoundTitle && result && !result.length"
              :text="nothingFoundDescription"
              :title="nothingFoundTitle"
              class="tn-search__nothing-found-badge"
              icon="empty-list"
            />
            <template v-else>
              {{ hintText }}
            </template>
            <transition name="tn-search__loading-icon">
              <TNIcon v-if="loading" class="tn-search__loading-icon" name="load" />
            </transition>
          </div>
          <ul v-else-if="result?.length || savedResult?.length" class="tn-search__result-list">
            <slot v-if="haveValueSlot" name="value" />
            <template v-else>
              <template v-for="resultItem in result && result.length ? result : savedResult">
                <TNCell
                  v-if="cell && typeof resultItem === 'object'"
                  :key="resultItem.id + 'cell'"
                  :cell-data="resultItem"
                  :class="{
                    'tn-search__result-cell-item_selected': isResultItemSelected(resultItem.id)
                  }"
                  class="tn-search__result-cell-item"
                  tag-name="li"
                  @mousedown="selectHandler(resultItem.id)"
                  @click.stop
                />
                <li
                  v-else-if="typeof resultItem === 'object'"
                  :key="resultItem.id"
                  :class="{
                    'tn-search__result-item_selected': isResultItemSelected(resultItem.id)
                  }"
                  class="tn-search__result-item"
                  @mousedown="selectHandler(resultItem.id)"
                >
                  {{ resultItem.title }}
                </li>
                <p v-else :key="resultItem" class="tn-search__result-group">
                  <span class="tn-search__result-group-title">
                    {{ resultItem }}
                  </span>
                  <span
                    v-if="groupTitleButton && showGroupTitleButton(resultItem)"
                    class="tn-search__result-group-title-button"
                    @click="groupTitleClick(resultItem)"
                  >
                    {{ groupTitleButton }}
                  </span>
                </p>
              </template>
            </template>
          </ul>
        </div>
      </template>
    </TNPopover>
    <TNBottomSheet
      v-if="mobileSearchBottomSheet && isMobile"
      :custom-class="['tn-search__bottom-sheet', bottomSheetCustomClass ?? '']"
      :header="bottomSheetHeader"
      :is-mobile-mini-app="isMobileMiniApp"
      :is-open="!!showResult"
      full-height
      inner-scroll
      @hide="$emit('window:close')"
    >
      <template #header>
        <input
          ref="inputTmplRef"
          v-maska="options"
          :class="[
            {
              [inputClass ?? '']: !!inputClass
            },
            'tn-search__inner-input_size-s'
          ]"
          :placeholder="placeholder"
          :style="styles"
          :value="modelValue"
          aria-autocomplete="none"
          :autocomplete="autocomplete"
          autocorrect="off"
          class="tn-search__inner-input"
          spellcheck="false"
          tabindex="0"
          type="search"
          @blur="blurHandler"
          @focus="focusHandler"
          @input="handleInput"
          @keyup.enter="enterKeyHandle"
        />
      </template>
      <div v-if="(!result?.length && !savedResult?.length) || loading" :class="{ 'tn-search__hint_load': loading }" class="tn-search__hint">
        <div v-if="nothingFoundBadge && nothingFoundTitle && result && !result.length" class="tn-search__nothing-found-badge">
          <div class="tn-search__nothing-found-icon"></div>
          <p class="tn-search__nothing-found-title">
            {{ nothingFoundTitle }}
          </p>
          <p v-if="nothingFoundDescription" class="tn-search__nothing-found-description">
            {{ nothingFoundDescription }}
          </p>
        </div>
        <template v-else>
          {{ hintText }}
        </template>
        <transition name="tn-search__loading-icon">
          <TNIcon v-if="loading" class="tn-search__loading-icon" name="load" />
        </transition>
      </div>
      <ul v-else-if="result?.length || savedResult?.length" class="tn-search__result-list">
        <slot v-if="haveValueSlot" name="value" />
        <template v-else>
          <template v-for="resultItem in result?.length ? result : savedResult">
            <TNCell
              v-if="cell && typeof resultItem === 'object'"
              :key="resultItem.id + 'cell'"
              :cell-data="resultItem"
              tag-name="li"
              @mousedown="selectHandler(resultItem.id)"
              @click.stop
            />
            <li v-else-if="typeof resultItem === 'object'" :key="resultItem.id" class="tn-search__result-item" @mousedown="selectHandler(resultItem.id)">
              {{ resultItem.title }}
            </li>
            <p v-else :key="resultItem" class="tn-search__result-group">
              <span class="tn-search__result-group-title">
                {{ resultItem }}
              </span>
              <span
                v-if="groupTitleButton && showGroupTitleButton(resultItem)"
                class="tn-search__result-group-title-button"
                @click="groupTitleClick(resultItem)"
              >
                {{ groupTitleButton }}
              </span>
            </p>
          </template>
        </template>
      </ul>
    </TNBottomSheet>
  </form>
</template>

<script lang="ts" setup>
import { StyleValue, VNode } from "vue";
import { computed, nextTick, ref } from "vue";
import TNIcon from "../icons/icon.vue";
import TNCell from "../cell/cell.vue";
import TNButton from "../button/button.vue";
import TNBottomSheet from "../bottom-sheet/bottom-sheet.vue";
import TNPopover from "../popover/popover.vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import type { ITNSearchResult } from "./search.types";
import type { IconNames } from "../icons/icon-names";
import { vMaska } from "maska/vue";
import type { MaskInputOptions, MaskTokens } from "maska";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import TNEmptyContent from "../empty-content/empty-content.vue";
import { generateElementID } from "../../helpers";
import { vClickOutside } from "../../directives/click-outside";

defineOptions({
  name: "TNSearch"
});

const props = withDefaults(
  defineProps<{
    /** Стили для DOM-элемента input. */
    styles?: StyleValue;
    /** Размер компонента. */
    size?: "s" | "m";
    /** Подсказка при пустом инпуте и фокусе на нём. */
    searchHint?: string;
    /** Заголовок при отсутствии результата после поиска. */
    nothingFoundTitle?: string;
    /** Описание при отсутствии результата после поиска. Работает только вместе с `nothingFoundBadge`. */
    nothingFoundDescription?: string;
    /** Плейсхолдер. */
    placeholder?: string;
    /** Значение value переменной для компонента. */
    modelValue?: string;
    /** Добавляет кастомные классы к тегу input. */
    inputClass?: string;
    /** Данные для отображения поля результатов. Вид данных: "Group" - заголовок для результатов; { id, title } - один из результатов поиска. */
    result?: ITNSearchResult[];
    /** Максимальная высота контейнера результатов. */
    resultMaxHeight?: string | number;
    /** Отображение статуса загрузки. */
    loading?: boolean;
    /** Режим отображения результата в формате компонента `TNCell`. */
    cell?: boolean;
    /** Отображение выпадающего окна. */
    showResult?: boolean;
    /** Название иконки для отображения кнопки в правой части инпута. */
    rightButtonIcon?: IconNames;
    /** Текст кнопки для отображения кнопки отмены справа от инпута. */
    cancelButton?: string;
    /** Отображение для мобильного адаптива окна поиска в bottom-sheet. */
    mobileSearchBottomSheet?: boolean;
    /** Параметр `is-mobile-mini-app` для bottom-sheet. */
    isMobileMiniApp?: boolean;
    /** Заголовок и описание bottom-sheet. */
    bottomSheetHeader?: { title?: string; description?: string };
    /** Кастомный класс для bottom-sheet. */
    bottomSheetCustomClass?: string;
    /** Отключение компонента. */
    disabled?: boolean;
    /** Отображать компонент пустого списка. */
    nothingFoundBadge?: boolean;
    /** Текст кнопки в заголовке группы результатов поиска. */
    groupTitleButton?: string;
    /** Заголовки групп результатов поиска. */
    showGroupTitles?: Record<string, boolean>;
    /** Позиционирование всплывающего окна относительно trigger-элемента. */
    position?: ITNPopoverPosition;
    /** Отображать всплывающее окно с другой стороны, если с нужной не хватает места. */
    flip?: boolean;
    /** Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана. */
    shift?: boolean;
    /** Опции для всплывающего окна. */
    popperOptions?: IPopoverOptions;
    /** Шаблон маскирования вводимого текста. */
    maskTemplate?: string;
    /** Задание собственных токенов для шаблона маскирования. */
    maskTokens?: MaskTokens;
    /** Включение возможности выбора результата поиска клавиатурой. */
    select?: boolean;
    /** Выключить автоматический просчет ширины для `TNPopover`. */
    disabledPopoverWidth?: boolean;
    /** Настройка поведения автозаполнения инпута. */
    autocomplete?: string;
  }>(),
  {
    size: "m",
    searchHint: "Введите 3 символа, чтобы начать поиск",
    nothingFoundTitle: "",
    nothingFoundDescription: "",
    placeholder: "Найти",
    resultMaxHeight: 360,
    loading: false,
    cell: false,
    showResult: false,
    cancelButton: "",
    mobileSearchBottomSheet: false,
    isMobileMiniApp: false,
    bottomSheetHeader: () => ({}),
    bottomSheetCustomClass: "",
    disabled: false,
    showGroupTitles: () => ({}),
    position: "bottom-left",
    flip: true,
    autocomplete: "off"
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении `modelValue`. */
  (e: "update:modelValue", value: string): void;
  /** Событие вызывается при расфокусе поля ввода. */
  (e: "blur", targetValue: string): void;
  /** Событие вызывается при фокусе на поле ввода. */
  (e: "focus", targetValue: string): void;
  /** Событие вызывается при нажатии Enter. */
  (e: "enter", targetValue: string): void;
  /** Событие вызывается при клике вне компонента. */
  (e: "click:outside", value?: string): void;
  /** Событие вызывается при выборе результата поиска. */
  (e: "select", value: string): void;
  /** Происходит когда открывается `Bottom Sheet` в мобильном адаптиве. */
  (e: "window:open"): void;
  /** Происходит когда закрывается `Bottom Sheet` в мобильном адаптиве. */
  (e: "window:close"): void;
  /** Происходит при клике на кнопку отмены. */
  (e: "click:cancelButton", event: MouseEvent): void;
  /** Происходит при клике на кнопку справа в поле ввода компонента. */
  (e: "click:rightButton", event: MouseEvent): void;
  /** Событие вызывается при клике на заголовок группы результатов поиска. */
  (e: "click:groupTitle", groupName: string): void;
}>();

const slots = defineSlots<{
  /** Слот для отображения своих элементов выдачи. */
  value?: () => VNode[];
  /** Слот для отображения контента в правой части поля ввода. */
  inputRight?: () => VNode[];
}>();

const { mobileBreakPoint, inputMaskTemplates } = useLibraryOptions();

const { isMobile } = useViewport(mobileBreakPoint ?? 0);
const savedResult = ref<ITNSearchResult[]>([]);
const selection = ref<{ enabled: boolean; position: number }>({
  enabled: false,
  position: 0
});
const resultListContainer = ref<HTMLElement | null>(null);
const rootElement = ref<HTMLElement | null>(null);
const isMouseOnInput = ref<boolean>(false);
const isInputFocused = ref<boolean>(false);

const inputId = generateElementID("tn-input");
const inputTmplRef = ref<HTMLInputElement | null>(null);

const floatElementWidth = computed<string>(() => (props.popperOptions?.strategy === "fixed" ? (rootElement.value?.offsetWidth ?? "0") + "px" : "100%"));

const hintText = computed<string>(() => (props.result && !props.result.length && props.showResult ? props.nothingFoundTitle : props.searchHint));

const haveValueSlot = computed<boolean>(() => !!slots.value);

const inputButtonText = computed<string>(() => (props.modelValue?.trim() ? props.modelValue || "" : props.placeholder));

const showInlineResult = computed<boolean>(() => {
  if (props.mobileSearchBottomSheet) {
    return !isMobile.value && props.showResult;
  }
  return props.showResult;
});

const options = computed<MaskInputOptions | undefined>(() =>
  props.maskTemplate
    ? {
        mask: props.maskTemplate,
        tokens: { ...inputMaskTemplates, ...props.maskTokens }
      }
    : undefined
);

const isShowClearButton = computed<boolean>(() => !!props.modelValue?.length && (isInputFocused.value || isMouseOnInput.value));

const focusHandler = (event: FocusEvent) => {
  isInputFocused.value = true;
  emit("focus", (event.target as HTMLInputElement).value);
};

const blurHandler = (event: FocusEvent) => {
  isInputFocused.value = false;
  resetSelect();
  emit("blur", (event.target as HTMLInputElement).value);
};

const mouseEnterInputHandler = () => {
  isMouseOnInput.value = true;
};

const mouseLeaveInputHandler = () => {
  isMouseOnInput.value = false;
};

const clearButtonClickHandler = () => {
  emit("update:modelValue", "");
};

const clickOutsideHandler = () => {
  if (isMobile.value && props.mobileSearchBottomSheet && props.showResult) {
    return;
  }
  if (props.result) {
    if (!haveValueSlot.value) {
      savedResult.value = [...props.result];
    }
    emit("click:outside", props.modelValue);
    if (!haveValueSlot.value) {
      setTimeout(() => {
        savedResult.value = [];
      }, 300);
    }
  }
};

const selectHandler = (value: string) => {
  emit("select", value);
};

const cancelButtonClickHandler = (event: MouseEvent) => {
  emit("click:cancelButton", event);
};

const rightButtonClickHandler = (event: MouseEvent) => {
  emit("click:rightButton", event);
};

const inputButtonClickHandler = () => {
  if (!props.disabled) {
    emit("window:open");
  }
};
const showGroupTitleButton = (groupName: string): boolean => props.showGroupTitles[groupName];
const groupTitleClick = (groupName: string) => {
  emit("click:groupTitle", groupName);
};
const keyupHandler = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" && props.select) {
    selectNext();
    event.preventDefault();
  } else if (event.key === "ArrowUp" && props.select) {
    selectPrev();
    event.preventDefault();
  } else if (event.key === "ArrowRight" && props.select && selection.value.enabled && props.result) {
    let groupName = "";

    for (let i = 0; i <= props.result.length; i++) {
      const resultItem = props.result[i];
      if (typeof resultItem === "string") {
        groupName = resultItem;
      } else {
        if (i === selection.value.position) {
          break;
        }
      }
    }
    if (groupName) {
      emit("click:groupTitle", groupName);
    }
  } else if (event.key === "Enter") {
    if (selection.value.enabled && props.select && props.result) {
      const resultItem = props.result[selection.value.position];
      if (resultItem && typeof resultItem !== "string" && resultItem) {
        emit("select", resultItem.id);
      }
      (event.target as HTMLInputElement).blur();
      event.preventDefault();
    } else {
      emit("enter", (event.target as HTMLInputElement).value);
    }
  }
};
const selectNext = () => {
  if (props.result?.length) {
    if (selection.value.enabled) {
      selection.value.position++;
      if (selection.value.position === props.result.length) {
        selection.value.position = 0;
      }
    } else {
      selection.value.enabled = true;
      selection.value.position = 0;
    }
    if (typeof props.result[selection.value.position] === "string") {
      selectNext();
      return;
    }
    scrollToSelected();
  }
};
const selectPrev = () => {
  if (props.result?.length) {
    if (selection.value.enabled) {
      selection.value.position--;
      if (selection.value.position < 0) {
        selection.value.position = props.result.length - 1;
      }
    } else {
      selection.value.enabled = true;
      selection.value.position = props.result.length - 1;
    }
    if (typeof props.result[selection.value.position] === "string") {
      selectPrev();
      return;
    }
    scrollToSelected();
  }
};
const scrollToSelected = () => {
  nextTick(() => {
    resultListContainer.value?.querySelector(".tn-search__result-item_selected,.tn-search__result-cell-item_selected")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });
};
const resetSelect = () => {
  selection.value = {
    enabled: false,
    position: 0
  };
};
const isResultItemSelected = (id: string): boolean => {
  const resultItem = props.result?.[selection.value.position];

  return !!props.result && props.select && selection.value.enabled && !!resultItem && typeof resultItem === "object" && resultItem.id === id;
};
const handleInput = (e: Event) => {
  // v-maska вызывает событие input второй раз из-за чего 2 события InputEvent и CustomEvent отправляются одновременно
  if (!(e instanceof InputEvent)) return;

  if (e.target instanceof HTMLInputElement) {
    emit("update:modelValue", e.target.value);
  }
};
const enterKeyHandle = (e: Event) => {
  if (e.target instanceof HTMLInputElement) {
    emit("enter", e.target.value);
  }
};

const focusInput = () => {
  inputTmplRef.value?.focus();
};

defineExpose({
  /** Устанавливает фокус на input */
  focusInput
});
</script>

<style lang="css">
.tn-search {
  font-family: var(--font-family-body);
  position: relative;
  width: 100%;
}

.tn-search__container {
  width: 100%;
}

.tn-search__container,
.tn-search__input-container {
  display: flex;
}

.tn-search__input-container {
  position: relative;
  flex: 1 0;
  width: 100%;
  border: 1px solid var(--border-secondary-enabled);
  border-radius: 12px;
}

.tn-search__input-container_size-s {
  height: 40px;
}

.tn-search__input-container_size-m {
  height: 48px;
}

.tn-search__inner-input,
.tn-search__input-button {
  font-family: var(--font-family-body);
  font-weight: var(--font-weight-text);
  background-color: var(--background-primary-a-enabled);
  border: none;
  border-radius: 12px;
  outline: none;
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  color: var(--content-primary-a-enabled);
  transition: 0.3s;
  box-sizing: border-box;
  background-position: 12px center;
  background-repeat: no-repeat;
  padding: 8px 8px 8px 40px;
  background-image: url("data:image/svg+xml,%3Csvg width='17' height='16' viewBox='0 0 17 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5ZM12.3266 13.2408C11.0222 14.3386 9.33833 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.08208 14.5101 10.5498 13.6738 11.7596L16.2071 14.2929C16.5976 14.6834 16.5976 15.3166 16.2071 15.7071C15.8166 16.0976 15.1834 16.0976 14.7929 15.7071L12.3266 13.2408Z' fill='%239CA3B6'/%3E%3C/svg%3E%0A");
  width: 100%;
}

.tn-search__inner-input:disabled,
.tn-search__input-button:disabled {
  background-color: var(--background-primary-a-disabled);
  pointer-events: none;
  border-color: var(--background-accent-disabled);
  color: var(--content-primary-a-disabled);
}

.tn-search__input-button {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-search__inner-input::-webkit-search-decoration {
  display: none;
}

.tn-search__bottom-sheet .tn-search__inner-input {
  margin-top: 16px;
}

.tn-search__cancel-button {
  margin-left: 12px;
  padding: 0;
  border: none;
  height: unset;
  align-self: stretch;
  background-color: transparent;
  color: var(--content-action-enabled);
}

.tn-button.tn-search__cancel-button:hover {
  color: var(--content-action-enabled);
  filter: grayscale(0.2);
}

.tn-button.tn-search__cancel-button:active {
  color: var(--content-action-enabled);
  filter: grayscale(0.3);
}

.tn-search__inner-input:focus,
.tn-search__inner-input:not(:placeholder-shown),
.tn-search__input-button_filled {
  padding: 8px 12px;
  background-position: -24px center;
}

.tn-search__inner-input:focus {
  border-color: var(--border-secondary-pressed);
}

.tn-search__inner-input_size-m,
.tn-search__input-button_size-m {
  padding: 12px 16px 12px 44px;
  background-position: 16px center;
}

.tn-search__inner-input_size-m:focus,
.tn-search__inner-input_size-m:not(:placeholder-shown),
.tn-search__input-button_size-m.tn-search__input-button_filled {
  padding: 12px 16px;
  background-position: -30px center;
}

.tn-search__inner-input::-ms-clear {
  display: none;
}

.tn-search__inner-input::placeholder,
.tn-search__input-button_placeholder {
  color: var(--content-secondary-enabled);
  font-weight: var(--font-weight-text);
}

.tn-search__btn-container {
  display: flex;
  align-items: center;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.tn-search__clear-button {
  color: var(--content-tertiary-enabled);
  margin-right: 16px;
  cursor: pointer;

  &:hover {
    color: var(--content-tertiary-hover);
  }

  &:active {
    color: var(--content-tertiary-pressed);
  }
}

.tn-search__inner-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.tn-search__right-button-icon {
  color: var(--content-tertiary-enabled);
  cursor: pointer;
}

.tn-search__inner-input_size-s .tn-search__right-button-icon {
  right: 12px;
}

.tn-search__result-container {
  overflow: hidden auto;
  margin: 0;
  max-height: 336px;
  z-index: 1;
  min-height: 22px;
}

.tn-search__result-container::-webkit-scrollbar {
  width: 12px;
}

.tn-search__result-container::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 24px;
  background-color: var(--border-secondary-pressed);
}

.tn-search__result-list {
  margin: 0;
  padding: 8px 0;
}

.tn-search__bottom-sheet .tn-search__result-list {
  padding: 0 0 8px 0;
}

.tn-search__result-item {
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.1s linear;
  background-color: var(--background-primary-a-enabled);
  scroll-margin-top: 30px;
}

.tn-search__result-item:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-search__result-cell-item {
  scroll-margin-top: 30px;
}

.tn-search__result-item:active,
.tn-search__result-item_selected,
.tn-search__result-cell-item_selected {
  background-color: var(--background-primary-a-pressed);
}

.tn-search__result-item_selected,
.tn-search__result-cell-item_selected {
  transition-duration: 0s;
}

.tn-search__result-group {
  padding: 4px 16px;
  background-color: var(--background-secondary-a-enabled);
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tn-search__result-group-title {
  color: var(--content-secondary-enabled);
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.tn-search__result-group-title-button {
  color: var(--content-primary-a-enabled);
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-accent);
  line-height: var(--font-lineHeight-body-small);
  cursor: pointer;
}

.tn-search__result-group-title-button:hover {
  color: var(--content-primary-a-hover);
}

.tn-search__result-group-title-button:active {
  color: var(--content-primary-a-pressed);
}

.tn-search__bottom-sheet .tn-search__result-item {
  padding: 5px 0;
}

.tn-search__bottom-sheet .tn-bottom-sheet__header {
  padding-bottom: 10px;
}

.tn-search__bottom-sheet .tn-search__hint {
  padding: 0;
}

.tn-search__hint {
  color: var(--content-secondary-enabled);
  position: relative;
  transition: color 0.1s linear;
  padding: 12px;
}

.tn-search__hint_load {
  color: transparent;
}

.tn-search__nothing-found-badge {
  height: 100%;
}

.tn-search__loading-icon {
  transition: color 0.1s linear;
  color: var(--content-secondary-enabled);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-dark-theme {
  .tn-search__inner-input,
  .tn-search__input-button {
    background-image: url("data:image/svg+xml,%3Csvg width='17' height='16' viewBox='0 0 17 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5ZM12.3266 13.2408C11.0222 14.3386 9.33833 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.08208 14.5101 10.5498 13.6738 11.7596L16.2071 14.2929C16.5976 14.6834 16.5976 15.3166 16.2071 15.7071C15.8166 16.0976 15.1834 16.0976 14.7929 15.7071L12.3266 13.2408Z' fill='%234e5867'/%3E%3C/svg%3E%0A");
  }
}

.tn-search__result-enter,
.tn-search__result-leave-to {
  transform: translateY(-16px);
  opacity: 0;
}

.tn-search__result-enter-active,
.tn-search__result-leave-active {
  transition-property: opacity, transform !important;
  transition-timing-function: ease !important;
  transition-duration: 0.3s !important;
  transform: translateY(-8px);
  opacity: 0;
}

.tn-search__result-enter-to,
.tn-search__result-leave {
  transform: translateY(0);
  opacity: 1;
}

.tn-search__loading-icon-enter,
.tn-search__loading-icon-leave-to,
.tn-search__right-button-icon-enter,
.tn-search__right-button-icon-leave-to {
  opacity: 0;
}

.tn-search__loading-icon-enter-active,
.tn-search__loading-icon-leave-active,
.tn-search__right-button-icon-enter-active,
.tn-search__right-button-icon-leave-active {
  transition: opacity 0.1s linear;
  opacity: 0;
}

.tn-search__loading-icon-enter-to,
.tn-search__loading-icon-leave,
.tn-search__right-button-icon-enter-to,
.tn-search__right-button-icon-leave {
  opacity: 1;
}
</style>
