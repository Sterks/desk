<template>
  <div ref="root" class="tn-calendar" :class="{ 'tn-calendar_bottom-sheet': bottomSheet }">
    <div class="tn-calendar__header">
      <div v-if="range && additional" class="tn-calendar__button-placeholder"></div>
      <TNButton
        v-else
        class="tn-calendar__month-button tn-calendar__month-button_previous"
        type="white"
        icon="left-m"
        size="lg"
        :disabled="isPreviousMonthDisabled"
        @click="previousMonth"
      />
      <div class="tn-calendar__header-selector-container">
        <div class="tn-calendar__selector-container">
          <TNButton
            class="tn-calendar__selector-button"
            type="white"
            :class="{
              'tn-calendar__selector-button_open': isMonthSelectorOpen
            }"
            @click="openMonthSelector"
          >
            <span class="tn-calendar__selector-text">{{ selectedMonthLabel }}</span>
            <TNIcon size="20" class="tn-calendar__selector-icon" name="down-s-light" />
          </TNButton>
          <TransitionCollapse>
            <div v-if="isMonthSelectorOpen" v-click-outside="closeMonthSelector" class="tn-calendar__select-container">
              <ul class="tn-calendar__option-list tn-calendar__option-list_month">
                <li
                  v-for="(month, index) in locale.monthLabelList"
                  :key="index"
                  class="tn-calendar__option-item"
                  :class="{
                    'tn-calendar__option-item_selected': selectedMonth === index
                  }"
                  @click="selectMonth(index)"
                >
                  <p class="tn-calendar__option-text">{{ month }}</p>
                </li>
              </ul>
            </div>
          </TransitionCollapse>
        </div>
        <div class="tn-calendar__selector-container">
          <TNButton
            class="tn-calendar__selector-button"
            type="white"
            :class="{
              'tn-calendar__selector-button_open': isYearSelectorOpen
            }"
            @click="openYearSelector"
          >
            <span class="tn-calendar__selector-text">{{ selectedYear }}</span>
            <TNIcon size="20" class="tn-calendar__selector-icon" name="down-s-light" />
          </TNButton>
          <TransitionCollapse>
            <div v-if="isYearSelectorOpen" v-click-outside="closeYearSelector" class="tn-calendar__select-container">
              <ul class="tn-calendar__option-list tn-calendar__option-list_year">
                <li
                  v-for="year in yearList"
                  :key="year"
                  class="tn-calendar__option-item"
                  :class="{
                    'tn-calendar__option-item_selected': selectedYear === year
                  }"
                  @click="selectYear(year)"
                >
                  <p class="tn-calendar__option-text">{{ year }}</p>
                </li>
              </ul>
            </div>
          </TransitionCollapse>
        </div>
      </div>
      <div v-if="range && !additional && !singleModeRange" class="tn-calendar__button-placeholder"></div>
      <TNButton
        v-else
        class="tn-calendar__month-button tn-calendar__month-button_next"
        type="white"
        icon="right-m"
        size="lg"
        :disabled="isNextMonthDisabled"
        @click="nextMonth"
      />
    </div>
    <div class="tn-calendar__table">
      <div class="tn-calendar__table-header">
        <div class="tn-calendar__table-header-row tn-calendar__table-row">
          <template v-for="day in locale.shortWeekdayLabels" :key="day">
            <div class="tn-calendar__table-header-cell tn-calendar__table-cell">
              {{ day }}
            </div>
          </template>
        </div>
      </div>
      <div class="tn-calendar__table-body">
        <div v-for="(rowItem, index) in rowArray" :key="index" class="tn-calendar__table-row">
          <div
            v-for="cellItem in rowItem"
            :key="`${cellItem.day}-${cellItem.month}-${cellItem.year}`"
            class="tn-calendar__table-cell"
            :class="[
              {
                'tn-calendar__table-cell_today': isToday(cellItem),
                'tn-calendar__table-cell_disabled': isDisabled(cellItem),
                'tn-calendar__table-cell_between': isBetweenSelected(cellItem),
                'tn-calendar__table-cell_between-hover': isBetweenHover(cellItem),
                'tn-calendar__table-cell_other-month': cellItem.month !== selectedMonth,
                'tn-calendar__table-cell_first-of-month': cellItem.day === 1,
                'tn-calendar__table-cell_last-of-month': isLastOfMonth(cellItem)
              },
              ...isExactHover(cellItem),
              ...isSelected(cellItem)
            ]"
            @mouseenter.self="cellHoverHandler(cellItem)"
            @mouseleave.self="cellBlurHandler"
            @click="cellClickHandler(cellItem)"
          >
            <button v-if="cellItem" class="tn-calendar__table-button">
              {{ cellItem.day }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="time" class="tn-calendar__footer-selector-container">
      <div class="tn-calendar__selector-container">
        <TNButton
          class="tn-calendar__selector-button tn-calendar__selector-button_time"
          type="white"
          size="md"
          :class="{
            'tn-calendar__selector-button_open': isHoursSelectorOpen
          }"
          @click="openHoursSelector"
        >
          <span class="tn-calendar__selector-text">{{ prettifyNumber(selectedHour) }}</span>
          <TNIcon class="tn-calendar__selector-icon" size="20" name="down-m-light" />
        </TNButton>
        <TransitionCollapse>
          <div v-if="isHoursSelectorOpen" v-click-outside="closeHoursSelector" class="tn-calendar__select-container tn-calendar__select-container_bottom">
            <ul class="tn-calendar__option-list tn-calendar__option-list_hour">
              <li
                v-for="hour in 24"
                :key="hour"
                class="tn-calendar__option-item"
                :class="{
                  'tn-calendar__option-item_selected': selectedHour === hour - 1,
                  'tn-calendar__option-item_disabled': isHourDisabled(hour - 1)
                }"
                @click="selectHour(hour - 1)"
              >
                <p class="tn-calendar__option-text">
                  {{ prettifyNumber(hour - 1) }}
                </p>
              </li>
            </ul>
          </div>
        </TransitionCollapse>
      </div>
      <div class="tn-calendar__selector-container">
        <TNButton
          class="tn-calendar__selector-button tn-calendar__selector-button_time"
          type="white"
          size="md"
          :class="{
            'tn-calendar__selector-button_open': isMinutesSelectorOpen
          }"
          @click="openMinuteSelector"
        >
          <span class="tn-calendar__selector-text">{{ prettifyNumber(selectedMinute) }}</span>
          <TNIcon class="tn-calendar__selector-icon" size="20" name="down-m-light" />
        </TNButton>
        <TransitionCollapse>
          <div v-if="isMinutesSelectorOpen" v-click-outside="closeMinuteSelector" class="tn-calendar__select-container tn-calendar__select-container_bottom">
            <ul class="tn-calendar__option-list tn-calendar__option-list_minute">
              <li
                v-for="minute in minuteList"
                :key="minute"
                class="tn-calendar__option-item"
                :class="{
                  'tn-calendar__option-item_selected': selectedMinute === minute,
                  'tn-calendar__option-item_disabled': isMinuteDisabled(minute)
                }"
                @click="selectMinute(minute)"
              >
                <p class="tn-calendar__option-text">
                  {{ prettifyNumber(minute) }}
                </p>
              </li>
            </ul>
          </div>
        </TransitionCollapse>
      </div>
      <TNButton v-if="confirm" type="default" size="md" class="tn-calendar__footer-button" @click="footerButtonClickHandler">
        {{ locale.doneButtonLabel }}
      </TNButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from "vue";
import TransitionCollapse from "../../../transitions/transition-collapse.vue";
import TNButton from "../../../button/button.vue";
import TNIcon from "../../../icons/icon.vue";
import { getMinuteList, getYearList, isMinuteDisabled as checkMinuteDisabled, type IMinuteAvailabilityOptions } from "../../helpers";
import type { IDisableDates, IDatepickerLocateConfig, IDay } from "../../datepicker.types";
import { vClickOutside } from "../../../../directives/click-outside";

type Calendar = Array<Array<IDay>>;

const DEFAULT_LOCALES: Record<"ru" | "en", Required<IDatepickerLocateConfig>> = {
  ru: {
    doneButtonLabel: "Выбрать",
    monthLabelList: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    shortWeekdayLabels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
  },
  en: {
    doneButtonLabel: "Pick",
    monthLabelList: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortWeekdayLabels: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
  }
};

defineOptions({
  name: "TNCalendar"
});

const props = withDefaults(
  defineProps<{
    range?: boolean;
    value?: Date | [Date | undefined, Date | undefined];
    time?: boolean;
    additional?: boolean;
    yearRange?: number;
    maxYear?: string | number;
    disabledDates?: Date[] | IDisableDates;
    locale?: "ru" | "en";
    customLocale?: IDatepickerLocateConfig;
    selectedMonth: number;
    selectedYear: number;
    selectedHour?: number;
    selectedMinute?: number;
    hoverDate?: Date | null;
    singleModeRange?: boolean;
    bottomSheet?: boolean;
    disabledHours?: number[];
    disabledMinutes?: number[];
    minuteStep?: number;
    maxDaysRange?: number;
    confirm?: boolean;
  }>(),
  {
    range: false,
    time: false,
    additional: false,
    yearRange: 50,
    maxYear: 0,
    disabledDates: () => [],
    locale: "ru",
    hoverDate: null,
    singleModeRange: false,
    bottomSheet: false,
    disabledHours: () => [],
    disabledMinutes: () => [],
    minuteStep: 1,
    confirm: false
  }
);

const emit = defineEmits<{
  (e: "selectDay", day: IDay): void;
  (e: "selectMonth", month: number): void;
  (e: "selectYear", year: number): void;
  (e: "selectHour", hour: number): void;
  (e: "selectMinute", minute: number): void;
  (e: "previousMonth"): void;
  (e: "nextMonth"): void;
  (e: "updateHoverDate", date?: IDay): void;
  (e: "close"): void;
  (e: "selectorOpen"): void;
  (e: "selectorClose"): void;
}>();

const isMonthSelectorOpen = ref<boolean>(false);
const isYearSelectorOpen = ref<boolean>(false);
const isHoursSelectorOpen = ref<boolean>(false);
const isMinutesSelectorOpen = ref<boolean>(false);
const yearList = ref<number[]>(getYearList(props.yearRange, Number(props.maxYear) || 0));
const root = ref<HTMLElement | null>(null);

const rowArray = computed<Calendar>(() => {
  const rows: Calendar = [];
  const startDate = new Date(props.selectedYear, props.selectedMonth, 1);
  let rowNumber = 0;

  for (let day = 1; startDate.getMonth() === props.selectedMonth; startDate.setDate(startDate.getDate() + 1) && day++) {
    if (!rows[rowNumber]) {
      rows[rowNumber] = [];
    }
    if (rows.length < rowNumber + 1) {
      rows[rowNumber + 1] = [];
    }
    const week = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    if (day === 1 && week !== 0) {
      for (let w = 0; w > -6; w--) {
        const firstDay = new Date(startDate);
        firstDay.setDate(w);
        const prevWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        rows[0][prevWeek] = {
          day: firstDay.getDate(),
          month: firstDay.getMonth(),
          year: firstDay.getFullYear()
        };
      }
    }
    rows[rowNumber][week] = {
      day,
      month: startDate.getMonth(),
      year: startDate.getFullYear()
    };
    const dateCopy = new Date(startDate);
    dateCopy.setDate(dateCopy.getDate() + 1);
    if (dateCopy.getMonth() !== startDate.getMonth()) {
      if (week !== 6) {
        const firstDay = new Date(startDate);
        for (let w = week + 1; w < 7; w++) {
          firstDay.setDate(firstDay.getDate() + 1);
          rows[rowNumber][w] = {
            day: firstDay.getDate(),
            month: firstDay.getMonth(),
            year: firstDay.getFullYear()
          };
        }
      }
      if (rowNumber === 3) {
        rows[rowNumber + 1] = [];

        for (let w = 0; w < 7; w++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + w + 1);
          rows[rowNumber + 1][w] = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear()
          };
        }

        rows[rowNumber + 2] = [];

        for (let w = 0; w < 7; w++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + w + 8);
          rows[rowNumber + 2][w] = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear()
          };
        }
      }
      if (rowNumber === 4) {
        rows[rowNumber + 1] = [];

        for (let w = 0; w < 7; w++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + w + 1);
          rows[rowNumber + 1][w] = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear()
          };
        }
      }
    }
    if (week === 6) {
      rowNumber++;
    }
  }
  return rows;
});

const locale = computed<Required<IDatepickerLocateConfig>>(() => {
  const resolvedLocale = DEFAULT_LOCALES[props.locale];
  const monthLabelList = props.customLocale?.monthLabelList?.length
    ? resolvedLocale.monthLabelList.map((defaultLabel, i) => props.customLocale?.monthLabelList?.[i] ?? defaultLabel)
    : resolvedLocale.monthLabelList;

  const shortWeekdayLabels = props.customLocale?.shortWeekdayLabels?.length
    ? resolvedLocale.shortWeekdayLabels.map((defaultLabel, i) => props.customLocale?.shortWeekdayLabels?.[i] ?? defaultLabel)
    : resolvedLocale.shortWeekdayLabels;

  const doneButtonLabel = props.customLocale?.doneButtonLabel ?? resolvedLocale.doneButtonLabel;
  return {
    doneButtonLabel,
    monthLabelList,
    shortWeekdayLabels
  };
});

const selectedMonthLabel = computed<string>(() => {
  return locale.value.monthLabelList[props.selectedMonth];
});

const minuteList = computed<number[]>(() => getMinuteList(props.minuteStep));

// Опции без disabledMinutes — проверяют только запрет конкретного времени через disabledDates
const dateAvailabilityOptions = computed<IMinuteAvailabilityOptions>(() => ({
  minuteStep: props.minuteStep,
  date: Array.isArray(props.value) ? undefined : props.value,
  disabledDates: props.disabledDates
}));

const minuteAvailabilityOptions = computed<IMinuteAvailabilityOptions>(() => ({
  ...dateAvailabilityOptions.value,
  disabledMinutes: props.disabledMinutes
}));

const isPreviousMonthDisabled = computed<boolean>(() => {
  const limit = (Number(props.maxYear) || new Date().getFullYear()) - Number(props.yearRange);
  if (props.selectedMonth !== 0) return false;
  return props.selectedYear - 1 < limit;
});

const isNextMonthDisabled = computed<boolean>(() => {
  const limit = Number(props.maxYear) || new Date().getFullYear() + Number(props.yearRange);
  if (props.selectedMonth !== 11) return false;
  return props.selectedYear + 1 > limit;
});

const isToday = (day?: IDay): boolean => {
  return !!day && day.year === new Date().getFullYear() && day.month === new Date().getMonth() && day.day === new Date().getDate();
};

const isSelected = (day?: IDay): string[] => {
  const valueCopy = props.value as Date | null | Date[];
  if (Array.isArray(valueCopy)) {
    if (day && valueCopy[0] && valueCopy[0].getFullYear() === day.year && valueCopy[0].getMonth() === day.month && valueCopy[0].getDate() === day.day) {
      if (!valueCopy[1]) {
        return ["tn-calendar__table-cell_selected", "tn-calendar__table-cell_selected-start", "tn-calendar__table-cell_selected-only"];
      }
      return ["tn-calendar__table-cell_selected", "tn-calendar__table-cell_selected-start"];
    } else if (day && valueCopy[1] && valueCopy[1].getFullYear() === day.year && valueCopy[1].getMonth() === day.month && valueCopy[1].getDate() === day.day) {
      return ["tn-calendar__table-cell_selected", "tn-calendar__table-cell_selected-end"];
    }
  } else if (!!valueCopy && !!day && day.year === valueCopy.getFullYear() && day.month === valueCopy.getMonth() && day.day === valueCopy.getDate()) {
    return ["tn-calendar__table-cell_selected", "tn-calendar__table-cell_selected-only"];
  }
  return [];
};

const isDisabled = (day?: IDay): boolean => {
  if (!day) {
    return false;
  }
  const date = new Date(day.year, day.month, day.day);
  let disable;
  if (props.maxDaysRange && props.range && props.value && Array.isArray(props.value) && props.value[0] && !props.value[1]) {
    const msDiff = props.value[0].getTime() - date.getTime();
    const diffDate = new Date(Math.abs(msDiff));
    if (diffDate.getMonth() !== 0 || diffDate.getFullYear() !== 1970) {
      disable = true;
    }
    if (diffDate.getDate() > props.maxDaysRange) {
      disable = true;
    }
  }
  if (!disable && isFullDayDisabled(date, props.disabledDates)) {
    disable = true;
  }
  return !!disable;
};

const isBetweenSelected = (day?: IDay): boolean => {
  if (!day || !props.range || !props.value || !Array.isArray(props.value) || !props.value[0] || !props.value[1]) {
    return false;
  }
  const date = new Date(day.year, day.month, day.day).getTime();
  const from = props.value[0].getTime();
  const to = props.value[1].getTime();
  return from <= date && to >= date;
};

const isBetweenHover = (day?: IDay): boolean => {
  if (day && props.range && props.value && Array.isArray(props.value) && props.hoverDate && props.value[0]) {
    const date = new Date(day.year, day.month, day.day).getTime();
    const hover = props.hoverDate.getTime();
    const date0 = (props.value[0] as Date).getTime();
    if (props.value[1]) {
      return false;
    }
    if (date0 < hover) {
      return date >= date0 && date <= hover;
    } else if (date0 >= hover) {
      return date <= date0 && date >= hover;
    }
  }
  return false;
};

const isExactHover = (day?: IDay): string[] => {
  if (day && props.range && props.value && Array.isArray(props.value) && props.hoverDate && props.value[0] && !props.value[1]) {
    const valueDate: number = props.value[0].getTime();
    const date = new Date(day.year, day.month, day.day).getTime();
    const hover = props.hoverDate.getTime();
    const classList: string[] = [];
    if (date === hover) {
      classList.push("tn-calendar__table-cell_exact-hover");
      classList.push(hover < valueDate ? "tn-calendar__table-cell_start-hover" : "tn-calendar__table-cell_end-hover");
    } else if (date === valueDate) {
      classList.push(date < valueDate ? "tn-calendar__table-cell_start-hover" : "tn-calendar__table-cell_end-hover");
    }
    return classList;
  }
  return [];
};

const isLastOfMonth = (day: IDay): boolean => {
  const date = new Date(day.year, day.month, day.day);
  const nextDate = new Date(day.year, day.month, day.day + 1);
  return date.getMonth() !== nextDate.getMonth();
};

const cellClickHandler = (day?: IDay) => {
  if (day) {
    emit("selectDay", day);
  }
};

const previousMonth = () => {
  emit("previousMonth");
};

const nextMonth = () => {
  emit("nextMonth");
};

const openMonthSelector = () => {
  isMonthSelectorOpen.value = true;
  emit("selectorOpen");
  scrollIntoView();
};

const closeMonthSelector = () => {
  emit("selectorClose");
  isMonthSelectorOpen.value = false;
};

const openYearSelector = () => {
  isYearSelectorOpen.value = true;
  emit("selectorOpen");
  scrollIntoView("year");
};

const closeYearSelector = () => {
  emit("selectorClose");
  isYearSelectorOpen.value = false;
};

const openHoursSelector = () => {
  isHoursSelectorOpen.value = true;
  emit("selectorOpen");
  scrollIntoView("hour");
};

const closeHoursSelector = () => {
  emit("selectorClose");
  isHoursSelectorOpen.value = false;
};

const openMinuteSelector = () => {
  isMinutesSelectorOpen.value = true;
  emit("selectorOpen");
  scrollIntoView("minute");
};

const closeMinuteSelector = () => {
  emit("selectorClose");
  isMinutesSelectorOpen.value = false;
};

const selectMonth = (index: number) => {
  if (props.additional) {
    index--;
    if (index === -1) {
      index = 11;
      emit("selectYear", props.selectedYear - 1);
    }
  }
  emit("selectMonth", index);
  closeMonthSelector();
};

const selectYear = (year: number) => {
  emit("selectYear", year);
  closeYearSelector();
};

const selectHour = (hour: number) => {
  emit("selectHour", hour);
  closeHoursSelector();
};

const selectMinute = (minute: number) => {
  emit("selectMinute", minute);
  closeMinuteSelector();
};

const scrollIntoView = async (type: string = "month") => {
  await nextTick();
  const container = root.value?.querySelector(".tn-calendar__option-list_" + type);
  const elem = container?.querySelector(".tn-calendar__option-item_selected") as HTMLElement;
  if (elem && container) {
    container.scrollTop = elem.offsetTop - container.clientHeight / 2 + 16;
  }
};

const footerButtonClickHandler = () => {
  emit("close");
};

const cellHoverHandler = (day?: IDay) => {
  emit("updateHoverDate", day);
};

const cellBlurHandler = () => {
  emit("updateHoverDate");
};

const prettifyNumber = (number?: number): string => {
  if (number === undefined || number === null) return "";

  return number < 10 ? "0" + number : String(number);
};

const isHourDisabled = (hour: number): boolean => {
  if (props.disabledHours.includes(hour)) {
    return true;
  }
  // Час недоступен, если в нем не осталось ни одной разрешенной минуты
  if (minuteList.value.every(minute => props.disabledMinutes.includes(minute))) {
    return true;
  }
  return checkMinuteDisabled(props.selectedMinute ?? 0, hour, dateAvailabilityOptions.value);
};

const isFullDayDisabled = (date: Date, disabledDates: IDisableDates | Date[]): boolean => {
  let disable = false;
  if (!props.time) {
    if (Array.isArray(disabledDates)) {
      if (disabledDates.some(d => d.getTime() === date.getTime())) {
        disable = true;
      }
    } else {
      if (disabledDates(date)) {
        disable = true;
      }
    }
  } else {
    disable = true;
    const tempDate = new Date(date);
    tempDate.setHours(props.selectedHour ?? 0);
    tempDate.setMinutes(props.selectedMinute ?? 0);
    if (Array.isArray(disabledDates)) {
      if (!disabledDates.some(d => d.getTime() === tempDate.getTime())) {
        disable = false;
      }
    } else {
      if (!disabledDates(tempDate)) {
        disable = false;
      }
    }
  }

  return disable;
};

const isMinuteDisabled = (minute: number, hour: number = props.selectedHour ?? 0): boolean => {
  return checkMinuteDisabled(minute, hour, minuteAvailabilityOptions.value);
};
</script>

<style lang="css">
.tn-calendar {
  width: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
  user-select: none;
}

.tn-calendar__header {
  display: flex;
  width: 100%;
  padding: 0 6px;
  justify-content: space-between;
  align-items: center;
}

.tn-calendar__month-button {
  padding: 10px !important;
  width: 38px !important;
  height: 38px !important;
}

.tn-calendar__header-selector-container {
  display: flex;
}

.tn-calendar__button-placeholder {
  flex-basis: 38px;
}

.tn-calendar__selector-container {
  position: relative;
}

.tn-calendar__selector-container ~ .tn-calendar__selector-container {
  margin-left: 24px;
}

.tn-calendar__footer-selector-container .tn-calendar__selector-container ~ .tn-calendar__selector-container {
  margin-left: 16px;
}

.tn-calendar__selector-button {
  padding: 6px 6px 6px 12px;
}

.tn-calendar__selector-button_time {
  border: 1px solid var(--border-secondary-enabled);
  border-radius: 10px;
  font-weight: var(--font-weight-text);
  line-height: var(--font-lineHeight-body-medium);
  padding: 12px 16px;
  height: 48px;
  width: 100%;
}

.tn-calendar__selector-button_time .tn-button__text {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tn-calendar__selector-button_time:hover,
.tn-calendar__selector-button_time.tn-calendar__selector-button_open {
  background-color: var(--background-primary-a-enabled);
  border-color: var(--content-primary-a-disabled);
}

.tn-calendar__selector-button_open {
  background-color: var(--background-primary-a-pressed);
  border-color: var(--background-primary-a-pressed);
}

.tn-calendar__selector-icon {
  color: var(--content-tertiary-enabled);
  margin-left: 8px;
  transform-origin: center;
  transition: transform 0.3s ease;
}

.tn-calendar__selector-button_open .tn-calendar__selector-icon {
  transform: rotate(180deg);
}

.tn-calendar__select-container {
  border: 1px solid var(--content-primary-b-enabled);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(100% + 4px);
  max-height: 176px;
  overflow: hidden;
  border-radius: 12px;
  background-color: var(--background-primary-a-enabled);
  box-shadow: var(--shadow-small);
  z-index: 11;
}

.tn-calendar__select-container_bottom {
  top: unset;
  bottom: calc(100% + 4px);
  box-shadow: var(--shadow-small);
  left: 0;
  right: 0;
  transform: none;
}

.tn-calendar__option-list {
  padding: 8px 0;
  max-height: 176px;
  overflow: hidden auto;
  margin: 0;
}

.tn-calendar__option-list::-webkit-scrollbar {
  width: 12px;
}

.tn-calendar__option-list::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 24px;
  background-color: var(--border-secondary-pressed);
}

.tn-calendar__option-item {
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.1s linear;
  background-position: right center;
  white-space: nowrap;
  background-repeat: no-repeat;
  display: inline-block;
  width: 100%;
}

.tn-calendar__select-container_bottom .tn-calendar__option-item {
  padding-left: 15px;
}

.tn-calendar__option-item:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-calendar_bottom-sheet .tn-calendar__option-item:hover {
  background-color: unset;
}

.tn-calendar__option-item:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-calendar__option-item_selected {
  color: var(--content-accent-enabled);
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29304 12.2929C3.68357 11.9024 4.31673 11.9024 4.70726 12.2929L9.19079 16.7764L18.865 7.10226C19.2555 6.71173 19.8886 6.71173 20.2792 7.10226C20.6697 7.49278 20.6697 8.12595 20.2792 8.51647L9.89789 18.8977C9.50737 19.2883 8.8742 19.2883 8.48368 18.8977L3.29304 13.7071C2.90252 13.3166 2.90252 12.6834 3.29304 12.2929Z' fill='%23E11B11'/%3E%3C/svg%3E%0A");
}

.tn-calendar__option-item_selected .tn-calendar__option-text {
  padding-right: 32px;
}

.tn-calendar__option-item_disabled {
  pointer-events: none;
  color: var(--content-primary-a-disabled);
}

.tn-calendar__footer-selector-container {
  margin: 16px -16px -4px;
  padding: 12px 16px 0;
  display: flex;
  width: 100%;
  border-top: 1px solid var(--border-secondary-enabled);
}

.tn-calendar__selector-container {
  flex: 1 0;
}

.tn-calendar__footer-button {
  margin-left: 14px;
  height: 48px;
  padding: 12px;
  flex: 0 0;
  overflow: visible;
}

.tn-calendar__table {
  margin-top: 12px;
}

.tn-calendar_bottom-sheet .tn-calendar__table {
  width: 100%;
  padding: 0 16px;
}

.tn-calendar__table-cell {
  width: 38px;
  height: 38px;
  text-align: center;
  padding: 0;
  transition-property: background, border-radius;
  transition-duration: 0.1s;
  transition-timing-function: linear;
  cursor: pointer;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:not(:first-child):not(:last-child) {
  flex: 1 0;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:first-child,
.tn-calendar_bottom-sheet .tn-calendar__table-cell:last-child {
  flex: 0 0 38px;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:first-child {
  padding-right: calc((100% - 38px * 7) / 12);
  flex: unset;
  width: unset;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:last-child {
  padding-left: calc((100% - 38px * 7) / 12);
  flex: unset;
  width: unset;
}

.tn-calendar_bottom-sheet .tn-calendar__table-header-cell:first-child,
.tn-calendar_bottom-sheet .tn-calendar__table-header-cell:last-child {
  flex: 0 0 calc(38px + (100% - 38px * 7) / 12);
}

.tn-calendar__table-header-cell {
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-small);
  line-height: 26px;
  height: 26px;
  color: var(--content-tertiary-enabled);
  cursor: default;
  padding: 0;
}

.tn-calendar__table-cell_today .tn-calendar__table-button::after {
  content: "";
  display: block;
  position: absolute;
  bottom: 7px;
  left: 50%;
  width: 12px;
  height: 2px;
  border-radius: 2px;
  background-color: var(--background-accent-enabled);
  transform: translateX(-50%);
}

.tn-calendar__table-cell_selected .tn-calendar__table-button {
  background-color: var(--background-accent-enabled);
  color: var(--content-primary-b-enabled);
}

.tn-calendar__table-cell_selected.tn-calendar__table-cell_today .tn-calendar__table-button::after {
  background-color: var(--background-primary-a-enabled);
}

.tn-calendar__table-cell_other-month {
  cursor: default;
  color: transparent;
  pointer-events: none;
  transition: none;
  opacity: 0;
}

.tn-calendar__table-cell_disabled {
  pointer-events: none;
  color: var(--content-secondary-disabled);
}

.tn-calendar__table-row {
  display: flex;
}

.tn-calendar__table-row:not(:last-child) {
  margin-bottom: 6px;
}

.tn-calendar__table-cell_between {
  background-color: var(--background-secondary-a-enabled);
}
.tn-calendar__table-cell_between-hover {
  background-color: var(--background-secondary-a-hover);
}

.tn-calendar__table-button {
  width: 38px;
  height: 38px;
  border: none;
  transition-property: background-color, color;
  transition-duration: 0.1s;
  transition-timing-function: linear;
  border-radius: 8px;
  background-color: transparent;
  color: inherit;
  cursor: inherit;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  padding: 0;
  position: relative;
}

.tn-calendar__table-cell:hover .tn-calendar__table-button {
  background-color: var(--background-secondary-a-hover);
}

.tn-calendar__table-cell:active .tn-calendar__table-button {
  background-color: var(--background-secondary-a-pressed);
}

.tn-calendar__table-cell_selected:hover .tn-calendar__table-button {
  background-color: var(--background-accent-hover);
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:hover .tn-calendar__table-button,
.tn-calendar_bottom-sheet .tn-calendar__table-cell:active .tn-calendar__table-button {
  background-color: inherit;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell_selected:hover .tn-calendar__table-button,
.tn-calendar_bottom-sheet .tn-calendar__table-cell_selected:active .tn-calendar__table-button {
  background-color: var(--content-accent-enabled);
}

.tn-calendar__table-cell_between-hover + .tn-calendar__table-cell_exact-hover:not(.tn-calendar__table-cell_between),
.tn-calendar__table-cell_between + .tn-calendar__table-cell_exact-hover:not(.tn-calendar__table-cell_between),
.tn-calendar__table-cell_between-hover + .tn-calendar__table-cell_selected,
.tn-calendar__table-cell_between + .tn-calendar__table-cell_selected,
.tn-calendar__table-cell:last-child,
.tn-calendar__table-cell_last-of-month {
  border-radius: 0 8px 8px 0 !important;
}

.tn-calendar__table-cell:not(.tn-calendar__table-cell_between):not(.tn-calendar__table-cell_between-hover) + .tn-calendar__table-cell_selected,
.tn-calendar__table-cell:not(.tn-calendar__table-cell_between):not(.tn-calendar__table-cell_between-hover) + .tn-calendar__table-cell_exact-hover,
.tn-calendar__table-cell:first-child,
.tn-calendar__table-cell_first-of-month {
  border-radius: 8px 0 0 8px !important;
}

.tn-calendar__table-cell:not(.tn-calendar__table-cell_between-hover) + .tn-calendar__table-cell_between-hover:last-child,
.tn-calendar__table-cell_exact-hover:not(.tn-calendar__table-cell_start-hover):first-child,
.tn-calendar__table-cell_between:only-child,
.tn-calendar__table-cell_between-hover:only-child,
.tn-calendar__table-cell:not(.tn-calendar__table-cell_between):not(.tn-calendar__table-cell_between-hover) + .tn-calendar__table-cell_selected-start:last-child,
.tn-calendar__table-cell_end-hover:first-child,
.tn-calendar__table-cell_selected-end:first-child,
.tn-calendar__table-cell.tn-calendar__table-cell_between-hover.tn-calendar__table-cell_exact-hover.tn-calendar__table-cell_end-hover.tn-calendar__table-cell_selected.tn-calendar__table-cell_selected-start.tn-calendar__table-cell_selected-only,
.tn-calendar__table-cell.tn-calendar__table-cell_between.tn-calendar__table-cell_selected.tn-calendar__table-cell_selected-start.tn-calendar__table-cell_selected-only {
  border-radius: 8px !important;
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:not(.tn-calendar__table-cell_between) + .tn-calendar__table-cell_selected:not(:last-child),
.tn-calendar_bottom-sheet .tn-calendar__table-cell_selected:first-child {
  background-color: transparent;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    transparent 50%,
    var(--background-secondary-a-enabled) 50%,
    var(--background-secondary-a-enabled) 100%
  );
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell_between + .tn-calendar__table-cell_selected,
.tn-calendar__table-cell_selected-end {
  background-color: transparent;
  background-image: linear-gradient(
    90deg,
    var(--background-secondary-a-enabled) 0%,
    var(--background-secondary-a-enabled) 50%,
    transparent 50%,
    transparent 100%
  );
}

.tn-calendar_bottom-sheet .tn-calendar__table-cell:not(.tn-calendar__table-cell_between) + .tn-calendar__table-cell_selected:last-child,
.tn-calendar__table-cell_selected-end:first-child,
.tn-calendar_bottom-sheet .tn-calendar__table-cell_selected-only {
  background-color: transparent !important;
  background-image: none !important;
}

.tn-dark-theme {
  .tn-calendar__select-container {
    border: none;
  }
}
</style>
