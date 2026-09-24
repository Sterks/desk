import { computed, ref, type ComputedRef } from 'vue';

export interface FieldValidity {
  /** Хотя бы одно поле формы сейчас содержит текст, который нельзя сохранить (например, `1,5` в числовом). */
  hasInvalid: ComputedRef<boolean>;
  setInvalid(id: string, isInvalid: boolean): void;
}

/**
 * Какие поля формы сейчас невалидны. FieldInput сообщает об этом событием `invalid`, а форма
 * (панель задачи, окно создания, окно requires) блокирует сохранение, пока набор не пуст: невалидный
 * текст не попадает в черновик, и без блокировки сохранение отправило бы старое значение, хотя на
 * экране написано другое.
 */
export function useFieldValidity(): FieldValidity {
  const invalidIds = ref<ReadonlySet<string>>(new Set());

  function setInvalid(id: string, isInvalid: boolean): void {
    if (invalidIds.value.has(id) === isInvalid) return;
    invalidIds.value = isInvalid
      ? new Set([...invalidIds.value, id])
      : new Set([...invalidIds.value].filter((x) => x !== id));
  }

  return { hasInvalid: computed(() => invalidIds.value.size > 0), setInvalid };
}
