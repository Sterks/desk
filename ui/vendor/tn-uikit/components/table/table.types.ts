import type { IconNames } from "../icons/icon-names";
import type { Component, VNode } from "vue";
import type { ITNDropdownMenu } from "../dropdown/dropdown.types";
import type { TNTreeProps } from "../tree/tree.types";

export interface IDrag {
  dragging: boolean;
  fieldName: string;
  headerAnimating: boolean;
  bodyAnimating: boolean;
  cursor: {
    initial: { top: number; left: number };
    delta: { top: number; left: number };
  };
  sort: boolean;
  style: { top: number; left: number; width: string; height: string };
}

// Именная область Таблицы
export namespace TNTable {
  // Основной интерфейс значения таблицы
  export interface ValueBase {
    // Тип данных ячейки таблицы
    type: DataType;
  }

  // Значение-TNTag
  export interface ValueTag extends ValueBase {
    // Тип данных ячейки таблицы
    type: DataType.Tag;
    // Простое значение
    value: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Иконка
    icon?: IconNames;
    // Подпись, которая будет отображаться вместо логического значения
    label?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Цвет иконки
    iconColor?: string;
    // (`DataType.Tag`) Правая иконка
    rightIcon?: IconNames;
    // (`DataType.Tag`) Цвет правой иконки
    rightIconColor?: string;
  }

  // Значение-ссылка
  export interface ValueLink extends ValueBase {
    // Тип данных ячейки таблицы
    type: DataType.Link;
    // Простое значение
    value: string;
    // Подпись, которая будет отображаться вместо логического значения
    label?: string;
  }

  // Значение-TNUserPicture
  export interface ValueUserPicture extends ValueBase {
    // Тип данных ячейки таблицы
    type: DataType.UserPicture;
    // (`DataType.UserPicture`) Ссылка на изображение
    imageUrl?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Иконка
    icon?: IconNames;
    // Простое значение
    value?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Цвет иконки
    iconColor?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Второстепенный цвет иконки
    iconSecondaryColor?: string;
  }

  // Значение-текст
  export interface ValueText extends ValueBase {
    // Тип данных ячейки таблицы
    type: DataType.Text;
    // Простое значение
    value?: string;
    // (`DataType.Text`) Отображение возможности скопировать значение
    copyable?: boolean;
    // (`DataType.Text`) Отображение подсказки для текста
    tooltip?: string;
  }

  // Значение-компонент
  export interface ValueComponent extends ValueBase {
    // Тип данных ячейки таблицы
    type: DataType.Component;
    // (`DataType.Component`) Vue-компонент, который будет отображаться в ячейке
    component: Component | VNode;
    // (`DataType.Component`) Передаваемые параметры vue-компонента
    bind?: Record<string, unknown>;
    // (`DataType.Component`) Обработчики событий vue-компонента
    events?: Record<string, (...args: unknown[]) => void>;
  }

  // Значение таблицы
  export type Value = string | number | undefined | ValueTag | ValueLink | ValueUserPicture | ValueText | ValueComponent;

  // Строка тела таблицы
  export interface Data<TId extends string | number = string | number, TMenuId extends string | number = string> {
    // Идентификатор строки
    id: TId;
    // Иконки кнопки контекстного меню
    contextIcon?: IconNames;
    // Список пунктов контекстного меню
    rowMenu?: ITNDropdownMenu<TMenuId>[];
    // Данные строки, где key - это ключ значения. В `TNTable.Header` и `TNTable.Sort` это `fieldName`
    data: Record<string, Value>;
  }

  // Ячейка шапки таблицы
  export interface Header {
    // Ключ для соответствия данных в строке таблицы со столбцом в шапке
    fieldName: string;
    // Заголовок столбца
    title: string;
    // Ширина столбца в пикселях
    width: number;
    // Отображение кнопки сортировки для столбца
    sort?: boolean;
    // Отображение поля фильтра
    filter?: {
      // Тип фильтрации данных таблицы
      type: FilterType;
      // Плейсхолдер для поля ввода
      placeholder?: string;
      // (`FilterType.Select`) Опции выпадающего меню
      selectOptions?: TNTreeProps.Option[];
      // Начальное значение фильтра
      initValue?: FilterValue;
      // Дополнительный селектор способа фильтрации
      method?: {
        // Опции способа фильтрации
        options: { title: string; id: string }[];
        // Выбранный способ фильтрации
        selected: string;
      };
      // Заблокированное состояние
      disabled?: boolean;
      // Возможность искать по элементам списка
      searchable?: boolean;
      // Плейсхолдер для поля поиска по элементам списка
      searchPlaceholder?: string;
    };
  }

  // Начальное значение фильтра
  export type FilterValue = string | number | Date | (string | number)[] | null;

  // Сортировка
  export interface Sort {
    // Название ключа
    fieldName: string;
    // Включена ли сортировка
    enabled: boolean;
    // Направление сортировки
    direction: SortDirection;
  }

  // Опция для выбранных строк таблицы
  export interface ListOption<TOptionId extends string | number = string> {
    // Заголовок
    title: string;
    // Идентификатор
    id: TOptionId;
    // Иконка
    icon?: IconNames;
    // Заблокированное состояние
    disabled?: boolean;
    // Подпись к заблокированному состоянию
    disabledAnnotation?: string;
  }

  // Направление сортировки
  export enum SortDirection {
    // По возрастанию
    Ascend,
    // По убыванию
    Descend
  }

  // Тип данных ячейки таблицы
  export enum DataType {
    Tag,
    Link,
    UserPicture,
    Text,
    Component
  }

  // Тип фильтрации данных таблицы
  export enum FilterType {
    // Текстовое поле
    Text,
    // Числовое поле
    Number,
    // Поле ввода даты
    Date,
    // Выпадающее меню
    Select,
    // Выпадающее меню с мультивыбором
    MultiSelect
  }

  // Поведение при нажатии чекбокса выбора всех строк, если некоторые строки уже выбраны
  export enum SelectAllLogic {
    // Сбросить выбор со всех строк
    DataReset,
    // Выбрать все строки
    DataEnrichment
  }
}
