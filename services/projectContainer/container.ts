import { Project } from '../../types';
import { isShaderConfig } from '../../types/shaders';
import { parsePWB, validateProject, PROJECT_VERSION } from '../../utils/fileFormat';
import { ArchiveFiles, archivePath, crc32, createZip, readZip, textOf, utf8 } from '../../utils/zipArchive';
import { AssetRecord, collectResources, contentHash, dataUrl } from './assets';
import { createProjectPreview } from './preview';
export interface PwbManifest {
  signature:'POWERWEB_CONTAINER';formatVersion:'2.0.0';appVersion:string;projectId:string;name:string;savedAt:string;
  pages:{id:string;name:string}[];assets:AssetRecord[];shaders:{path:string;name:string}[];preview:'preview.png';
}
export async function createPwbContainer(input:Project):Promise<{bytes:Uint8Array;preview:string}>{
  const source=validateProject(input),collected=await collectResources(source);
  const {project,files,assets,shaders}=collected;
  const preview=await createProjectPreview(project,files,new Map(assets.map(asset=>[asset.path,asset.mime])));
  const manifest:PwbManifest={signature:'POWERWEB_CONTAINER',formatVersion:'2.0.0',appVersion:PROJECT_VERSION,projectId:project.id,name:project.name,savedAt:new Date().toISOString(),pages:project.pages.map(page=>({id:page.id,name:page.name})),assets,shaders,preview:'preview.png'};
  const manifestData=utf8(JSON.stringify(manifest,null,2)+'\n'),projectData=utf8(JSON.stringify(project,null,2)+'\n');
  if(manifestData.length>4*1024*1024||projectData.length>32*1024*1024)throw new Error('Описание проекта превышает лимит контейнера PWB.');
  files.set('manifest.json',manifestData);files.set('project.json',projectData);files.set('preview.png',preview);
  for(const path of ['assets/','assets/images/','assets/video/','assets/fonts/','shaders/'])files.set(path,new Uint8Array());
  return {bytes:createZip(files),preview:dataUrl(preview,'image/png')};
}
export async function readPwbContainer(bytes:Uint8Array):Promise<{project:Project;preview?:string}>{
  if(bytes[0]!==0x50||bytes[1]!==0x4b){const project=parsePWB(textOf(bytes));if(!project)throw new Error('Неверный или повреждённый проект PowerWeb.');return {project};}
  return readPwbEntries(await readZip(bytes));
}
export async function readPwbEntries(files:ArchiveFiles):Promise<{project:Project;preview?:string}>{
  const manifestBytes=files.get('manifest.json'),projectBytes=files.get('project.json');
  if(!manifestBytes||!projectBytes||manifestBytes.length>4*1024*1024||projectBytes.length>32*1024*1024)throw new Error('В контейнере нет корректных manifest.json и project.json.');
  const manifest=JSON.parse(textOf(manifestBytes));
  if(!manifest||manifest.signature!=='POWERWEB_CONTAINER'||String(manifest.formatVersion).split('.')[0]!=='2'||!Array.isArray(manifest.assets)||!Array.isArray(manifest.pages)||!Array.isArray(manifest.shaders))throw new Error('Версия или структура контейнера PWB не поддерживается.');
  const resources=new Map<string,string>();
  for(const asset of manifest.assets){
    if(!asset||typeof asset.path!=='string'||!/^assets\/(images|video|fonts)\//.test(asset.path)||typeof asset.mime!=='string'||!/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(asset.mime)||typeof asset.hash!=='string'||!Number.isSafeInteger(asset.size)||asset.size<0||asset.hashAlgorithm!==undefined&&!['sha256','crc32'].includes(asset.hashAlgorithm))throw new Error('Повреждён список ресурсов PWB.');
    const path=archivePath(asset.path),data=files.get(path);const hash=data?(asset.hashAlgorithm==='crc32'||asset.hash.includes('-')?crc32(data).toString(16).padStart(8,'0')+'-'+data.length.toString(16):await contentHash(data)):'';if(resources.has(path)||!data||data.length!==asset.size||hash!==asset.hash)throw new Error('Повреждён ресурс: '+path);
    resources.set(path,dataUrl(data,asset.mime));
  }
  const shaders=new Map<string,unknown>();
  for(const entry of manifest.shaders){
    if(!entry||typeof entry.path!=='string'||!entry.path.startsWith('shaders/')||!entry.path.endsWith('.pws')||shaders.has(entry.path))throw new Error('Повреждён список шейдеров PWB.');
    const path=archivePath(entry.path),data=files.get(path);if(!data||data.length>100000)throw new Error('Нет шейдера: '+path);
    const config=JSON.parse(textOf(data)).shader;if(!isShaderConfig(config))throw new Error('Повреждён шейдер: '+path);shaders.set(path,config);
  }
  const restore=(value:any,field='',resource=false):any=>{
    if(typeof value==='string'){
      if(resource){if(resources.has(value))return resources.get(value);if(value.startsWith('assets/'))throw new Error('Не найден ресурс: '+value);}
      if(['fill','background','backgroundColor','backgroundImage'].includes(field))return value.replace(/url\(\s*(['"]?)(assets\/[^'"\)]+)\1\s*\)/g,(_match,_quote,path)=>{const source=resources.get(path);if(!source)throw new Error('Не найден ресурс: '+path);return `url("${source}")`;});
      return value;
    }
    if(Array.isArray(value))return value.map(item=>restore(item,field));
    if(value&&typeof value==='object'){
      if(field==='shader'&&typeof value.$ref==='string'){if(!shaders.has(value.$ref)||Object.keys(value).length!==1)throw new Error('Не найден шейдер: '+value.$ref);return structuredClone(shaders.get(value.$ref));}
      return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,restore(item,key,key==='content'&&['image','video'].includes(value.type)||key==='source'&&field==='fonts')]));
    }
    return value;
  };
  const project=validateProject(restore(JSON.parse(textOf(projectBytes))));
  if(project.id!==manifest.projectId||manifest.pages.length!==project.pages.length||project.pages.some((page,index)=>manifest.pages[index]?.id!==page.id))throw new Error('Манифест не соответствует проекту.');
  const preview=files.get('preview.png');
  return {project,preview:preview&&preview.length<4*1024*1024?dataUrl(preview,'image/png'):undefined};
}
