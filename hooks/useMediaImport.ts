import { useCallback, useRef, useState } from 'react';
import { CanvasElement } from '../types';
import { createNewElement } from '../utils/elementFactory';
import { canvasMetrics, canvasPoint } from '../utils/canvasCoordinates';
import { useEditorStore } from '../store/useEditorStore';
import { ImportedMedia, MediaKind, importMediaFile, pickMediaFile } from '../services/mediaService';
interface Destination {projectId:string;pageId:string;layerId:string;}
function capture():Destination {
  const state=useEditorStore.getState();
  const page=state.project.pages.find(p=>p.id===state.project.activePageId);
  const layer=page?.layers.find(l=>l.id===state.activeLayerId);
  if(!page||!layer||layer.locked||!layer.visible)throw new Error('Выберите видимый незаблокированный слой.');
  return {projectId:state.project.id,pageId:page.id,layerId:layer.id};
}
function currentDestination(destination:Destination){
  const state=useEditorStore.getState();
  if(state.showStartScreen||state.project.id!==destination.projectId||state.project.activePageId!==destination.pageId||state.activeLayerId!==destination.layerId)return null;
  const page=state.project.pages.find(p=>p.id===destination.pageId);
  const layer=page?.layers.find(l=>l.id===destination.layerId);
  return page&&layer&&layer.visible&&!layer.locked?{state,page,layer}:null;
}
function addMedia(media:ImportedMedia,destination:Destination,point?:{x:number;y:number}){
  const current=currentDestination(destination);if(!current)return;
  const {state,page}=current;
  const viewport=document.querySelector<HTMLElement>('[data-canvas-viewport]');
  const canvas=viewport?.querySelector<HTMLElement>('[data-shader-page]');
  const metrics=canvasMetrics(canvas||null,state.scale);
  let center={x:page.width/2,y:page.height/2},available={width:page.width,height:page.height};
  if(viewport&&canvas&&metrics){
    const view=viewport.getBoundingClientRect(),bounds=canvas.getBoundingClientRect();
    const left=Math.max(view.left,bounds.left),right=Math.min(view.right,bounds.right);
    const top=Math.max(view.top,bounds.top),bottom=Math.min(view.bottom,bounds.bottom);
    if(right>left&&bottom>top){
      center=canvasPoint((left+right)/2,(top+bottom)/2,metrics);
      available={width:(right-left)/metrics.scaleX,height:(bottom-top)/metrics.scaleY};
    }
  }
  // Keep the full frame and its aspect ratio; don't upscale small files.
  const fit=Math.min(1,page.width*0.7/media.width,page.height*0.7/media.height,available.width*0.85/media.width,available.height*0.85/media.height);
  const width=media.width*fit,height=media.height*fit;
  const x=Math.max(0,Math.min(point?.x??center.x-width/2,page.width-width));
  const y=Math.max(0,Math.min(point?.y??center.y-height/2,page.height-height));
  const element=createNewElement(media.kind,x,y,width,height);
  element.content=media.content;
  element.attributes={'data-media-name':media.name,...(media.kind==='image'?{alt:media.name}:{})};
  state.commitTransaction();state.addElement(element);
}
export function useMediaImport(){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const working=useRef(false);
  const perform=useCallback(async(operation:()=>Promise<void>)=>{
    if(working.current)return;working.current=true;setBusy(true);setError('');
    try{await operation();}catch(cause){setError(cause instanceof Error?cause.message:'Не удалось добавить файл.');}
    finally{working.current=false;setBusy(false);}
  },[]);
  const pickAndInsert=useCallback((kind:MediaKind)=>perform(async()=>{
    const destination=capture();
    const file=await pickMediaFile(kind);if(!file)return;
    const media=await importMediaFile(file,kind);addMedia(media,destination);
  }),[perform]);
  const insertFile=useCallback((file:File,point:{x:number;y:number})=>perform(async()=>{
    const destination=capture();const media=await importMediaFile(file);addMedia(media,destination,point);
  }),[perform]);
  const replaceFile=useCallback((element:CanvasElement)=>perform(async()=>{
    if(element.type!=='image'&&element.type!=='video')return;
    const destination=capture();
    const file=await pickMediaFile(element.type);if(!file)return;
    const media=await importMediaFile(file,element.type);
    const current=currentDestination(destination);
    const original=current?.layer.elements.find(e=>e.id===element.id);
    if(!current||!original||original.type!==media.kind||!current.state.selectedElementIds.includes(element.id))return;
    current.state.commitTransaction();
    current.state.updateSpecificElement(element.id,{content:media.content,attributes:{...original.attributes,'data-media-name':media.name,...(media.kind==='image'?{alt:media.name}:{})}});
  }),[perform]);
  return {busy,error,dismissError:()=>setError(''),pickAndInsert,insertFile,replaceFile};
}
