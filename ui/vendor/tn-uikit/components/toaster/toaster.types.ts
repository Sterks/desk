import type { IconNames } from "../icons/icon-names";
import { VNode } from "vue";

/** Данные тоста **/
export interface ITNToast {
  /** Текст тоста **/
  text: string | VNode;
  /**  Тип тоста **/
  type: "info" | "warn" | "error" | "success";
  /** Длительность отображение тоста в миллисекундах **/
  duration: number;
  /** Время создания тоста **/
  creationTime: number;
  /** Коллбек при клике на тело тоста **/
  onClick?: () => void;
  /** Коллбек при окончании отображения **/
  timeOutCallback?: () => void;
  /** Текст кнопки отмены **/
  cancelButtonText?: string;
  /** Коллбек при нажатии на кнопку отмены **/
  canceledCallback?: () => void;
  /** Иконка **/
  icon?: IconNames;
}

export type ITNToastOptions = {
  bottom?: boolean;
  element?: HTMLElement;
  toast?: Omit<ITNToast, "text" | "creationTime">;
};
