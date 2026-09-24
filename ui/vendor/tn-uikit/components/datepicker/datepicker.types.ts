// Коллбек заблокированной даты
export type IDisableDates = (date: Date) => boolean;

// Конфигурация локализации пикера даты
export interface IDatepickerLocateConfig {
  // Список название месяцев
  monthLabelList?: string[];
  // Список коротких названий дней недели, начиная с понедельника
  shortWeekdayLabels?: string[];
  // Текст кнопки Выбрать
  doneButtonLabel?: string;
}

export interface IDay {
  day: number;
  month: number;
  year: number;
}
