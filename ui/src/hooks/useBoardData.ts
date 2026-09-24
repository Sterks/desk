import {useCallback,useEffect,useState} from 'react';
import {api,errorMessage} from '../api/client';
import type {BoardInfo,ProjectInfo,ProjectList,TaskList} from '../api/types';

export function useBoardData(){
  const[project,setProject]=useState<ProjectInfo|null>(null);const[projects,setProjects]=useState<ProjectList|null>(null);const[board,setBoard]=useState<BoardInfo|null>(null);const[list,setList]=useState<TaskList|null>(null);const[error,setError]=useState<string|null>(null);const[version,setVersion]=useState(0);
  const refresh=useCallback(async()=>{try{const[p,ps,b,l]=await Promise.all([api.project(),api.projects(),api.board(),api.tasks()]);setProject(p);setProjects(ps);setBoard(b);setList(l);setError(null);setVersion(v=>v+1);}catch(e){setError(errorMessage(e));}},[]);
  useEffect(()=>{void refresh();const s=new EventSource('/api/events');const f=()=>void refresh();for(const t of ['task_changed','task_removed','board_changed'])s.addEventListener(t,f);s.onerror=()=>setError('Нет связи с desk ui. Переподключение…');return()=>s.close();},[refresh]);
  return{project,projects,board,list,error,version,refresh};
}
