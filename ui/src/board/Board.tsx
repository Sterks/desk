import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { BoardInfo, TaskItem } from '../api/types';
import { allowedTargets, groupByColumn } from '../lib/transitions';
import { Column, type DropState } from './Column';
import { TaskCardView } from './TaskCard';

export interface BoardProps {
  board: BoardInfo;
  tasks: TaskItem[];
  onOpen(id: string): void;
  onMove(task: TaskItem, to: string): void;
}

const DRAG_ACTIVATION_PX = 5;
// Enter оставлен кнопке названия (открыть панель); перетаскивание с клавиатуры — Пробел.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space'] };

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

const announcements: Announcements = {
  onDragStart: ({ active }) => `Взята задача ${active.id}`,
  onDragOver: ({ active, over }) => (over ? `Задача ${active.id} над колонкой ${over.id}` : `Задача ${active.id} вне колонок`),
  onDragEnd: ({ active, over }) => (over ? `Задача ${active.id} отпущена в колонку ${over.id}` : `Задача ${active.id} отпущена вне колонок`),
  onDragCancel: ({ active }) => `Перенос задачи ${active.id} отменён`,
};

const accessibility = {
  announcements,
  screenReaderInstructions: { draggable: 'Пробел — взять задачу, стрелки — двигать, Пробел — отпустить, Escape — отмена.' },
};

export function Board({ board, tasks, onOpen, onMove }: BoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_PX } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES }),
  );
  const [active, setActive] = useState<TaskItem | null>(null);
  const byColumn = groupByColumn(board, tasks);
  const allowed = active ? new Set(allowedTargets(board, active.column)) : null;

  const dropStateFor = (columnId: string): DropState => {
    if (!active || !allowed) return 'idle';
    if (columnId === active.column) return 'origin';
    return allowed.has(columnId) ? 'allowed' : 'blocked';
  };

  const handleStart = ({ active: dragged }: DragStartEvent): void => {
    setActive(tasks.find((t) => t.id === dragged.id) ?? null);
  };

  const handleEnd = ({ over }: DragEndEvent): void => {
    const task = active;
    setActive(null);
    // Запрещённую колонку тоже отдаём серверу: его ответ с причиной покажет toast, карточка останется на месте.
    if (task && over && typeof over.id === 'string' && over.id !== task.column) onMove(task, over.id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={accessibility}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="board">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={byColumn.get(column.id) ?? []}
            board={board}
            dropState={dropStateFor(column.id)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <TaskCardView task={active} board={board} onOpen={() => undefined} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}
