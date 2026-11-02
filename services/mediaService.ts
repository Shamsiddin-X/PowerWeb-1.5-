import { isTauri } from './platform';
export type MediaKind='image'|'video';
export interface ImportedMedia {kind:MediaKind;content:string;name:string;width:number;height:number;mime:string;}
const IMAGE_TYPES:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml',bmp:'image/bmp',ico:'image/x-icon'};
const VIDEO_TYPES:Record<string,string>={mp4:'video/mp4',webm:'video/webm',ogv:'video/ogg',ogg:'video/ogg',mov:'video/quicktime',m4v:'video/x-m4v'};
function mediaType(name:string,mime=''):{kind:MediaKind;mime:string}|null {
  const extension=name.split('.').pop()?.toLowerCase()||'';
  if(Object.values(IMAGE_TYPES).includes(mime))return {kind:'image',mime};
  if(Object.values(VIDEO_TYPES).includes(mime))return {kind:'video',mime};
  if(IMAGE_TYPES[extension])return {kind:'image',mime:IMAGE_TYPES[extension]};
  if(VIDEO_TYPES[extension])return {kind:'video',mime:VIDEO_TYPES[extension]};
  return null;
}
/** A native desktop picker; web builds use a hidden input behind the same custom buttons. */
export async function pickMediaFile(kind:MediaKind):Promise<File|null> {
  const extensions=Object.keys(kind==='image'?IMAGE_TYPES:VIDEO_TYPES);
  if(isTauri()){
    const {open}=await import('@tauri-apps/plugin-dialog');
    const path=await open({title:kind==='image'?'Выберите фото':'Выберите видео',multiple:false,directory:false,filters:[{name:kind==='image'?'Изображения':'Видео',extensions}]});
    if(typeof path!=='string')return null;
    const {readFile}=await import('@tauri-apps/plugin-fs');
    const bytes=await readFile(path);
    const name=path.split(/[\\/]/).pop()||'media';
    return new File([bytes],name,{type:mediaType(name)?.mime||''});
  }
  return new Promise((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.hidden=true;
    input.accept=[kind+'/*',...extensions.map(extension=>'.'+extension)].join(',');
    const finish=(file:File|null)=>{input.remove();resolve(file);};
    input.oncancel=()=>finish(null);input.onchange=()=>finish(input.files?.[0]||null);
    document.body.appendChild(input);
    try{input.click();}catch(error){input.remove();reject(error);}
  });
}
function readDataUrl(file:File):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Не удалось прочитать файл.'));
    reader.onerror=()=>reject(new Error('Не удалось прочитать файл «'+file.name+'».'));
    reader.onabort=()=>reject(new Error('Чтение файла прервано.'));
    reader.readAsDataURL(file);
  });
}
function dimensions(file:File,kind:MediaKind):Promise<{width:number;height:number}>{
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const node=kind==='image'?new Image():document.createElement('video');
    let settled=false;
    const finish=(error?:Error)=>{
      if(settled)return;settled=true;
      clearTimeout(timer);node.onload=null;node.onerror=null;
      const width=node instanceof HTMLVideoElement?node.videoWidth:node.naturalWidth;
      const height=node instanceof HTMLVideoElement?node.videoHeight:node.naturalHeight;
      if(node instanceof HTMLVideoElement){node.onloadedmetadata=null;node.pause();node.removeAttribute('src');node.load();}
      else node.removeAttribute('src');
      URL.revokeObjectURL(url);
      if(error)reject(error);
      else if(!width||!height)reject(new Error('Не удалось определить размер файла «'+file.name+'».'));
      else resolve({width,height});
    };
    const timer=setTimeout(()=>finish(new Error('Не удалось загрузить «'+file.name+'». Попробуйте другой файл.')),20000);
    node.onerror=()=>finish(new Error(kind==='video'?'Видео не удалось открыть. Попробуйте MP4 (H.264) или WebM.':'Изображение не удалось открыть. Попробуйте PNG, JPEG или WebP.'));
    if(node instanceof HTMLVideoElement){node.preload='metadata';node.muted=true;node.onloadedmetadata=()=>finish();}
    else node.onload=()=>finish();
    node.src=url;
  });
}
/** Embed the file, so PWB, undo and exported pages do not depend on a temporary blob URL. */
export async function importMediaFile(file:File,expected?:MediaKind):Promise<ImportedMedia>{
  const type=mediaType(file.name,file.type);
  if(!type||expected&&type.kind!==expected)throw new Error(expected==='video'?'Выберите файл видео.':expected==='image'?'Выберите файл изображения.':'Выберите фото или видео.');
  if(!file.size)throw new Error('Выбранный файл пуст.');
  const normalized=file.type===type.mime?file:new File([file],file.name,{type:type.mime});
  const [{width,height},content]=await Promise.all([dimensions(normalized,type.kind),readDataUrl(normalized)]);
  return {kind:type.kind,content,name:file.name,width,height,mime:type.mime};
}
