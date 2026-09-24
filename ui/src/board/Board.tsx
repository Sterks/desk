import type { BoardInfo, TaskItem } from '../api/types';
import { groupByColumn } from '../lib/transitions';
import { Column } from './Column';

export interface BoardProps {
  board: BoardInfo;
  tasks: TaskItem[];
  onOpen(id: string): void;
}

export function Board({ board, tasks, onOpen }: BoardProps) {
  const byColumn = groupByColumn(board, tasks);
  return (
    <div className="board">
      {board.columns.map((column) => (
        <Column key={column.id} column={column} tasks={byColumn.get(column.id) ?? []} board={board} onOpen={onOpen} />
      ))}
    </div>
  );
}
