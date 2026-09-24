import {useState} from 'react';
import {useBoardData} from './hooks/useBoardData';
import {Board} from './board/Board';
import {api,errorMessage} from './api/client';
import {allowedTargets,missingForMove} from './lib/transitions';
import {TaskEditor} from './ui/TaskEditor';

export default function App(){
  const{project,projects,board,list,error,refresh}=useBoardData();
  const[selected,setSelected]=useState<string|null>(null);const[creating,setCreating]=useState(false);const[moveTo,setMoveTo]=useState<string|undefined>();const[query,setQuery]=useState('');const[dragged,setDragged]=useState<string|null>(null);const[moveError,setMoveError]=useState('');
  if(error&&!board)return <div className="fatal"><h1>desk</h1><p>{error}</p><button onClick={()=>void refresh()}>Повторить</button></div>;
  if(!project||!projects||!board||!list)return <div className="loading">Загрузка доски…</div>;
  const tasks=list.tasks.filter(t=>!query||`${t.id} ${t.title} ${t.assignee??''}`.toLowerCase().includes(query.toLowerCase()));const task=list.tasks.find(t=>t.id===selected);const closeEditor=()=>{setSelected(null);setCreating(false);setMoveTo(undefined)};
  const move=async(id:string,to:string)=>{const item=list.tasks.find(t=>t.id===id);setDragged(null);if(!item||item.column===to)return;if(!allowedTargets(board,item.column).includes(to)){setMoveError(`Переход ${item.column} → ${to} запрещён`);return;}const missing=missingForMove(board,item,to);if(missing.length){setSelected(item.id);setMoveTo(to);return;}try{await api.move(item.id,to);await refresh();}catch(e){setMoveError(errorMessage(e));}};
  const drop=async(to:string)=>{if(dragged)await move(dragged,to)};
  return <div className="app"><header className="topbar"><div><span className="eyebrow">OPERATOR CONSOLE</span><h1>{board.name}</h1><div className="project-context"><span>{project.tenant_id} /</span><label>Проект<select aria-label="Проект" value={project.project_id} disabled={projects.projects.length<2}>{projects.projects.map(item=><option key={`${item.tenant_id}/${item.project_id}`} value={item.project_id}>{item.name}</option>)}</select></label></div></div><div className="toolbar"><input aria-label="Поиск задач" placeholder="Поиск…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>setCreating(true)}>+ Новая задача</button><button onClick={()=>void refresh()}>Обновить</button></div></header>{moveError&&<div className="notice"><span>{moveError}</span><button onClick={()=>setMoveError('')}>×</button></div>}<Board board={board} tasks={tasks} onOpen={id=>{setCreating(false);setMoveTo(undefined);setSelected(id)}} onDragStart={setDragged} onDrop={drop} onMove={move}/>{(task||creating)&&<TaskEditor task={task??null} board={board} moveTo={moveTo} onClose={closeEditor} onSaved={()=>void refresh()}/>}</div>
}
