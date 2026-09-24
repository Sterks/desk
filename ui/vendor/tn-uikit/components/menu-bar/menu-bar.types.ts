import type { IconNames } from "../icons/icon-names";

export interface ITNMenuItem<TValue extends string | number = string> {
  /** Название меню **/
  title: string;
  /** Значение пункта меню **/
  value: TValue;
  /** Иконка **/
  icon: IconNames;
  /**
   * Значок нотификации.
   * Если указать число, то будет выводиться кол-во уведомлений
   * **/
  notification?: boolean | number;
}
