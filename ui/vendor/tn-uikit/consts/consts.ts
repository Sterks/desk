import { DefaultIconNames } from "../components/icons/default-icons";

export const filterState = (state: Record<string, unknown>) => {
  const newObject = { ...state };
  delete newObject._hPropState;
  delete newObject._hPropDefs;
  delete newObject.$data;
  return newObject;
};

/** Список иконок для селектов в story. Пустая строка — вариант «без иконки» **/
export const iconNamesArray = ["", ...DefaultIconNames];
