import type {BoardInfo,ColumnInfo,TaskItem} from '../api/types';
import {TaskCard} from './TaskCard';

export function Column({column,tasks,board,onOpen,onDrop,onDragStart,onMove}:{column:ColumnInfo;tasks:TaskItem[];board:BoardInfo;onOpen:(id:string)=>void;onDrop:(column:string)=>void;onDragStart:(id:string)=>void;onMove:(id:string,to:string)=>void}){
  return <section className="column" data-column-id={column.id} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(column.id)}><header><h2>{column.title}</h2><span>{tasks.length}{column.wip_limit?`/${column.wip_limit}`:''}</span></header><div className="column-tasks">{tasks.map(t=><TaskCard key={t.id} task={t} board={board} onOpen={onOpen} onDragStart={onDragStart} onMove={onMove}/>)}</div></section>;
}
