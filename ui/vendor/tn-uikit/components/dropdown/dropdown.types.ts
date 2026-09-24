import type { IconNames } from "../icons/icon-names";

// Элемент выпадающего меню
export interface ITNDropdownMenu<TId extends string | number = string> {
  // Название
  title: string;
  // Подпись
  subtitle?: string;
  // Список вложенных элементов
  childList?: ITNDropdownMenu<TId>[];
  // Состояние блокировки
  disabled?: boolean;
  // Идентификатор
  id: TId;
  // Иконка
  icon?: IconNames;
  // Отображение акцентным цветом
  accent?: boolean;
  // Отображение изображения
  userPicture?: {
    text?: string;
    image?: string;
    icon?: IconNames;
    square?: boolean;
    status?: "green" | "yellow" | "red" | "gray";
  };
  // Второстепенный текст в правой части
  secondaryText?: string;
  // Иконка в правой части элемента
  rightIcon?: IconNames;
}
