<template>
  <TNFormItem
    class="tn-select-v2"
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

    <!-- Десктоп: поповер инстанцируется только вне мобильного вьюпорта. -->
    <TNPopover
      v-if="!isMobile"
      :flip="flip"
      :inline="false"
      :popper-options="popperOptions"
      :offset="popperOptions?.offset"
      :position="position"
      :shift="shift"
      :visible="isOpen"
      :width="floatElementWidth"
      :window-styled="false"
      class="tn-select-v2__popover"
    >
      <template #trigger>
        <TNSelectV2Control
          ref="control"
          :has-selection="hasSelection"
          :display-label="displayLabel"
          :selected-option="selectedOption"
          :model-value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :size="size"
          :error="error"
          :success="success"
          :is-open="isOpen"
          :clearable="isClearable"
          @open="open"
          @toggle="toggle"
          @clear="clear"
        >
          <template v-if="$slots.value" #value="scope"><slot name="value" v-bind="scope" /></template>
        </TNSelectV2Control>
      </template>

      <template #content>
        <div v-if="isOpen" class="tn-select-v2__menu">
          <TransitionCollapse>
            <div v-if="isOpen" v-click-outside="close" :class="{ 'tn-select-v2__dropdown_search': searchable }" class="tn-select-v2__dropdown">
              <div v-if="searchable" class="tn-select-v2__search-wrapper">
                <TNSearch
                  ref="searchComponent"
                  :model-value="innerQuery"
                  :placeholder="searchPlaceholder"
                  class="tn-select-v2__search"
                  @update:model-value="onSearch"
                />
              </div>

              <TNSelectV2Options
                :items="items"
                :is-loading="isLoading"
                :empty-list-hint="emptyListHint"
                :not-found-hint="notFoundHint"
                :has-query="!!innerQuery.trim()"
                @select="selectOption"
              >
                <template v-if="$slots.option" #option="scope"><slot name="option" v-bind="scope" /></template>
              </TNSelectV2Options>
            </div>
          </TransitionCollapse>
        </div>
      </template>
    </TNPopover>

    <!-- Мобила: контрол без поповера + bottom-sheet. -->
    <template v-else>
      <TNSelectV2Control
        ref="control"
        :has-selection="hasSelection"
        :display-label="displayLabel"
        :selected-option="selectedOption"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :size="size"
        :error="error"
        :success="success"
        :is-open="isOpen"
        :clearable="isClearable"
        @open="open"
        @toggle="toggle"
        @clear="clear"
      >
        <template v-if="$slots.value" #value="scope"><slot name="value" v-bind="scope" /></template>
      </TNSelectV2Control>

      <TNBs
        :custom-class="['tn-select-v2__bottom-sheet', bottomSheetCustomClass ?? '']"
        :header="{ title: label, description }"
        :is-mobile-mini-app="isMobileMiniApp"
        :is-open="isOpen"
        :teleport-to="teleportTo"
        :full-height="searchable"
        @hide="close"
      >
        <template v-if="searchable" #header>
          <TNSearch
            ref="searchComponent"
            :model-value="innerQuery"
            :placeholder="searchPlaceholder"
            class="tn-select-v2__search"
            size="s"
            @update:model-value="onSearch"
          />
        </template>

        <TNSelectV2Options
          :items="items"
          :is-loading="isLoading"
          :empty-list-hint="emptyListHint"
          :not-found-hint="notFoundHint"
          :has-query="!!innerQuery.trim()"
          @select="selectOption"
        >
          <template v-if="$slots.option" #option="scope"><slot name="option" v-bind="scope" /></template>
        </TNSelectV2Options>
      </TNBs>
    </template>
  </TNFormItem>
</template>

<script
  lang="ts"
  setup
  generic="
    TOption extends Record<string, any> | string | number = Record<string, any>,
    TValueKey extends TNSelectV2PrimitiveKeys<TOption> | undefined = undefined
  "
>
import { computed, onUnmounted, readonly, ref, watch, nextTick, MaybeRef, VNode } from "vue";
import TNFormItem from "../form-item/form-item.vue";
import TNPopover from "../popover/popover.vue";
import TNBs from "../bottom-sheet/bottom-sheet.vue";
import TNSearch from "../search/search.vue";
import TransitionCollapse from "../transitions/transition-collapse.vue";
import TNSelectV2Control from "./components/select_v2-control/select_v2-control.vue";
import TNSelectV2Options from "./components/select_v2-options/select_v2-options.vue";
import { vClickOutside } from "../../directives/click-outside";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { useLibraryOptions } from "../../composables/library-options";
import { useSelectOptions } from "./components/select_v2-options/use-select-options";
import { debounce } from "../../helpers";
import type { TNSelectV2Item, TNSelectV2PrimitiveKeys } from "./components/select_v2-options/select_v2-options.types";
import type { TNSelectV2Expose, TNSelectV2ModelValue, TNSelectV2OptionProps, TNSelectV2OptionSlotScope } from "./select_v2.types";
import type { TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";

/** Локальный алиас: подстановка generic-параметров компонента в вынесенный тип модели. */
type TModelValue = TNSelectV2ModelValue<TOption, TValueKey>;

defineOptions({
  name: "TNSelectV2"
});

const props = withDefaults(
  defineProps<
    TNFormItemProps &
      TNSelectV2OptionProps<TOption, TValueKey> & {
        /** Текст-заглушка, когда ничего не выбрано. */
        placeholder?: string;
        /** Отключение компонента. */
        disabled?: boolean;
        /** Кнопка очистки выбранного значения. */
        clearable?: boolean;
        /** Размер компонента. */
        size?: "s" | "m";
        /** Включение поисковой строки. */
        searchable?: boolean;
        /** Контролируемое значение поисковой строки. */
        searchQuery?: string;
        /** Placeholder поисковой строки. */
        searchPlaceholder?: string;
        /** Установить фокус на поиск при открытии (при `searchable`). */
        searchFocus?: boolean;
        /** Сбрасывать строку поиска при закрытии списка. Сброс идёт через `search:update` с пустой строкой, чтобы серверный поиск получил пустой запрос. */
        resetSearchOnClose?: boolean;
        /** Задержка эмита `search:update` в мс — для серверного поиска. Локальный фильтр реагирует на ввод сразу, откладывается только эмит. `0` — без задержки. Читается один раз при создании компонента. */
        searchDebounce?: number;
        /** Фильтровать опции по `labelKey` внутри компонента. Отключите для серверного поиска — и включайте `isLoading` на время запроса, иначе подсказка «не найдено» мелькнёт на устаревших опциях. */
        localFilter?: boolean;
        /** Состояние загрузки списка. */
        isLoading?: boolean;
        /** Подсказка для пустого списка опций. */
        emptyListHint?: string;
        /** Подсказка, когда по поисковому запросу ничего не найдено. */
        notFoundHint?: string;
        /** Позиционирование выпадающего окна относительно триггера. */
        position?: ITNPopoverPosition;
        /** Отображать окно с другой стороны, если не хватает места. */
        flip?: boolean;
        /** Сдвигать окно, чтобы оно не выходило за пределы экрана. */
        shift?: boolean;
        /** Опции для выпадающего окна. */
        popperOptions?: IPopoverOptions;
        /** Контейнер для teleport (используется bottom-sheet). */
        teleportTo?: string;
        /** Параметр `is-mobile-mini-app` для bottom-sheet. */
        isMobileMiniApp?: boolean;
        /** Кастомный класс для bottom-sheet. */
        bottomSheetCustomClass?: string;
      }
  >(),
  {
    options: () => [],
    placeholder: "",
    clearable: true,
    size: "m",
    searchQuery: "",
    searchPlaceholder: "Искать",
    emptyListHint: "Нет данных",
    notFoundHint: "Ничего не найдено",
    searchFocus: true,
    resetSearchOnClose: true,
    searchDebounce: 0,
    localFilter: true,
    position: "bottom-left",
    flip: true,
    shift: true,
    teleportTo: "main",
    bottomSheetCustomClass: ""
  }
);

const emit = defineEmits<{
  /** Вызывается при выборе опции или очистке значения. */
  (e: "update:modelValue", value?: TModelValue): void;
  /** Вызывается при открытии селектора. */
  (e: "select:open"): void;
  /** Вызывается при закрытии селектора. */
  (e: "select:close"): void;
  /** Вызывается при вводе текста в строку поиска. */
  (e: "search:update", query: string): void;
}>();

defineSlots<
  TNFormItemSlots & {
    /** Кастомное отображение выбранного значения в поле компонента. */
    value?: (scope: { option: TOption | null; value?: TModelValue }) => VNode[];
    /** Кастомное отображение опции в списке. */
    option?: (scope: TNSelectV2OptionSlotScope<TOption>) => VNode[];
  }
>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(mobileBreakPoint ?? 0);

const isOpen = ref<boolean>(false);
const innerQuery = ref<string>(props.searchQuery);
// generic-SFC не даёт корректный InstanceType, поэтому типизируем по форме defineExpose.
const control = ref<{ root: HTMLElement | null } | null>(null);
const searchComponent = ref<InstanceType<typeof TNSearch> | null>(null);

const { valueOf, hasSelection, selectedOption, displayLabel, items } = useSelectOptions<TOption, TModelValue>(props, innerQuery);

const isClearable = computed<boolean>(() => props.clearable && !props.disabled && hasSelection.value);

const floatElementWidth = computed<string>(() => (props.popperOptions?.strategy === "fixed" ? (control.value?.root?.offsetWidth ?? "0") + "px" : "100%"));

const selectOption = (item: TNSelectV2Item<TOption>) => {
  close();
  if (!item.selected) emit("update:modelValue", valueOf(item.option) as TModelValue);
};

const clear = () => {
  emit("update:modelValue", undefined);
};

const emitSearch = (query: string) => emit("search:update", query);
const emitSearchDebounced = debounce(emitSearch, props.searchDebounce);

const onSearch = (query: string) => {
  innerQuery.value = query;
  emitSearchDebounced(query);
};

/** Сброс уходит сразу, отложенный эмит устаревшего запроса отменяется. */
const clearSearch = () => {
  emitSearchDebounced.cancel();
  innerQuery.value = "";
  emitSearch("");
};

const open = () => {
  if (props.disabled || isOpen.value) return;
  isOpen.value = true;
  emit("select:open");

  if (props.searchFocus && props.searchable) {
    const focus = () => searchComponent.value?.focusInput();
    if (isMobile.value) {
      setTimeout(focus, 300);
    } else {
      nextTick(focus);
    }
  }
};

const close = () => {
  if (!isOpen.value) return;
  isOpen.value = false;
  if (props.resetSearchOnClose && innerQuery.value) clearSearch();
  emit("select:close");
};

const toggle = () => {
  if (props.disabled) return;
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};

const el = computed<HTMLElement | null>(() => control.value?.root ?? null);

watch(
  () => props.searchQuery,
  query => {
    innerQuery.value = query;
  }
);

const shouldCloseOnScroll = computed<boolean>(() => isOpen.value && !isMobile.value);

watch(shouldCloseOnScroll, active => {
  if (active) {
    window.addEventListener("scroll", close);
  } else {
    window.removeEventListener("scroll", close);
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", close);
  emitSearchDebounced.cancel();
});

// Публичный инстанс разворачивает рефы, поэтому источник для defineExpose допускает MaybeRef при той же форме, что у TNSelectV2Expose.
type TExposeSource = { [K in keyof TNSelectV2Expose]: MaybeRef<TNSelectV2Expose[K]> };

defineExpose<TExposeSource>({
  isOpen: readonly(isOpen),
  el,
  open,
  close,
  toggle,
  clearSearch
});
</script>

<style lang="css" src="./select_v2.css"></style>
