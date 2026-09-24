import type { IconNames } from "../icons/icon-names";

// Именная область Дерева
export namespace TNTreeProps {
  // Пункт списка дерева
  export type Option<TId extends string | number = string | number> = {
    // Идентификатор
    id: TId;
    // Ссылка на родительский элемент
    parent?: Option<TId>;
    // Название
    title: string;
    // Выбран ли пункт
    isCheck: boolean;
    // Развёрнут ли пункт
    isOpen?: boolean;
    // Состояние загрузки пункта
    isLoad?: boolean;
    // Блокирует элемент, его невозможно выбрать и открыть дочерние элементы
    disabled?: boolean;
    // Блокирует выбор родительского элемента, открывать и выбирать дочерние элементы остается возможным
    disableSelect?: boolean;
    // Уровень вложенности
    deep: number;
    // Список вложенных пунктов
    children?: Option<TId>[];
    // Если нужно данный пункт оставлять выбранным, даже если не выбраны его дочерние элементы
    isDependsParent?: boolean;
    // Иконка действия, которая будет вызывать событие iconButtonClick
    iconButton?: IconNames;
  };
}
