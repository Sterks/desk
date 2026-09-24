// Чистая логика drag-and-drop доски (Board.vue): куда пришёлся бросок и не был ли жест отменён.
// Без DOM — чтобы покрыть юнит-тестами; Board.vue передаёт сюда прямоугольники колонок и событие.

/** Горизонтальная полоса колонки на экране (из getBoundingClientRect секции). */
export interface Lane {
  id: string;
  left: number;
  right: number;
  top: number;
}

/**
 * Колонка — вертикальная полоса: точка в её ширине и не выше её верха. Отпускание ниже короткой
 * колонки, но в её полосе, — бросок в неё (как pointerWithin + rectIntersection в React-версии).
 */
export function columnAtPoint(lanes: readonly Lane[], x: number, y: number): string | null {
  return lanes.find((l) => x >= l.left && x <= l.right && y >= l.top)?.id ?? null;
}

interface PointLike {
  clientX: number;
  clientY: number;
}

/** То, что SortableJS кладёт в `originalEvent` события end: drop/dragend (нативный DnD) или
 *  mouseup/pointerup/touchend/touchcancel (fallback-режим). */
export interface DragEndEventLike {
  type: string;
  clientX?: number;
  clientY?: number;
  changedTouches?: ArrayLike<PointLike>;
}

export type DropEnd = { kind: 'cancel' } | { kind: 'point'; x: number; y: number } | { kind: 'last' };

/**
 * Как закончился жест:
 * - `cancel` — отмена: нативный `dragend` (Escape, отпускание вне окна или над элементом, который
 *   не принимает бросок), `touchcancel`, или события нет вовсе (Sortable.destroy() при размонтировании
 *   колонки вызывает _onDrop() без аргумента). Любой `dragend` — отмена, а не только с dropEffect
 *   `none`: при успешном броске SortableJS заканчивает жест раньше, на `drop` (он слушает drop на
 *   document), и `end` на последующем dragend уже не шлёт (p.active обнулён). А dropEffect после
 *   Escape браузеры сообщают по-разному — замерено: Chromium `none`, Firefox `move`, WebKit `all`;
 * - `point` — бросок в известной точке (drop, mouseup, pointerup, touchend);
 * - `last` — точки нет, берём последнюю колонку под указателем, которую отследил Board.
 */
export function resolveDragEnd(evt: DragEndEventLike | null | undefined): DropEnd {
  if (!evt || evt.type === 'touchcancel') return { kind: 'cancel' };
  if (evt.type === 'dragend') return { kind: 'cancel' };
  if (evt.type === 'touchend') {
    const touch = evt.changedTouches?.[0];
    return touch ? { kind: 'point', x: touch.clientX, y: touch.clientY } : { kind: 'last' };
  }
  if (typeof evt.clientX === 'number' && typeof evt.clientY === 'number') return { kind: 'point', x: evt.clientX, y: evt.clientY };
  return { kind: 'last' };
}
