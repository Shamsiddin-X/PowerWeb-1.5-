import { isTauri } from './platform';
import { ProjectFont } from '../types';
import { generateId } from '../utils/ids';
import { dataUrl } from './projectContainer/assets';
export async function pickProjectFont():Promise<ProjectFont|null>{
  const mimes:Record<string,string>={woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf',otf:'font/otf'};
  let file:File|null;
  if(isTauri()){
    const {open}=await import('@tauri-apps/plugin-dialog');const path=await open({multiple:false,filters:[{name:'Fonts',extensions:Object.keys(mimes)}]});if(typeof path!=='string')return null;
    const {readFile}=await import('@tauri-apps/plugin-fs');const bytes=await readFile(path);file=new File([bytes],path.split(/[\\/]/).pop()||'font.woff2');
  }else file=await new Promise<File|null>((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.accept='.woff2,.woff,.ttf,.otf';input.hidden=true;const finish=(value:File|null)=>{input.remove();resolve(value);};input.oncancel=()=>finish(null);input.onchange=()=>finish(input.files?.[0]||null);document.body.appendChild(input);try{input.click();}catch(error){input.remove();reject(error);}
  });
  if(!file)return null;
  const extension=file.name.split('.').pop()?.toLowerCase()||'';if(!mimes[extension]||!file.size)throw new Error('Выберите шрифт WOFF2, WOFF, TTF или OTF.');
  const family=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()||'Custom font';
  const source=dataUrl(new Uint8Array(await file.arrayBuffer()),mimes[extension]);
  await new FontFace(family,`url("${source}")`).load();
  return {id:generateId(),family,source,weight:'normal',style:'normal'};
}
