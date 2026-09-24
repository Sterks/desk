import type {BoardInfo,TaskItem} from '../api/types';
export const allowedTargets=(b:BoardInfo,from:string)=>{const known=b.columns.some(c=>c.id===from),others=b.columns.map(c=>c.id).filter(id=>id!==from);if(b.transitions===null||!known)return others;const targets=new Set(b.transitions.filter(t=>t.from===from).flatMap(t=>t.to));return others.filter(id=>targets.has(id));};
export const requiredFor=(b:BoardInfo,from:string,to:string)=>b.transitions===null?[]:[...new Set(b.transitions.filter(t=>t.from===from&&t.to.includes(to)).flatMap(t=>t.requires))];
export const isEmptyValue=(v:unknown)=>v===undefined||v===null||v===''||(Array.isArray(v)&&v.length===0);
export const missingForMove=(b:BoardInfo,t:TaskItem,to:string)=>requiredFor(b,t.column,to).filter(id=>isEmptyValue(id==='assignee'?t.assignee:t.fields[id]));
export const groupByColumn=(b:BoardInfo,tasks:readonly TaskItem[])=>new Map(b.columns.map(c=>[c.id,tasks.filter(t=>t.column===c.id)]));
export const orphanTasks=(b:BoardInfo,tasks:readonly TaskItem[])=>{const ids=new Set(b.columns.map(c=>c.id));return tasks.filter(t=>!ids.has(t.column));};
