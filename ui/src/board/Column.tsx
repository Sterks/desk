import type { ReactNode } from 'react';
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import { TaskCard } from './TaskCard';

export type DropState = 'idle' | 'origin' | 'allowed' | 'blocked' | 'over';

export interface ColumnFrameProps {
  column: ColumnInfo;
  dropState: DropState;
  setNodeRef?: (element: HTMLElement | null) => void;
  children: ReactNode;
}

export function ColumnFrame({ column, dropState, setNodeRef, children }: ColumnFrameProps) {
  const limit = column.wip_limit;
  const limitState = limit === null ? undefined : column.count > limit ? 'over' : column.count >= limit ? 'full' : undefined;
  return (
    <section ref={setNodeRef} className="column" aria-label={column.title} data-drop={dropState} data-limit={limitState}>
      <header className="column-head">
        <h2 className="column-title">{column.title}</h2>
        <span className="column-count" title={limit === null ? 'Задач в колонке' : 'Задач / WIP-лимит'}>
          {limit === null ? column.count : `${column.count}/${limit}`}
        </span>
      </header>
      {column.guide && <p className="column-guide">{column.guide}</p>}
      <div className="column-body">{children}</div>
    </section>
  );
}

export interface ColumnProps {
  column: ColumnInfo;
  tasks: TaskItem[];
  board: BoardInfo;
  onOpen(id: string): void;
}

export function Column({ column, tasks, board, onOpen }: ColumnProps) {
  return (
    <ColumnFrame column={column} dropState="idle">
      {tasks.length === 0 ? (
        <p className="column-empty">пусто</p>
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} board={board} onOpen={onOpen} />)
      )}
    </ColumnFrame>
  );
}
