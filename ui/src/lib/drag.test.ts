import { describe, expect, it } from 'vitest';
import { columnAtPoint, resolveDragEnd, type Lane } from './drag';

const lanes: Lane[] = [
  { id: 'backlog', left: 0, right: 100, top: 50 },
  { id: 'in_progress', left: 120, right: 220, top: 50 },
];

describe('columnAtPoint', () => {
  it('returns the column whose lane contains the point', () => {
    expect(columnAtPoint(lanes, 150, 60)).toBe('in_progress');
  });

  it('counts a point far below a short column as that column', () => {
    expect(columnAtPoint(lanes, 50, 5000)).toBe('backlog');
  });

  it('returns null above the columns and in the gap between them', () => {
    expect(columnAtPoint(lanes, 50, 10)).toBeNull();
    expect(columnAtPoint(lanes, 110, 60)).toBeNull();
  });
});

describe('resolveDragEnd', () => {
  it('treats a missing event (Sortable.destroy) as cancel', () => {
    expect(resolveDragEnd(undefined)).toEqual({ kind: 'cancel' });
    expect(resolveDragEnd(null)).toEqual({ kind: 'cancel' });
  });

  it('treats any native dragend (no drop happened: Escape, released outside a target) as cancel', () => {
    // dropEffect after Escape differs per engine (Chromium none, Firefox move, WebKit all) — irrelevant.
    expect(resolveDragEnd({ type: 'dragend', clientX: 150, clientY: 60 })).toEqual({ kind: 'cancel' });
  });

  it('treats touchcancel as cancel', () => {
    expect(resolveDragEnd({ type: 'touchcancel' })).toEqual({ kind: 'cancel' });
  });

  it('uses the drop point of drop / mouseup / pointerup', () => {
    for (const type of ['drop', 'mouseup', 'pointerup']) {
      expect(resolveDragEnd({ type, clientX: 150, clientY: 60 })).toEqual({ kind: 'point', x: 150, y: 60 });
    }
  });

  it('uses changedTouches for touchend', () => {
    expect(resolveDragEnd({ type: 'touchend', changedTouches: [{ clientX: 7, clientY: 8 }] })).toEqual({ kind: 'point', x: 7, y: 8 });
    expect(resolveDragEnd({ type: 'touchend', changedTouches: [] })).toEqual({ kind: 'last' });
  });

  it('falls back to the last tracked column when there is no usable point', () => {
    expect(resolveDragEnd({ type: 'drop' })).toEqual({ kind: 'last' });
  });
});
