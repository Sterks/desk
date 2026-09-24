/**
 * Первое реально доступное поле формы: kit-компоненты могут держать скрытые/отключённые input внутри.
 * Общая для окон, которые при открытии ставят фокус в первое поле (RequiresDialog, CreateTaskDialog).
 */
export function firstField(root: HTMLElement | null): HTMLElement | undefined {
  const candidates = root?.querySelectorAll<HTMLInputElement>('input, select, textarea') ?? [];
  return Array.from(candidates).find((el) => el.type !== 'hidden' && !el.disabled && el.getClientRects().length > 0);
}
