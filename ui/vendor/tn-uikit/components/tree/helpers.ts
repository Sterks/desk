import type { TNTreeProps } from "./tree.types";

/**
 * Функция для рекурсивного (по вложенности) прохода по дереву
 * @param options элементы дерева
 * @param callback функция для исполнения с элементом дерева
 * @param nameMethod метод прохождения по массиву
 * @param acc initialValue для метода nameMethod === "reduce"
 *
 * @return - обновлённый список дерева
 */
export const recursive = <TId extends string | number = string | number>(
  options: TNTreeProps.Option<TId>[],
  callback: (option: TNTreeProps.Option<TId>, acc?: TNTreeProps.Option<TId>[]) => void,
  nameMethod: "forEach" | "filter" | "reduce" | "map" = "forEach",
  acc?: TNTreeProps.Option<TId>[]
): TNTreeProps.Option<TId>[] => {
  if (nameMethod === "forEach") {
    options.forEach(o => {
      callback(o);

      if (o.children && o.children.length) {
        recursive(o.children, callback);
      }
    });

    return options;
  } else if (nameMethod === "reduce" && acc) {
    return options.reduce((currentAcc, o) => {
      callback(o, currentAcc);

      if (o.children && o.children.length) {
        if (Array.isArray(currentAcc)) {
          const children = recursive(o.children, callback, nameMethod, []);
          if (children.length) {
            currentAcc.push(...children);
          }
        } else {
          currentAcc = recursive(o.children, callback, nameMethod, currentAcc);
        }
      }

      return currentAcc;
    }, acc);
  } else if (nameMethod === "map") {
    return options.map(o => {
      if (o.children && o.children.length) {
        o.children = recursive(o.children, callback, nameMethod);
      }

      callback(o);
      return o;
    });
  } else {
    return options.filter(o => {
      if (o.children && o.children.length) {
        o.children = recursive(o.children, callback, nameMethod);
      }

      return callback(o);
    });
  }
};

/**
 * Рекурсивная обработка массива примитивов
 *
 * @param arr - обрабатываемый массив
 * @param callback - функция для исполнения с элементом массива
 * @param deep - уровень вложенности
 * @param nameMethod - метод прохождения по массиву
 *
 * @return - обновлённый список дерева
 */
export const recursiveArray = <T>(
  arr: T[],
  callback: (item: T, deep: number) => void | boolean,
  deep = 0,
  nameMethod: "forEach" | "filter" = "forEach"
): T[] => {
  if (nameMethod === "forEach") {
    arr.forEach(item => {
      if (Array.isArray(item)) {
        recursiveArray(item, callback, deep + 1);
      } else {
        callback(item, deep);
      }
    });

    return arr;
  } else {
    return arr.filter(item => {
      if (Array.isArray(item)) {
        return !!recursiveArray<T>(item, callback, deep + 1, nameMethod).length;
      } else {
        return callback(item, deep);
      }
    });
  }
};

/**
 * Функция для прохождения по родителям всех уровней от элемента дерева
 * @param option - элемент дерева
 * @param callback - функция для исполнения с родителем элемента
 */
export function recursiveParents<TId extends string | number = string | number>(
  option: TNTreeProps.Option<TId>,
  callback: (parent: TNTreeProps.Option<TId>) => void
) {
  if (option.parent) {
    callback(option.parent);
    recursiveParents(option.parent, callback);
  }
}

/**
 * Функция получения состояния неопределённости элемента дерева
 * @param option - элемент дерева
 *
 * @return - состояние неопределённости
 */
export const getIsIndeterminate = <TId extends string | number = string | number>(option: TNTreeProps.Option<TId>): boolean => {
  let isExistCheckChild = false;
  let isExistUncheck = false;

  if (option.children && option.children.length) {
    recursive(option.children, (child: TNTreeProps.Option<TId>) => {
      if (child.isCheck) {
        isExistCheckChild = true;
      } else {
        isExistUncheck = true;
      }
    });
  }

  let isInDeterminate = isExistCheckChild && isExistUncheck;

  if (!isInDeterminate && isExistCheckChild) {
    isInDeterminate = true;
  }

  return isInDeterminate;
};

/**
 * Функция получения состояния зависимости родителя элемента от значений детей
 * @param option - элемент дерева
 * @param isDependsParent - глобальный параметр зависимости
 *
 * @return - состояние зависимости родителя
 */
export function getIsDependsParent<TId extends string | number = string | number>(option: TNTreeProps.Option<TId>, isDependsParent?: boolean): boolean {
  if (option.parent && option.parent.isDependsParent !== undefined) {
    return option.parent.isDependsParent;
  } else {
    return isDependsParent !== undefined ? isDependsParent : true;
  }
}

/**
 * Функция рекурсивного задания родителя для элементов дерева
 * @param item - элемент дерева
 * @param parent - элемент родителя
 *
 * @return - обновлённый элемент дерева
 */
export const getOptionsTree = <TId extends string | number = string | number>(
  item: TNTreeProps.Option<TId>,
  parent?: TNTreeProps.Option<TId>
): TNTreeProps.Option<TId> => {
  const child: TNTreeProps.Option<TId> = {
    ...item,
    id: item.id,
    parent,
    title: item.title,
    isDependsParent: item.isDependsParent,
    isCheck: item ? item.isCheck : false,
    isOpen: item.isOpen,
    isLoad: item.isLoad,
    deep: parent ? parent.deep + 1 : 0,
    disabled: item?.disabled,
    disableSelect: item?.disableSelect,
    iconButton: item.iconButton
  };

  if (item.children?.length) {
    child.children = item.children.reduce((acc, item) => {
      const childOption = getOptionsTree(item, child);

      if (childOption) {
        acc.push(childOption);
      }

      return acc;
    }, [] as TNTreeProps.Option<TId>[]);
  }

  return child;
};
