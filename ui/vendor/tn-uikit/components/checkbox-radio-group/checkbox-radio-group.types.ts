export type TNCheckboxRadioGroupModelValue = string | number | boolean;

export type TNCheckboxRadioGroupType = "checkbox" | "radio";

/** Значение группы: массив для `type="checkbox"`, одиночное значение для `type="radio"` */
export type TNCheckboxRadioGroupValue<
  TValue extends TNCheckboxRadioGroupModelValue = TNCheckboxRadioGroupModelValue,
  TType extends TNCheckboxRadioGroupType = TNCheckboxRadioGroupType
> = TType extends "radio" ? TValue : TValue[];

export type TNCheckboxRadioGroupProps<
  TValue extends TNCheckboxRadioGroupModelValue = TNCheckboxRadioGroupModelValue,
  TType extends TNCheckboxRadioGroupType = "checkbox"
> = {
  /** Массив значений для каждого внутреннего TNRadio/TNCheckbox'a */
  options: ITNCheckboxRadioGroupOption<TValue>[];
} & (
  | {
      /** Тип группы: список чекбоксов (по умолчанию) */
      type?: TType & "checkbox";
      /** Значение — массив выбранных значений */
      modelValue?: TValue[];
    }
  | {
      /** Тип группы: список радиокнопок */
      type: TType & "radio";
      /** Значение — выбранное значение */
      modelValue?: TValue;
    }
);

export interface ITNCheckboxRadioGroupOption<TValue extends TNCheckboxRadioGroupModelValue = TNCheckboxRadioGroupModelValue> {
  /** Текст рядом с элементом списка */
  label: string;
  /** Значение данного элемента в списке */
  itemValue: TValue;
  /** Делает элемент недоступным к выбору, не влияя на ее выбранность */
  disabled?: boolean;
  /** Текст ошибки (включает «error» стиль у элемента)  */
  error?: string;
  /** Текст предупреждения (включает «warning» стиль у элемента) */
  warn?: string;
  /** Текст для описания элемента */
  description?: string;
}
