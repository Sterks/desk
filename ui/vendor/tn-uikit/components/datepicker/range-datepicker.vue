<template>
  <TNFormItem
    class="tn-datepicker"
    :required="!hideInput ? required : undefined"
    :error="!hideInput ? error : undefined"
    :warn="!hideInput ? warn : undefined"
    :success="!hideInput ? success : undefined"
    :smooth-message="!hideInput ? smoothMessage : undefined"
    :label="!hideInput ? label : undefined"
    :description="!hideInput ? description : undefined"
  >
    <template v-if="!hideInput && $slots.header" #header><slot name="header" /></template>
    <template v-if="!hideInput && $slots.label" #label><slot name="label" /></template>
    <template v-if="!hideInput && $slots.description" #description><slot name="description" /></template>
    <template v-if="!hideInput && $slots.footer" #footer><slot name="footer" /></template>
    <TNPopover
      :flip="flip"
      :inline="false"
      :popper-options="popperOptions"
      :wrapper-custom-class="customClass"
      :offset="popperOptions?.offset"
      :position="position"
      :shift="shift"
      :visible="!isMobile && (isOpen || (!!hideInput && !!showPicker))"
      :window-styled="false"
      width="auto"
    >
      <template #trigger>
        <div
          :class="{
            'tn-datepicker__inner-input_disabled': disabled,
            'tn-datepicker__inner-input_error': !!error,
            'tn-datepicker__inner-input_warn': !!warn,
            'tn-datepicker__inner-input_success': !!success,
            'tn-datepicker__inner-input_medium': size === 'm',
            'tn-datepicker__inner-input_open': isOpen,
            'tn-datepicker__inner-input_hidden': hideInput
          }"
          class="tn-datepicker__inner-input"
          @click.self="openPicker"
        >
          <p v-if="!hideInput" class="tn-datepicker__inner-input-value" @click="openPicker" v-html="valueLayout"></p>
          <template v-if="!hideInput">
            <TNButton
              v-if="clearable && modelValue?.length && !disabled"
              class="tn-datepicker__inner-clear"
              icon="close-filled"
              type="link"
              @click.stop="clearValue"
            />
            <TNIcon v-else class="tn-datepicker__inner-icon" name="calendar" @click.self="openPicker" />
          </template>
        </div>
      </template>
      <template #content>
        <div v-click-outside="closePicker" class="tn-datepicker__wrapper-desktop tn-datepicker__wrapper-desktop_range">
          <TNCalendar
            :confirm="confirm"
            :custom-locale="customLocale"
            :disabled-dates="disabledDates"
            :disabled-hours="disabledHours"
            :hover-date="hoverDate"
            :locale="locale"
            :max-days-range="Number(maxDaysRange)"
            :minute-step="Number(minuteStep)"
            :range="true"
            :selected-month="selectedMonth"
            :selected-year="selectedYear"
            :value="modelValue"
            :year-range="Number(yearRange)"
            :max-year="maxYear"
            class="tn-datepicker__calendar"
            @close="closePicker"
            @select-day="selectDay"
            @select-year="selectYear"
            @select-month="selectMonth"
            @next-month="nextMonth"
            @previous-month="previousMonth"
            @update-hover-date="updateHoverDate"
          />
          <TNCalendar
            :additional="true"
            :custom-locale="customLocale"
            :disabled-dates="disabledDates"
            :disabled-hours="disabledHours"
            :hover-date="hoverDate"
            :locale="locale"
            :max-days-range="Number(maxDaysRange)"
            :minute-step="Number(minuteStep)"
            :range="true"
            :selected-month="selectedAdditionalMonth"
            :selected-year="selectedAdditionalYear"
            :value="modelValue"
            :year-range="Number(yearRange)"
            :max-year="maxYear"
            class="tn-datepicker__calendar"
            @close="closePicker"
            @select-day="selectDay"
            @select-year="selectYear"
            @select-month="selectMonth"
            @next-month="nextMonth"
            @previous-month="previousMonth"
            @update-hover-date="updateHoverDate"
          />
        </div>
      </template>
    </TNPopover>
    <TNBottomSheet
      v-if="isMobile"
      :custom-class="['tn-datepicker__bottom-sheet', bottomSheetCustomClass ?? '', customClass ?? '']"
      :is-mobile-mini-app="isMobileMiniApp"
      :is-open="isOpen || (!!hideInput && !!showPicker)"
      :lock-swipe="isSelectorOpened"
      :teleport-to="teleportTo"
      @hide="closePicker"
    >
      <TNCalendar
        :class="{ 'tn-datepicker__calendar_bottom-sheet': !isMobileMiniApp }"
        :confirm="confirm"
        :custom-locale="customLocale"
        :disabled-dates="disabledDates"
        :disabled-hours="disabledHours"
        :hover-date="hoverDate"
        :locale="locale"
        :max-days-range="Number(maxDaysRange)"
        :minute-step="Number(minuteStep)"
        :range="true"
        :selected-month="selectedMonth"
        :selected-year="selectedYear"
        :single-mode-range="true"
        :value="modelValue"
        :max-year="maxYear"
        :year-range="Number(yearRange)"
        bottom-sheet
        class="tn-datepicker__calendar"
        @close="closePicker"
        @select-day="selectDay"
        @selector-close="selectorClose"
        @selector-open="selectorOpen"
        @select-year="selectYear"
        @select-month="selectMonth"
        @next-month="nextMonth"
        @previous-month="previousMonth"
        @update-hover-date="updateHoverDate"
      />
      <TNButton v-if="confirm" block class="tn-datepicker__footer-button" type="default" size="lg" @click="closePicker">
        {{ doneButtonLabel }}
      </TNButton>
    </TNBottomSheet>
  </TNFormItem>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from "vue";
import TNCalendar from "./components/calendar/calendar.vue";
import TNButton from "../button/button.vue";
import TNBottomSheet from "../bottom-sheet/bottom-sheet.vue";
import TNIcon from "../icons/icon.vue";
import TNPopover from "../popover/popover.vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import type { IDatepickerLocateConfig, IDay, IDisableDates } from "./datepicker.types";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { type TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import TNFormItem from "../form-item/form-item.vue";
import { vClickOutside } from "../../directives/click-outside";

defineOptions({
  name: "TNRangeDatepicker"
});

const props = withDefaults(
  defineProps<
    TNFormItemProps & {
      /** Размер компонента. */
      size?: "s" | "m";
      /** Отключение компонента. */
      disabled?: boolean;
      /** Значение для компонента. */
      modelValue?: [Date | undefined, Date | undefined];
      /** Выбор предустановленной локализации. */
      locale?: "ru" | "en";
      /** Ручная настройка локализации. */
      customLocale?: IDatepickerLocateConfig;
      /** Вставляет компонент в нужный контейнер DOM-дерева через teleport Vue. */
      teleportTo?: string;
      /** Передача одноименного параметра для bottom-sheet. */
      isMobileMiniApp?: boolean;
      /** Количество лет, доступное для выбора. */
      yearRange?: string | number;
      /** Ограничивает верхнее значение выбора года. */
      maxYear?: string | number;
      /** Запрещенные для выбора даты. */
      disabledDates?: Date[] | IDisableDates;
      /** Запрещенные для выбора часы. */
      disabledHours?: number[];
      /** Шаг минут. */
      minuteStep?: string | number;
      /** Включает ожидание подтверждения при выборе даты. */
      confirm?: boolean;
      /** Задание кастомного класса для bottom-sheet. */
      bottomSheetCustomClass?: string;
      /** Задание кастомного класса для popover. */
      customClass?: string;
      /** Скрывает триггер-элемент инпута. */
      hideInput?: boolean;
      /** Показывает всплывающее окно компонента. */
      showPicker?: boolean;
      /** Добавляет кнопку очистки выбора. */
      clearable?: boolean;
      /** Позиционирование всплывающего окна относительно триггер-элемента. */
      position?: ITNPopoverPosition;
      /** Отображает всплывающее окно с другой стороны, если не хватает места. */
      flip?: boolean;
      /** Сдвигает всплывающее окно, чтобы оно не выходило за пределы экрана. */
      shift?: boolean;
      /** Опции для всплывающего окна. */
      popperOptions?: IPopoverOptions;
      /** Кол-во дней, которые можно выбрать в диапазоне */
      maxDaysRange?: string | number;
    }
  >(),
  {
    size: "m",
    description: "",
    label: "",
    locale: "ru",
    teleportTo: "main",
    yearRange: 50,
    maxYear: 0,
    disabledDates: () => [],
    disabledHours: () => [],
    minuteStep: 1,
    bottomSheetCustomClass: "",
    customClass: "",
    clearable: true,
    position: "bottom-left",
    flip: true,
    maxDaysRange: 0
  }
);

const emit = defineEmits<{
  /** Событие вызывается при изменении `modelValue`. */
  (e: "update:modelValue", value?: [Date | undefined, Date | undefined]): void;
  /** Событие вызывается при открытии `TNDatepicker`. */
  (e: "open"): void;
  /** Событие вызывается при закрытии `TNDatepicker`. */
  (e: "close"): void;
}>();

defineSlots<TNFormItemSlots>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(mobileBreakPoint ?? 0);

const isOpen = ref<boolean>(false);

const selectedMonth = ref<number>(new Date().getMonth());
const selectedYear = ref<number>(new Date().getFullYear());
const hoverDate = ref<Date | null>(null);
const isSelectorOpened = ref<boolean>(false);

onUnmounted(() => {
  window.removeEventListener("scroll", closePicker);
});

const prettifyNumber = (number: number): string => {
  return number < 10 ? "0" + number : String(number);
};

const formatDate = (date?: Date): string => {
  if (!date) {
    return "<span class='tn-datepicker__placeholder'>__.__.____</span>";
  }

  const month = prettifyNumber(date.getMonth() + 1);
  const day = prettifyNumber(date.getDate());
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

const valueLayout = computed<string>(() => {
  const dateFrom = props.modelValue?.[0];
  const dateTo = props.modelValue?.[1];

  return `${formatDate(dateFrom)} <span class="tn-datepicker__placeholder">–</span> ${formatDate(dateTo)}`;
});

const selectedAdditionalMonth = computed<number>(() => {
  return selectedMonth.value === 11 ? 0 : selectedMonth.value + 1;
});

const selectedAdditionalYear = computed<number>(() => {
  return selectedMonth.value === 11 ? selectedYear.value + 1 : selectedYear.value;
});

const doneButtonLabel = computed<string>(() => props.customLocale?.doneButtonLabel ?? (props.locale === "ru" ? "Выбрать" : "Pick"));

const openPicker = () => {
  if (props.disabled) return;

  if (props.modelValue && props.modelValue[0]) {
    const startDate = props.modelValue[0];
    selectedMonth.value = startDate?.getMonth();
    selectedYear.value = startDate?.getFullYear();
  }

  emit("open");
  isOpen.value = true;
};

const closePicker = () => {
  if (isOpen.value || (props.hideInput && props.showPicker)) {
    emit("close");
    isOpen.value = false;
  }
};

const clearValue = () => {
  emit("update:modelValue");
  closePicker();
};

const selectYear = (year: number) => {
  selectedYear.value = year;
};

const selectMonth = (index: number) => {
  selectedMonth.value = index;
};

const selectDay = (day: IDay) => {
  const dayDate = new Date(day.year, day.month, day.day, 0, 0);
  const [dateFrom, dateTo] = props.modelValue ?? [];

  if (!dateFrom || dateTo) {
    emit("update:modelValue", [dayDate, undefined]);
    return;
  }

  if (!isMobile.value && !props.confirm) {
    closePicker();
  }

  const nextValue: [Date | undefined, Date | undefined] = dayDate.getTime() < dateFrom.getTime() ? [dayDate, dateFrom] : [dateFrom, dayDate];

  emit("update:modelValue", nextValue);
};

const previousMonth = () => {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
};

const nextMonth = () => {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
};

const updateHoverDate = (day?: IDay) => {
  hoverDate.value = day ? new Date(day.year, day.month, day.day) : null;
};

const selectorOpen = () => {
  isSelectorOpened.value = true;
};

const selectorClose = () => {
  isSelectorOpened.value = false;
};
</script>

<style src="./datepicker.css" />
