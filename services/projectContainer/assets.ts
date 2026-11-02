import { Project } from '../../types';
import { isShaderConfig } from '../../types/shaders';
import { ArchiveFiles, utf8 } from '../../utils/zipArchive';
import { sha256 } from '../../utils/contentDigest';
export interface AssetRecord {path:string;mime:string;size:number;hash:string;hashAlgorithm?:'sha256'|'crc32';}
export interface ShaderRecord {path:string;name:string;}
export interface CollectedResources {project:Project;files:ArchiveFiles;assets:AssetRecord[];shaders:ShaderRecord[];}
const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','image/svg+xml':'svg','image/avif':'avif','image/bmp':'bmp','image/x-icon':'ico','video/mp4':'mp4','video/webm':'webm','video/ogg':'ogv','video/quicktime':'mov','video/x-m4v':'m4v','font/woff2':'woff2','font/woff':'woff','font/ttf':'ttf','font/otf':'otf','application/font-woff':'woff','application/x-font-ttf':'ttf','application/vnd.ms-opentype':'otf'};
export function dataUrl(bytes:Uint8Array,mime:string):string{
  let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return `data:${mime};base64,${btoa(binary)}`;
}
export function decodeDataUrl(source:string):{bytes:Uint8Array;mime:string}{
  const match=source.match(/^data:([^,]*),(.*)$/s);if(!match)throw new Error('Повреждённый встроенный ресурс.');
  const mime=match[1].split(';')[0]||'application/octet-stream';
  const value=/;base64(?:;|$)/i.test(match[1])?atob(match[2].replace(/\s/g,'')):decodeURIComponent(match[2]);
  return {mime,bytes:/;base64(?:;|$)/i.test(match[1])?Uint8Array.from(value,c=>c.charCodeAt(0)):utf8(value)};
}
export async function contentHash(bytes:Uint8Array):Promise<string>{
  if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes));return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
  return sha256(bytes);
}
export const safeName=(value:string,fallback='file')=>value.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu,'-').replace(/^\.+/,'').slice(0,80)||fallback;
async function readResource(source:string){
  if(source.startsWith('data:'))return decodeDataUrl(source);
  if(!/^(https?:|blob:)/i.test(source))throw new Error('Ресурс недоступен: '+source);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
    const response=await fetch(source,{signal:controller.signal,credentials:'omit'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const blob=await response.blob();if(blob.size>1024*1024*1024)throw new Error('Файл превышает 1 ГБ.');
    return {bytes:new Uint8Array(await blob.arrayBuffer()),mime:blob.type.split(';')[0]||'application/octet-stream'};
  }catch{throw new Error('Не удалось включить ресурс в проект: '+source.slice(0,160)+'. Загрузите файл через проводник или используйте URL с разрешённым CORS.');}
  finally{clearTimeout(timer);}
}
/** Extract resources without touching the open editor document. Duplicate references share one file. */
export async function collectResources(project:Project,{shaders=true}:{shaders?:boolean}={}):Promise<CollectedResources>{
  const files:ArchiveFiles=new Map(),assets:AssetRecord[]=[],shaderRecords:ShaderRecord[]=[];
  const references=new Map<string,string>(),contents=new Map<string,string>();
  const add=async(source:string,kind:'images'|'video'|'fonts',name:string)=>{
    const known=references.get(source);if(known)return known;
    const {bytes,mime}=await readResource(source),hash=await contentHash(bytes);
    const contentKey=kind+':'+mime+':'+hash,duplicate=contents.get(contentKey);
    if(duplicate){const existing=files.get(duplicate)!;if(existing.length===bytes.length&&existing.every((byte,index)=>byte===bytes[index])){references.set(source,duplicate);return duplicate;}}
    const extension=extensions[mime]||name.split('.').pop()?.toLowerCase()||(kind==='video'?'mp4':kind==='fonts'?'woff2':'png');
    const base=safeName(name.replace(/\.[^.]+$/,''),kind==='fonts'?'font':kind==='video'?'video':'image');
    let path=`assets/${kind}/${base}-${hash.slice(0,12)}.${safeName(extension,'bin')}`;
    let suffix=1;while(files.has(path)){const existing=files.get(path)!;if(existing.length===bytes.length&&existing.every((byte,index)=>byte===bytes[index]))break;path=`assets/${kind}/${base}-${hash.slice(0,12)}-${suffix++}.${safeName(extension,'bin')}`;}
    if(!files.has(path)){files.set(path,bytes);assets.push({path,mime,size:bytes.length,hash,hashAlgorithm:hash.includes('-')?'crc32':'sha256'});}
    references.set(source,path);contents.set(contentKey,path);return path;
  };
  const walk=async(value:any,field=''):Promise<any>=>{
    if(Array.isArray(value)){const next=[];for(const item of value)next.push(await walk(item,field));return next;}
    if(value&&typeof value==='object'){
      if(shaders&&isShaderConfig(value)){
        const text=JSON.stringify({version:1,shader:value},null,2),bytes=utf8(text),hash=await contentHash(bytes);
        if(bytes.length>100000)throw new Error('Описание шейдера превышает лимит PWB: '+value.name);
        const path=`shaders/${safeName(value.name,'shader')}-${hash.slice(0,12)}.pws`;
        if(!files.has(path)){files.set(path,bytes);shaderRecords.push({path,name:value.name});}
        return {$ref:path};
      }
      const copy:any={};for(const [key,item] of Object.entries(value))copy[key]=await walk(item,key);
      if((value.type==='image'||value.type==='video')&&value.content){copy.content=await add(value.content,value.type==='video'?'video':'images',value.attributes?.['data-media-name']||value.attributes?.alt||value.type);}
      return copy;
    }
    if(typeof value==='string'&&['fill','background','backgroundColor','backgroundImage'].includes(field)&&value.includes('url(')){
      let result=value;
      const urls=[...value.matchAll(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/g)];
      for(const match of urls){if(/^(data:|https?:|blob:)/i.test(match[2]))result=result.replace(match[0],`url("${await add(match[2],'images','background')}")`);}
      return result;
    }
    return value;
  };
  const prepared=await walk(project) as Project;
  if(project.fonts)prepared.fonts=[];
  for(const font of project.fonts||[]){const path=await add(font.source,'fonts',font.family+'.'+(font.source.split(/[.?]/).pop()||'woff2'));prepared.fonts!.push({...font,source:path});}
  return {project:prepared,files,assets,shaders:shaderRecords};
}
