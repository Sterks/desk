import type {BoardInfo,TaskItem} from '../api/types';
import {agentColor} from '../lib/agentColor';
import {priorityTone} from '../lib/priority';

export function TaskCard({task,board,onOpen,onDragStart,onMove}:{task:TaskItem;board:BoardInfo;onOpen:(id:string)=>void;onDragStart?:(id:string)=>void;onMove?:(id:string,to:string)=>void}){
  const tone=priorityTone(board,task.fields.priority);
  return <div className="task-card-wrap"><button draggable className={`task-card priority-${tone??'none'}`} onDragStart={()=>onDragStart?.(task.id)} onClick={()=>onOpen(task.id)}><span className="task-id">{task.id}</span><strong>{task.title}</strong><span className="task-meta">{task.assignee&&<i style={{background:agentColor(task.assignee)}}/>}{task.assignee??'unassigned'}</span></button><label className="task-move-control">Переместить<select aria-label={`Переместить ${task.id}`} defaultValue="" onChange={e=>{if(e.target.value)onMove?.(task.id,e.target.value);e.currentTarget.value='';}}><option value="">—</option>{board.columns.map(column=><option key={column.id} value={column.id}>{column.title}</option>)}</select></label></div>;
}
