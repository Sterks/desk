import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityTone } from '../lib/priority';

export interface TaskCardProps {
  task: TaskItem;
  board: BoardInfo;
  onOpen(id: string): void;
}

export function TaskCardView({ task, board, onOpen, lifted = false }: TaskCardProps & { lifted?: boolean }) {
  const tone = priorityTone(board, task.fields.priority);
  const priority = task.fields.priority;
  return (
    <article
      className="card"
      data-testid={`card-${task.id}`}
      data-tone={tone ?? undefined}
      data-invalid={task.invalid || undefined}
      data-lifted={lifted || undefined}
    >
      <header className="card-head">
        <span className="card-id">{task.id}</span>
        {task.invalid && (
          <span className="card-flag" title={task.errors.join('\n')}>
            ошибка схемы
          </span>
        )}
      </header>
      <button type="button" className="card-title" onClick={() => onOpen(task.id)}>
        {task.title}
      </button>
      {task.agent && task.agent !== task.assignee && (
        <span className="card-agent" title="Тип сабагента">
          {task.agent}
        </span>
      )}
      <footer className="card-meta">
        {typeof priority === 'string' && (
          <span className="badge" data-tone={tone ?? undefined}>
            {priority}
          </span>
        )}
        {task.assignee && (
          <span className="assignee" style={{ '--agent-color': agentColor(task.assignee) } as CSSProperties}>
            {task.assignee}
          </span>
        )}
      </footer>
    </article>
  );
}

export function TaskCard({ task, board, onOpen }: TaskCardProps) {
  // role group, а не button по умолчанию: внутри есть кнопка названия, а вложенные интерактивные роли axe считает ошибкой.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    attributes: { role: 'group', roleDescription: 'перетаскиваемая задача' },
  });
  return (
    <div
      ref={setNodeRef}
      className="draggable"
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-label={`${task.id}: ${task.title}`}
    >
      <TaskCardView task={task} board={board} onOpen={onOpen} />
    </div>
  );
}
