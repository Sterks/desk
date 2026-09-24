import type { IconNames } from "../icons/icon-names";
import { CSSProperties } from "vue";

// Данные пункта таба
export type TNTabsOption<TValue extends string | number | boolean = string> = {
  // Идентификатор
  id: TValue;
  // Название
  name: string;
  // Второстепенный текст
  secondaryText?: string;
  // Данные иконки
  icon?: {
    // Название иконки
    name: IconNames;
    // CSS-цвет иконки
    color?: CSSProperties["color"];
  };
  // Состояние блокировки
  disabled?: boolean;
};

export type TNTabsSlotScope<TValue extends string | number | boolean> = {
  /** Опция, для которой этот слот **/
  item: TNTabsOption<TValue>;
  /**  Активность опции, для которой этот слот **/
  active: boolean;
};
