import { Project } from '../types';
import { validateProject } from '../utils/fileFormat';
import { getSnapshot, putSnapshot, deleteSnapshot } from './projectSnapshots';
import { cachedPreview, rememberPreview } from './projectContainer/cache';
import { createProjectPreview } from './projectContainer/preview';
export interface RecentProject {project:Project;updatedAt:number;pinned:boolean;storage?:'indexeddb';preview?:string;}
const KEY='powerweb.recent-projects.v1',LIMIT=20;
export function readRecentProjects():RecentProject[]{
  try{
    const stored:unknown=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(stored))return [];
    const ids=new Set<string>();
    return stored.flatMap(entry=>{try{
      const project=validateProject(entry.project);if(ids.has(project.id)||!Number.isFinite(entry.updatedAt)||entry.updatedAt<0||entry.updatedAt>8.64e15)return [];
      ids.add(project.id);return [{project,updatedAt:entry.updatedAt,pinned:entry.pinned===true,...(entry.storage==='indexeddb'?{storage:'indexeddb' as const}:{}),...(typeof entry.preview==='string'&&entry.preview.startsWith('data:image/png;')?{preview:entry.preview}:{})}];
    }catch{return [];}}).slice(0,LIMIT).sort((a,b)=>b.updatedAt-a.updatedAt);
  }catch{return [];}
}
function write(entries:RecentProject[]):boolean{
  try{localStorage.setItem(KEY,JSON.stringify(entries));window.dispatchEvent(new Event('powerweb:recent-projects-changed'));return true;}catch{return false;}
}
const summary=(project:Project):Project=>({id:project.id,name:project.name,activePageId:project.activePageId,pages:project.pages.map(page=>({id:page.id,name:page.name,width:page.width,height:page.height,backgroundColor:page.backgroundColor,layers:page.layers.map(layer=>({id:layer.id,name:layer.name,visible:layer.visible,locked:layer.locked,elements:[]}))}))});
let queue=Promise.resolve(true);
/** Large project snapshots use IndexedDB; the start-screen index only contains metadata and a PNG. */
export function rememberProject(project:Project):Promise<boolean>{
  const operation=async()=>{
    try{
      await putSnapshot('recent:'+project.id,project);
      let preview=cachedPreview(project.id,project);
      if(!preview){try{const png=await createProjectPreview(project,new Map(),new Map());const {dataUrl}=await import('./projectContainer/assets');preview=dataUrl(png,'image/png');rememberPreview(project,preview);}catch{}}
      const entries=readRecentProjects(),previous=entries.find(entry=>entry.project.id===project.id);
      const next:RecentProject[]=[{project:summary(project),storage:'indexeddb',preview,updatedAt:Date.now(),pinned:previous?.pinned||false},...entries.filter(entry=>entry.project.id!==project.id)];
      const kept=[...next.filter(entry=>entry.pinned),...next.filter(entry=>!entry.pinned)].slice(0,LIMIT);
      // Migrate legacy localStorage snapshots before replacing their full document with metadata.
      for(const entry of kept)if(entry.storage!=='indexeddb'){await putSnapshot('recent:'+entry.project.id,entry.project);entry.project=summary(entry.project);entry.storage='indexeddb';}
      if(!kept.some(entry=>entry.project.id===project.id))return false;
      const written=write(kept);
      if(written)for(const entry of entries)if(!kept.some(item=>item.project.id===entry.project.id))void deleteSnapshot('recent:'+entry.project.id).catch(()=>{});
      return written;
    }catch{return false;}
  };
  queue=queue.then(operation,operation);return queue;
}
export async function loadRecentProject(id:string):Promise<Project>{
  const entry=readRecentProjects().find(entry=>entry.project.id===id);if(!entry)throw new Error('Локальная копия проекта недоступна. Откройте файл .pwb.');
  const snapshot=entry.storage==='indexeddb'?await getSnapshot('recent:'+id):entry.project;
  if(!snapshot)throw new Error('Локальная копия была удалена. Откройте файл .pwb.');
  const project=validateProject(snapshot);rememberPreview(project,entry.preview);return project;
}
export const pinRecentProject=(id:string)=>write(readRecentProjects().map(entry=>entry.project.id===id?{...entry,pinned:!entry.pinned}:entry));
export function removeRecentProject(id:string):boolean{
  const removed=write(readRecentProjects().filter(entry=>entry.project.id!==id));if(removed)void deleteSnapshot('recent:'+id).catch(()=>{});return removed;
}
