import type { IconNames } from "../icons/icon-names";
import { TNUserPicture } from "../user-picture";
/** Состояния ячейки сообщения */
export enum MessageCellStatus {
  // Стандартное
  Default,
  // Ожидание
  Waiting,
  // Отправлено
  Sent,
  // Прочитано
  Read,
  // Предупреждение
  Warning
}

/** Данные ячейки */
export interface ICellDataItem<TId extends string | number = string> {
  /** Главный текст ячейки */
  title: string;
  /** Текст описания ячейки */
  subtitle?: string;
  /** Иконка слева */
  leftIcon?: IconNames;
  /** ID ячейки */
  id: TId;
  /** Иконка справа */
  rightIcons?: IconNames[];
  /** Выравнивание иконок справа */
  rightIconsAlignment?: "top" | "center";
  /** Состояние активности чекбокса, радио-кнопки или тумблера */
  checked?: boolean;
  /** Добавляет в ячейку радио-кнопку */
  radiobutton?: boolean;
  /** Добавляет в ячейку чекбокс */
  checkbox?: boolean;
  /** Добавляет в ячейку тумблер  */
  tumbler?: boolean;
  /** Аватарка пользователя  */
  userPicture?: InstanceType<typeof TNUserPicture>["$props"];
  /** Отключение компонента */
  disabled?: boolean | string[];
  /** Включение стиля выделенной ячейки */
  enabled?: boolean;
  /** Данные для режима чата */
  chat?: {
    // Время отображаемое в верхнем правом углу компонента
    time?: Date;
    // Статус, отображаемый иконкой рядом со временем
    status?: MessageCellStatus;
    // Отображение иконки закреплённого чата
    pinned?: boolean;
    // Отображение счётчика уведомлений. Перекрывает иконку закреплённого чата
    notification?: number;
    // Тело сообщения
    body?: string;
    // Отображение иконки заглушённого чата
    muted?: boolean;
    // Отображение иконки верифицированного чата
    verified?: boolean;
  };
  /** Включение accent стиля */
  accent?: boolean;
  /** Второстепенный текст в правой части */
  secondaryText?: string;
}

export interface InputEventPayload<TId extends string | number = string> {
  /** Новое состояние чекбокса, радио-кнопки или тумблера, при клике */
  value: boolean;
  /** ID ячейки из `cellData` */
  id: TId;
}

export interface BodyClickEventPayload<TId extends string | number = string> {
  /**  Событие клика */
  event: MouseEvent;
  /** ID ячейки из `cellData` */
  id: TId;
}

export interface IconClickEventPayload<TId extends string | number = string> {
  /**  Событие клика */
  event: MouseEvent;
  /** ID ячейки из `cellData` */
  id: TId;
  /** Название иконки из списка */
  icon: IconNames;
  /** Индекс иконки в списке */
  index: number;
}
