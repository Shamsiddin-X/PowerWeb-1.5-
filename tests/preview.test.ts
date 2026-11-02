import { createProjectFromTemplate } from '../utils/projectTemplates';
import { useEditorStore } from '../store/useEditorStore';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportTree } from '../codegen/tree';
import { PowerWebCodeGenerator } from '../codegen/htmlCssJsGenerator';
import { preparePreviewResources } from '../services/previewResources';
import { previewProject } from '../services/fileService';
import { safeUrl } from '../codegen/safety';
import { DEFAULT_STYLE, Project } from '../types';
import { SHADER_PRESETS } from '../utils/shaderPresets';
import { startShader } from '../utils/shaderRenderer.js';
const project = (): Project => ({id:'project',name:'Preview',activePageId:'page',pages:[{id:'page',name:'Page',width:1200,height:800,backgroundColor:'#fff',layers:[{id:'layer',name:'Layer',visible:true,locked:false,shader:SHADER_PRESETS[0].config,elements:[{id:'picture',type:'image',x:150,y:155,width:490,height:500,style:{...DEFAULT_STYLE},content:'data:image/png;base64,AA=='}]}]}]});

test('canvas preview keeps design geometry and omits mobile reflow while exports remain responsive', () => {
  const source=project(),before=structuredClone(source),preview=buildExportTree(source,{layout:'canvas'});
  const viewport=preview.pages[0].node,design=viewport.children[0] as any,layer=design.children[0],picture=layer.children.find((node:any)=>node.attributes.id==='picture');
  assert.equal(viewport.styles.aspectRatio,'1200 / 800');
  assert.equal(design.styles.width,'1200px');assert.equal(design.styles.height,'800px');
  assert.equal(picture.styles.top,'155px');assert.equal(picture.styles.height,'500px');
  assert.equal(picture.mobile,undefined);assert.equal(layer.mobile,undefined);
  assert.equal((buildExportTree(source).pages[0].node.children[0] as any).mobile.display,'flex');
  const output=new PowerWebCodeGenerator(source,{layout:'canvas'}).generate();
  assert.match(output.js,/ResizeObserver/);assert.doesNotThrow(()=>new Function(output.js));
  assert.match(output.htmlBody,/data-pwb-design-width="1200"/);assert.match(output.htmlBody,/data:image\/png/);
  assert.deepEqual(source,before);
});

test('preview embeds shared blob media, nested media, fonts and CSS backgrounds without modifying the document', async () => {
  const source=project(),url=URL.createObjectURL(new Blob(['pixels'],{type:'image/png'}));
  try {
    const picture=source.pages[0].layers[0].elements[0];picture.content=url;picture.style.fill=`url("${url}")`;
    source.pages[0].layers[0].elements.push({...picture,id:'group',type:'group',elements:[{...picture,id:'nested'}]});
    source.pages[0].layers[0].elements.push({...picture,id:'label',type:'text',content:'blob:plain-text'});
    source.fonts=[{id:'font',family:'Test',source:url}];
    const before=structuredClone(source),snapshot=await preparePreviewResources(source),embedded=snapshot.pages[0].layers[0].elements[0].content!;
    assert.equal(embedded,'data:image/png;base64,cGl4ZWxz');
    assert.equal(snapshot.pages[0].layers[0].elements[1].elements![0].content,embedded);
    assert.equal(snapshot.fonts![0].source,embedded);assert.equal(snapshot.pages[0].layers[0].elements[0].style.fill,`url("${embedded}")`);
    assert.equal(snapshot.pages[0].layers[0].elements[2].content,'blob:plain-text');assert.deepEqual(source,before);
  } finally { URL.revokeObjectURL(url); }
});

test('browser preview reserves its window before asynchronous media preparation and emits one fitted document', async () => {
  const old=(globalThis as any).window;let html='',opened=false;
  (globalThis as any).window={open:()=>{opened=true;return {opener:{},document:{write:(value:string)=>{html=value;},close:()=>{}},close:()=>{}};}};
  try {
    const pending=previewProject(project());assert.equal(opened,true);await pending;
    assert.equal((html.match(/<!DOCTYPE html>/g)||[]).length,1);assert.match(html,/data-pwb-design-width/);
  } finally { if(old===undefined)delete (globalThis as any).window;else (globalThis as any).window=old; }
});

test('encoded SVG images remain valid media URLs while executable schemes stay blocked', () => {
  const svg='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>');
  assert.equal(safeUrl(svg,true),svg);assert.equal(safeUrl('javascript:alert(1)',true),'');assert.equal(safeUrl('data:text/html,<script/>',true),'');
});

function surfaceUniform(width:number,height:number,zoom:number,page=true,legacy=false){
  const saved=new Map<string,PropertyDescriptor|undefined>();
  const set=(key:string,value:any)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
  const values:Record<string,any>={};let frame:((time:number)=>void)|undefined;
  const gl:any=new Proxy({LINK_STATUS:1,COMPILE_STATUS:2,ACTIVE_UNIFORMS:3,MAX_TEXTURE_SIZE:4,
    getProgramParameter:(_:unknown,key:number)=>key===3?0:true,getShaderParameter:()=>true,getParameter:()=>4096,
    getUniformLocation:(_:unknown,name:string)=>name==='u_source'||name.startsWith('u_clicks')||legacy&&name==='u_surfaceSize'?null:name,
    getAttribLocation:()=>-1,uniform2f:(name:string,x:number,y:number)=>{values[name]=[x,y];},uniform1f:(name:string,v:number)=>{values[name]=v;},
  },{get:(target,key)=>key in target?(target as any)[key]:(()=>({}))});
  const surface=new EventTarget();
  const canvas:any=Object.assign(new EventTarget(),{getContext:()=>gl,parentElement:surface,dataset:{pwbShaderInput:page?'page':undefined,pwbShaderWidth:'1200',pwbShaderHeight:'800'},style:{},clientWidth:width,clientHeight:height,getClientRects:()=>[{}],getBoundingClientRect:()=>({left:0,top:0,right:width*zoom,bottom:height*zoom,width:width*zoom,height:height*zoom}),closest:()=>surface});
  try {
    set('window',new EventTarget());set('document',Object.assign(new EventTarget(),{hidden:false,createElement:()=>({})}));
    set('devicePixelRatio',2);set('innerWidth',10000);set('innerHeight',10000);set('requestAnimationFrame',(next:any)=>{frame=next;return 1;});set('cancelAnimationFrame',()=>{});
    const effect=startShader(canvas,{...SHADER_PRESETS[0].config,animated:false,interaction:'none'});frame!(0);effect!.dispose();return values;
  } finally {for(const [key,descriptor] of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key];}
}

test('page shaders fit equal proportions at different page sizes and editor zoom levels', () => {
  const full=surfaceUniform(1200,800,1),small=surfaceUniform(600,400,0.5),portrait=surfaceUniform(400,800,1);
  assert.deepEqual(full.u_surfaceSize,[1620,1080]);assert.deepEqual(small.u_surfaceSize,full.u_surfaceSize);
  assert.deepEqual(portrait.u_surfaceSize,[540,1080]);assert.deepEqual(surfaceUniform(1200,800,0.4).u_surfaceSize,full.u_surfaceSize);
  assert.deepEqual(surfaceUniform(600,400,1,false).u_surfaceSize,[1200,800]);
  assert.equal(surfaceUniform(1200,800,1,true,true).u_scale,surfaceUniform(600,400,1,true,true).u_scale);
});


test('new blank projects and added pages use Full HD while loaded page sizes remain intact', () => {
  const initial=useEditorStore.getState().project.pages[0];
  assert.equal(initial.width,1920);assert.equal(initial.height,1080);
  const blank=createProjectFromTemplate('blank','ru');
  assert.equal(blank.pages[0].width,1920);assert.equal(blank.pages[0].height,1080);
  const previous=project();useEditorStore.getState().loadProject(previous);
  useEditorStore.getState().addPage();
  const pages=useEditorStore.getState().project.pages;
  assert.equal(pages[0].width,1200);assert.equal(pages[0].height,800);
  assert.equal(pages[1].width,1920);assert.equal(pages[1].height,1080);
});
