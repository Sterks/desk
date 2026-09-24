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
      class="tn-datepicker__popover"
      width="auto"
    >
      <template #trigger>
        <div
          ref="root"
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
            <TNButton v-if="clearable && modelValue && !disabled" class="tn-datepicker__inner-clear" icon="close-filled" type="link" @click.stop="clearValue" />
            <TNIcon v-else class="tn-datepicker__inner-icon" name="calendar" @click.self="openPicker" />
          </template>
        </div>
      </template>
      <template #content>
        <TransitionCollapse>
          <div v-click-outside="closePicker" class="tn-datepicker__wrapper-desktop">
            <TNCalendar
              :confirm="confirm"
              :custom-locale="customLocale"
              :disabled-dates="disabledDates"
              :disabled-hours="disabledHours"
              :disabled-minutes="disabledMinutes"
              :hover-date="hoverDate"
              :locale="locale"
              :max-days-range="0"
              :minute-step="Number(minuteStep)"
              :selected-hour="selectedHour"
              :selected-minute="selectedMinute"
              :selected-month="selectedMonth"
              :selected-year="selectedYear"
              :style="{ height: time ? '' : '366px' }"
              :time="time"
              :value="modelValue"
              :year-range="Number(yearRange)"
              :max-year="maxYear"
              class="tn-datepicker__calendar"
              @close="closePicker"
              @select-day="selectDay"
              @select-year="selectYear"
              @select-month="selectMonth"
              @select-hour="selectHour"
              @select-minute="selectMinute"
              @next-month="nextMonth"
              @previous-month="previousMonth"
              @update-hover-date="updateHoverDate"
              @update:model-value="modelValueUpdateHandler"
            />
          </div>
        </TransitionCollapse>
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
        :disabled-minutes="disabledMinutes"
        :hover-date="hoverDate"
        :locale="locale"
        :max-days-range="0"
        :minute-step="Number(minuteStep)"
        :selected-hour="selectedHour"
        :selected-minute="selectedMinute"
        :selected-month="selectedMonth"
        :selected-year="selectedYear"
        :time="time"
        :value="modelValue"
        :year-range="Number(yearRange)"
        :max-year="maxYear"
        bottom-sheet
        class="tn-datepicker__calendar"
        @close="closePicker"
        @select-day="selectDay"
        @selector-close="selectorClose"
        @selector-open="selectorOpen"
        @select-year="selectYear"
        @select-month="selectMonth"
        @select-hour="selectHour"
        @select-minute="selectMinute"
        @next-month="nextMonth"
        @previous-month="previousMonth"
        @update-hover-date="updateHoverDate"
        @update:model-value="modelValueUpdateHandler"
      />
    </TNBottomSheet>
  </TNFormItem>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from "vue";
import TransitionCollapse from "../transitions/transition-collapse.vue";
import TNCalendar from "./components/calendar/calendar.vue";
import TNButton from "../button/button.vue";
import TNBottomSheet from "../bottom-sheet/bottom-sheet.vue";
import TNIcon from "../icons/icon.vue";
import TNPopover from "../popover/popover.vue";
import type { IPopoverOptions, ITNPopoverPosition } from "../popover/popover.types";
import type { IDatepickerLocateConfig, IDay, IDisableDates } from "./datepicker.types";
import { getSelectedHour, getSelectedMinute, type IMinuteAvailabilityOptions } from "./helpers";
import { useLibraryOptions } from "../../composables/library-options";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { type TNFormItemProps, TNFormItemSlots } from "../form-item/form-item.types";
import TNFormItem from "../form-item/form-item.vue";
import { vClickOutside } from "../../directives/click-outside";

defineOptions({
  name: "TNDatepicker"
});

const props = withDefaults(
  defineProps<
    TNFormItemProps & {
      /** Размер компонента. */
      size?: "s" | "m";
      /** Отключение компонента. */
      disabled?: boolean;
      /** Значение для компонента. */
      modelValue?: Date;
      /** Выбор предустановленной локализации. */
      locale?: "ru" | "en";
      /** Ручная настройка локализации. */
      customLocale?: IDatepickerLocateConfig;
      /** Возможность ввода времени для выбора даты. */
      time?: boolean;
      /** Время по умолчанию при первом выборе даты в формате "HH:mm" (работает в режиме time). */
      defaultTime?: `${number}:${number}`;
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
      /** Запрещенные для выбора минуты. */
      disabledMinutes?: number[];
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
    disabledMinutes: () => [],
    minuteStep: 1,
    bottomSheetCustomClass: "",
    customClass: "",
    clearable: true,
    position: "bottom-left",
    flip: true
  }
);

const emit = defineEmits<{
  /** Событие вызывается при изменении `modelValue`. */
  (e: "update:modelValue", value?: Date): void;
  /** Событие вызывается при открытии `TNDatepicker`. */
  (e: "open"): void;
  /** Событие вызывается при закрытии `TNDatepicker`. */
  (e: "close"): void;
}>();

defineSlots<TNFormItemSlots>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(mobileBreakPoint ?? 0);

const isOpen = ref<boolean>(false),
  isDirty = ref<boolean>(false),
  root = ref<HTMLElement | null>(null);

const minuteOptions = computed<IMinuteAvailabilityOptions>(() => ({
  disabledMinutes: props.disabledMinutes,
  minuteStep: Number(props.minuteStep),
  date: props.modelValue,
  disabledDates: props.disabledDates
}));

const defaultTimeParts = computed<{ hour: number; minute: number } | null>(() => {
  if (!props.defaultTime) return null;
  const [hourPart, minutePart] = props.defaultTime.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const isValidHour = Number.isInteger(hour) && hour >= 0 && hour < 24;
  const isValidMinute = Number.isInteger(minute) && minute >= 0 && minute < 60;
  return isValidHour && isValidMinute ? { hour, minute } : null;
});

const selectedMonth = ref<number>(new Date().getMonth());
const selectedYear = ref<number>(new Date().getFullYear());
const selectedHour = ref<number>(getSelectedHour(props.disabledHours, defaultTimeParts.value?.hour));
const selectedMinute = ref<number>(getSelectedMinute(selectedHour.value, minuteOptions.value, defaultTimeParts.value?.minute));
const hoverDate = ref<Date | null>(null);
const isSelectorOpened = ref<boolean>(false);

onUnmounted(() => {
  window.removeEventListener("scroll", closePicker);
});

const valueLayout = computed<string>(() => {
  const placeholderTemplate = `<span class="tn-datepicker__placeholder">__.__.____${props.time ? " __:__" : ""}</span>`;
  const value = props.modelValue as Date | null;
  if (value) {
    const month = prettifyNumber(value.getMonth() + 1);
    const day = prettifyNumber(value.getDate());
    const year = prettifyNumber(value.getFullYear());
    let time = "";
    if (props.time) {
      const hours = prettifyNumber(value.getHours());
      const minutes = prettifyNumber(value.getMinutes());
      time = ` ${hours}:${minutes}`;
    }
    return `${day}.${month}.${year}${time}`;
  }
  return `<span class="tn-datepicker__placeholder">${placeholderTemplate}</span>`;
});

const openPicker = () => {
  if (props.disabled) return;

  if (props.modelValue) {
    selectedMonth.value = props.modelValue.getMonth();
    selectedYear.value = props.modelValue.getFullYear();
    if (props.time) {
      selectedHour.value = props.modelValue.getHours();
      selectedMinute.value = props.modelValue.getMinutes();
    }
  } else if (props.time && defaultTimeParts.value) {
    resetTimeToDefault();
  }

  emit("open");
  isOpen.value = true;
};

const closePicker = () => {
  if (isOpen.value || (props.hideInput && props.showPicker)) {
    emit("close");
    isOpen.value = false;
    isDirty.value = false;
  }
};

const modelValueUpdateHandler = (event: Date) => {
  emit("update:modelValue", event);
  if (!props.time) return;
  closePicker();
};

const resetTimeToDefault = () => {
  selectedHour.value = getSelectedHour(props.disabledHours, defaultTimeParts.value?.hour);
  selectedMinute.value = getSelectedMinute(selectedHour.value, minuteOptions.value, defaultTimeParts.value?.minute);
};

const clearValue = () => {
  emit("update:modelValue");
  resetTimeToDefault();
  if (!props.time) return;
  closePicker();
};

const emitTimeUpdate = () => {
  const value = props.modelValue as Date;
  if (!value) return;
  emit(
    "update:modelValue",
    new Date(value.getFullYear(), value.getMonth(), value.getDate(), props.time ? selectedHour.value : 0, props.time ? selectedMinute.value : 0)
  );
};

const selectHour = (hour: number) => {
  selectedHour.value = hour;
  // В новом часе выбранная минута может оказаться запрещенной — сдвигаем на ближайшую доступную
  selectedMinute.value = getSelectedMinute(hour, minuteOptions.value, selectedMinute.value);
  emitTimeUpdate();
};

const selectYear = (year: number) => {
  selectedYear.value = year;
};

const selectMonth = (index: number) => {
  selectedMonth.value = index;
};

const selectMinute = (minute: number) => {
  selectedMinute.value = minute;
  emitTimeUpdate();
};

const selectDay = (day: IDay) => {
  const dayDate = new Date(day.year, day.month, day.day, props.time ? selectedHour.value : 0, props.time ? selectedMinute.value : 0);
  if (!props.time && !props.confirm) {
    closePicker();
  }
  emit("update:modelValue", dayDate);
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

const prettifyNumber = (number: number): string => {
  return number < 10 ? "0" + number : String(number);
};

const selectorOpen = () => {
  isSelectorOpened.value = true;
};

const selectorClose = () => {
  isSelectorOpened.value = false;
};
</script>

<style src="./datepicker.css" />
