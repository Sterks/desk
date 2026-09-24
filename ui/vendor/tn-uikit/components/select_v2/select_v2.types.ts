import type { TNSelectV2BooleanKeys, TNSelectV2Primitive, TNSelectV2PrimitiveKeys } from "./components/select_v2-options/select_v2-options.types";

/** Вид опции TNSelectV2: объект, строка или число. */
export type TNSelectV2Option = object | string | number;

/** Тип `modelValue`, вычисляемый из фактического `valueKey`: `option[valueKey]`, либо вся опция (объект или примитив). */
export type TNSelectV2ModelValue<
  TOption extends TNSelectV2Option,
  TValueKey extends TNSelectV2PrimitiveKeys<TOption> | undefined
> = TValueKey extends keyof TOption ? TOption[TValueKey] : TOption;

/**
 * Пропсы TNSelectV2, зависящие от вида опций:
 * - примитивы → ключи не нужны, значение — сам примитив;
 * - объекты + `valueKey` → в модель уходит `option[valueKey]` (только примитивное поле), `idKey` необязателен;
 * - объекты без `valueKey` → в модель уходит вся опция, поэтому `idKey` обязателен (сравнение / `:key`).
 */
export type TNSelectV2OptionProps<TOption extends TNSelectV2Option, TValueKey extends TNSelectV2PrimitiveKeys<TOption> | undefined> =
  | {
      /** Массив опций-примитивов. */
      options?: (TOption & TNSelectV2Primitive)[];
      labelKey?: never;
      valueKey?: never;
      idKey?: never;
      disabledKey?: never;
      /** Значение — сам примитив. */
      modelValue?: TNSelectV2ModelValue<TOption, TValueKey> & TNSelectV2Primitive;
    }
  | {
      /** Массив опций-объектов. */
      options?: TOption[];
      /** Имя примитивного поля-подписи. По умолчанию `"title"`. */
      labelKey?: TNSelectV2PrimitiveKeys<TOption>;
      /** Имя примитивного поля-значения, попадающего в `modelValue`. */
      valueKey: TValueKey;
      /** Имя примитивного поля-идентификатора (сравнение, `:key`). По умолчанию `"id"`. */
      idKey?: TNSelectV2PrimitiveKeys<TOption>;
      /** Имя булева поля-признака недоступной опции. По умолчанию `"disabled"`. */
      disabledKey?: TNSelectV2BooleanKeys<TOption>;
      /** Значение — `option[valueKey]`. */
      modelValue?: TNSelectV2ModelValue<TOption, TValueKey>;
    }
  | {
      /** Массив опций-объектов. */
      options?: TOption[];
      /** Имя примитивного поля-подписи. По умолчанию `"title"`. */
      labelKey?: TNSelectV2PrimitiveKeys<TOption>;
      valueKey?: never;
      /** Имя примитивного поля-идентификатора (сравнение, `:key`). Обязателен, когда не задан `valueKey`. По умолчанию `"id"`. */
      idKey: TNSelectV2PrimitiveKeys<TOption>;
      /** Имя булева поля-признака недоступной опции. По умолчанию `"disabled"`. */
      disabledKey?: TNSelectV2BooleanKeys<TOption>;
      /** Значение — вся опция-объект. */
      modelValue?: TNSelectV2ModelValue<TOption, TValueKey>;
    };

/** Scope слота `option` — данные одной строки списка. */
export interface TNSelectV2OptionSlotScope<TOption> {
  /** Исходная опция. */
  option: TOption;
  /** Отображаемый текст: `option[labelKey]` или сам примитив. */
  label: string;
  /** Позиция в отображаемом списке (после локального фильтра). */
  index: number;
  /** Опция выбрана. */
  isSelected: boolean;
  /** Опция заблокирована: поле `disabledKey` истинно. */
  isDisabled: boolean;
}

/**
 * Публичный API TNSelectV2, доступный через template ref.
 * Компонент generic, поэтому `InstanceType` для него не подходит — типизируйте ref этим интерфейсом.
 */
export interface TNSelectV2Expose {
  /** Открыт ли выпадающий список. */
  readonly isOpen: boolean;
  /** Корневой элемент контрола (без лейбла и описания) — для `scrollIntoView` и замеров. */
  readonly el: HTMLElement | null;
  /** Открыть список. Учитывает `disabled`. */
  open: () => void;
  /** Закрыть список. */
  close: () => void;
  /** Переключить состояние списка. */
  toggle: () => void;
  /** Сбросить строку поиска. Эмитит `search:update` с пустой строкой. */
  clearSearch: () => void;
}
