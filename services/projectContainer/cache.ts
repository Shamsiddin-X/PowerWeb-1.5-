import { Project } from '../../types';
const previews=new Map<string,{project:Project;preview:string}>();
export const rememberPreview=(project:Project,preview?:string)=>{if(preview){previews.delete(project.id);previews.set(project.id,{project,preview});if(previews.size>20)previews.delete(previews.keys().next().value!);}};
export const cachedPreview=(id:string,project?:Project)=>{const entry=previews.get(id);return entry&&(!project||entry.project===project)?entry.preview:undefined;};
