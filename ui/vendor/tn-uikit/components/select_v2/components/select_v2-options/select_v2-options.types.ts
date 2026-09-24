/** Допустимый вид опции: объект, строка или число. */
export type TNSelectV2OptionLike = Record<string, unknown> | string | number;

/** Значение опции-примитива или поля `option[valueKey]`. */
export type TNSelectV2Primitive = string | number;

/**
 * Ключи опции-объекта, значения которых — примитивы (включая опциональные поля).
 * Ограничивает `valueKey`/`idKey`: указать их на поле-объект нельзя.
 * Для опций-примитивов даёт `never` — `valueKey`/`idKey` с ними не сочетаются.
 */
export type TNSelectV2PrimitiveKeys<T> = T extends object ? { [K in keyof T]-?: NonNullable<T[K]> extends TNSelectV2Primitive ? K : never }[keyof T] : never;

/**
 * Ключи опции-объекта, значения которых — булевы (включая опциональные поля).
 * Ограничивает `disabledKey`. Для опций-примитивов даёт `never` — у них признака недоступности нет.
 */
export type TNSelectV2BooleanKeys<T> = T extends object ? { [K in keyof T]-?: NonNullable<T[K]> extends boolean ? K : never }[keyof T] : never;

/** Нормализованная опция для отрисовки списка (презентационным компонентам не нужны ключи/аксессоры). */
export interface TNSelectV2Item<TOption> {
  /** Исходная опция. */
  option: TOption;
  /** Уникальный идентификатор (для `:key`). */
  id: string | number;
  /** Отображаемый текст. */
  label: string;
  /** Является ли опция выбранной. */
  selected: boolean;
  /** Заблокирована ли опция для выбора. */
  disabled: boolean;
}
