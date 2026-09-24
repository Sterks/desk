import type { BoardInfo } from '../api/types';

export type PriorityTone = 'critical' | 'high' | 'normal' | 'low';

export function priorityTone(board: BoardInfo, value: unknown): PriorityTone | null {
  const field = board.fields.find((f) => f.id === 'priority' && f.type === 'enum');
  const values = field?.values ?? [];
  if (typeof value !== 'string') return null;
  const index = values.indexOf(value);
  if (index === -1) return null;
  if (index === 0) return 'critical';
  if (values.length > 2 && index === 1) return 'high';
  if (values.length > 2 && index === values.length - 1) return 'low';
  return 'normal';
}

const TONE_CLASS: Record<PriorityTone, string> = {
  critical: 'priority-p0',
  high: 'priority-p1',
  normal: 'priority-p2',
  low: 'priority-p3',
};

/**
 * CSS-класс пилюли по ПОЗИЦИИ значения в `values` поля priority (spec §6): первое значение →
 * `.priority-p0`, как бы оно ни называлось, — через тот же priorityTone. Значения вне списка — null,
 * пилюля остаётся без цветового акцента.
 */
export function priorityClass(tone: PriorityTone | null): string | null {
  return tone === null ? null : TONE_CLASS[tone];
}
