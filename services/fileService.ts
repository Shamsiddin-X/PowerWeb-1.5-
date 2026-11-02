import { Project } from '../types';
import { PowerWebCodeGenerator } from '../codegen/htmlCssJsGenerator';
import { isTauri } from './platform';
import { createPwbContainer, readPwbContainer, readPwbEntries } from './projectContainer/container';
import { rememberPreview } from './projectContainer/cache';
import { createExportPackage } from './exportService';
import { safeName } from './projectContainer/assets';
import { preparePreviewResources } from './previewResources';
const dialog=()=>import('@tauri-apps/plugin-dialog');
const fs=()=>import('@tauri-apps/plugin-fs');
const core=()=>import('@tauri-apps/api/core');
function download(bytes:Uint8Array,name:string,type:string){
  const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function destination(name:string,extension:string):Promise<string|null|undefined>{
  if(!isTauri())return undefined;
  const {save}=await dialog();return save({defaultPath:name,filters:[{name:extension==='pwb'?'PowerWeb Project':'ZIP Archive',extensions:[extension]}]});
}
async function write(bytes:Uint8Array,path:string|undefined,name:string,type:string){
  if(path){const {writeFile}=await fs();await writeFile(path,bytes);}else download(bytes,name,type);
}
export async function saveProject(project:Project):Promise<boolean>{
  const name=safeName(project.name,'project')+'.pwb',path=await destination(name,'pwb');if(path===null)return false;
  const container=await createPwbContainer(project);await write(container.bytes,path,name,'application/zip');rememberPreview(project,container.preview);return true;
}
async function browserFile():Promise<File|null>{
  return new Promise((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.accept='.pwb';input.hidden=true;
    const finish=(file:File|null)=>{input.remove();resolve(file);};input.oncancel=()=>finish(null);input.onchange=()=>finish(input.files?.[0]||null);document.body.appendChild(input);
    try{input.click();}catch(error){input.remove();reject(error);}
  });
}
export async function readProjectFile(path:string):Promise<Project>{
  const {readFile}=await fs(),bytes=await readFile(path);
  try{const result=await readPwbContainer(bytes);rememberPreview(result.project,result.preview);return result.project;}
  catch(error){
    // Older Linux WebViews may not implement DecompressionStream(deflate-raw).
    if(!(error instanceof Error)||!error.message.includes('WebView'))throw error;
    const {invoke}=await core();
    const entries=await invoke<{path:string;data:string}[]>('read_project_archive',{path});
    const files=new Map(entries.map(entry=>[entry.path,Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0))]));
    const result=await readPwbEntries(files);rememberPreview(result.project,result.preview);return result.project;
  }
}
export async function openProject():Promise<Project|null>{
  if(isTauri()){
    const {open}=await dialog();const path=await open({multiple:false,filters:[{name:'PowerWeb Project',extensions:['pwb']}]});
    return typeof path==='string'?readProjectFile(path):null;
  }
  const file=await browserFile();if(!file)return null;
  const result=await readPwbContainer(new Uint8Array(await file.arrayBuffer()));rememberPreview(result.project,result.preview);return result.project;
}
export async function exportProject(project:Project):Promise<void>{
  const name=safeName(project.name,'website')+'.zip',path=await destination(name,'zip');if(path===null)return;
  const bundle=await createExportPackage(project,'html');await write(bundle.bytes,path,name,'application/zip');
}
export async function exportReactProject(project:Project):Promise<void>{
  const name=safeName(project.name,'website')+'-react.zip',path=await destination(name,'zip');if(path===null)return;
  const bundle=await createExportPackage(project,'react');await write(bundle.bytes,path,name,'application/zip');
}
export async function previewProject(project:Project):Promise<void>{
  // Reserve the browser window during the click, before embedding temporary media.
  const native=isTauri(),popup=native?null:window.open();
  if(!native&&!popup)throw new Error('Разрешите открытие окна предпросмотра.');
  if(popup)popup.opener=null;
  try{
    const snapshot=await preparePreviewResources(project);
    const {html}=new PowerWebCodeGenerator(snapshot,{layout:'canvas'}).generate();
    if(native){const {invoke}=await core();await invoke('preview_html',{html});}
    else{popup!.document.write(html);popup!.document.close();}
  }catch(error){popup?.close();throw error;}
}
export async function openPluginsFolder():Promise<void>{
  if(isTauri()){const {invoke}=await core();await invoke('open_plugins_folder');}
  else throw new Error('Папка плагинов доступна в настольной версии.');
}
