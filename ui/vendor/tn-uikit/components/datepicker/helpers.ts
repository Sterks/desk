import type { IDisableDates } from "./datepicker.types";

// Параметры для расчета доступности минут
export interface IMinuteAvailabilityOptions {
  // Запрещенные для выбора минуты
  disabledMinutes?: number[];
  // Шаг минут
  minuteStep?: number;
  // Выбранная дата, нужна для проверки конкретного времени в disabledDates
  date?: Date;
  // Запрещенные для выбора даты
  disabledDates?: Date[] | IDisableDates;
}

export const getYearList = (count: number = 100, maxYear: number): number[] => {
  const arr: number[] = [];
  const currentYear = new Date().getFullYear();
  const lastYear = maxYear || currentYear + count;
  const firstYear = (maxYear || currentYear) - count;
  for (let i = firstYear; i <= lastYear; i++) {
    arr.push(i);
  }
  return arr;
};

export const getMinuteList = (minuteStep: number = 1): number[] => {
  const step = Math.trunc(minuteStep) > 0 ? Math.trunc(minuteStep) : 1;
  const minuteList: number[] = [];
  for (let minute = 0; minute < 60; minute += step) {
    minuteList.push(minute);
  }
  return minuteList;
};

export const isMinuteDisabled = (minute: number, hour: number, options: IMinuteAvailabilityOptions = {}): boolean => {
  const { disabledMinutes = [], date, disabledDates } = options;

  if (disabledMinutes.includes(minute)) {
    return true;
  }

  if (!date || !disabledDates) {
    return false;
  }

  const targetDate = new Date(date);
  targetDate.setHours(hour);
  targetDate.setMinutes(minute);

  if (Array.isArray(disabledDates)) {
    return disabledDates.some(disabledDate => disabledDate.getTime() === targetDate.getTime());
  }
  return disabledDates(targetDate);
};

export const getSelectedHour = (disabledHours: number[], preferredHour?: number): number => {
  if (preferredHour !== undefined && !disabledHours.includes(preferredHour)) {
    return preferredHour;
  }
  if (disabledHours.length) {
    for (let hour = 0; hour < 24; hour++) {
      if (!disabledHours.includes(hour)) {
        return hour;
      }
    }
  }
  return 0;
};

export const getSelectedMinute = (hour: number, options: IMinuteAvailabilityOptions = {}, preferredMinute?: number): number => {
  const minuteList = getMinuteList(options.minuteStep);
  const isPreferredAvailable = preferredMinute !== undefined && minuteList.includes(preferredMinute) && !isMinuteDisabled(preferredMinute, hour, options);
  if (isPreferredAvailable) {
    return preferredMinute;
  }
  return minuteList.find(minute => !isMinuteDisabled(minute, hour, options)) ?? 0;
};
