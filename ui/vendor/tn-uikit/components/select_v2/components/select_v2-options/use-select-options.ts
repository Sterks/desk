import { computed, type Ref } from "vue";
import type { TNSelectV2BooleanKeys, TNSelectV2Item, TNSelectV2OptionLike, TNSelectV2PrimitiveKeys } from "./select_v2-options.types";

/** Подмножество пропсов, нужное для резолва опций и выбора. */
export interface UseSelectOptionsProps<TOption, TModelValue> {
  options: TOption[];
  modelValue?: TModelValue;
  labelKey?: TNSelectV2PrimitiveKeys<TOption>;
  valueKey?: TNSelectV2PrimitiveKeys<TOption>;
  idKey?: TNSelectV2PrimitiveKeys<TOption>;
  disabledKey?: TNSelectV2BooleanKeys<TOption>;
  searchable?: boolean;
  localFilter?: boolean;
}

/**
 * Инкапсулирует data-логику селектора: резолв `label`/`id`/`value`/`disabled` по ключам,
 * поддержку опций-примитивов, сравнение/выбор и локальную фильтрацию.
 * Возвращает нормализованный список `items` для презентационных компонентов.
 */
export const useSelectOptions = <TOption extends TNSelectV2OptionLike, TModelValue>(props: UseSelectOptionsProps<TOption, TModelValue>, query: Ref<string>) => {
  // keyof-типизированные ключи нельзя задать дефолтом через withDefaults
  // (литерал не совместим с keyof TOption), поэтому резолвим имена в строки здесь.
  const labelKeyName = computed<string>(() => (props.labelKey as string) ?? "title");
  const idKeyName = computed<string>(() => (props.idKey as string) ?? "id");
  const disabledKeyName = computed<string>(() => (props.disabledKey as string) ?? "disabled");

  /** Опция-примитив (строка/число) сама является своим label, id и значением. */
  const isPrimitiveOption = (option: TOption): option is TOption & (string | number) => option == null || typeof option !== "object";

  const getLabel = (option: TOption): string => {
    if (isPrimitiveOption(option)) return String(option ?? "");
    return String((option as Record<string, unknown>)[labelKeyName.value] ?? "");
  };

  const getId = (option: TOption): string | number => {
    if (isPrimitiveOption(option)) return option;
    return (option as Record<string, unknown>)[idKeyName.value] as string | number;
  };

  const isDisabled = (option: TOption): boolean => !isPrimitiveOption(option) && !!(option as Record<string, unknown>)[disabledKeyName.value];

  const valueOf = (option: TOption): unknown => {
    if (props.valueKey && !isPrimitiveOption(option)) return (option as Record<string, unknown>)[props.valueKey as string];
    return option;
  };

  const sameValue = (a: unknown, b: unknown): boolean => {
    if (a == null || b == null) return a === b;
    if (typeof a === "object" && typeof b === "object") {
      const aId = (a as Record<string, unknown>)[idKeyName.value];
      const bId = (b as Record<string, unknown>)[idKeyName.value];
      if (aId == null && bId == null) return a === b;
      return aId === bId;
    }
    return a === b;
  };

  const isSelected = (option: TOption): boolean => sameValue(valueOf(option), props.modelValue);

  const hasSelection = computed<boolean>(() => props.modelValue !== undefined && props.modelValue !== null);

  const selectedOption = computed<TOption | null>(() => {
    if (!hasSelection.value) return null;
    return props.options.find(option => sameValue(valueOf(option), props.modelValue)) ?? null;
  });

  const displayLabel = computed<string>(() => {
    if (selectedOption.value) return getLabel(selectedOption.value);
    const value = props.modelValue;
    if (value && typeof value === "object") return getLabel(value as unknown as TOption);
    return value == null ? "" : String(value);
  });

  const displayedOptions = computed<TOption[]>(() => {
    if (!props.searchable || !props.localFilter) return props.options;
    const search = query.value.trim().toLowerCase();
    if (!search) return props.options;
    return props.options.filter(option => getLabel(option).toLowerCase().includes(search));
  });

  /** Нормализованный список опций для отрисовки. */
  const items = computed<TNSelectV2Item<TOption>[]>(() =>
    displayedOptions.value.map(option => ({
      option,
      id: getId(option),
      label: getLabel(option),
      selected: isSelected(option),
      disabled: isDisabled(option)
    }))
  );

  return { valueOf, hasSelection, selectedOption, displayLabel, items };
};
