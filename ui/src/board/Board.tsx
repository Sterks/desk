import type {BoardInfo,TaskItem} from '../api/types';
import {groupByColumn} from '../lib/transitions';
import {Column} from './Column';

export function Board({board,tasks,onOpen,onDrop,onDragStart,onMove}:{board:BoardInfo;tasks:TaskItem[];onOpen:(id:string)=>void;onDrop:(column:string)=>void;onDragStart:(id:string)=>void;onMove:(id:string,to:string)=>void}){const groups=groupByColumn(board,tasks);return <main className="board">{board.columns.map(c=><Column key={c.id} column={c} tasks={groups.get(c.id)??[]} board={board} onOpen={onOpen} onDrop={onDrop} onDragStart={onDragStart} onMove={onMove}/>)}</main>}
