import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasElementRenderer } from '../components/canvas/CanvasElement';
import { ShaderSettings } from '../components/shaders/ShaderSettings';
import { startClickAnimations } from '../codegen/clickAnimations.js';
import { startShader } from '../utils/shaderRenderer.js';
import { SHADER_PRESETS } from '../utils/shaderPresets';
import { DEFAULT_STYLE, CanvasElement, Animation, Project } from '../types';
import { buildExportTree } from '../codegen/tree';
import { PowerWebCodeGenerator } from '../codegen/htmlCssJsGenerator';
import { parsePWB, serializePWB } from '../utils/fileFormat';

const animation=(trigger:Animation['trigger'],name='pulse',id=trigger):Animation=>({id,name,trigger,duration:1,delay:0,easing:'linear',iterationCount:1});
const text=(animations:Animation[]):CanvasElement=>({id:'text',type:'text',x:50,y:50,width:300,height:90,content:'Animated text',style:{...DEFAULT_STYLE},animations});
const project=(elements:CanvasElement[]):Project=>({id:'project',name:'Test',activePageId:'page',pages:[{id:'page',name:'Home',width:1920,height:1080,backgroundColor:'#ffffff',layers:[{id:'first',name:'First',visible:true,locked:false,elements}]}]});

test('a single text effect has its own animation surface and keeps resize handles outside it',()=>{
  const html=renderToStaticMarkup(React.createElement(CanvasElementRenderer,{element:text([animation('onLoad')]),isSelected:true,scale:1}));
  assert.match(html,/data-pwb-animation-layer="0"/);assert.match(html,/data-pwb-animation-id="onLoad"/);
  assert.match(html,/data-animations=/);assert.match(html,/Animated text/);
});

class FakeElement extends EventTarget {
  style={animation:''};
  dataset:Record<string,string>={};
  layers:FakeElement[]=[];
  matches(){return true;}
  closest(){return this;}
  querySelectorAll(){return [];}
  querySelector(selector:string){return this.layers[Number(selector.match(/"(\d+)"/)![1])];}
  get offsetWidth(){return 300;}
}

test('text load, hover, click and scroll effects run independently and clean up on unmount',()=>{
  const node=new FakeElement(),triggers=['onLoad','onHover','onClick','onScroll'] as const;
  node.layers=triggers.map(()=>new FakeElement());node.dataset.animations=JSON.stringify(triggers.map(trigger=>animation(trigger)));
  const old=(globalThis as any).IntersectionObserver;let intersect:Function=()=>{};let disconnected=0;
  (globalThis as any).IntersectionObserver=class {constructor(callback:Function){intersect=callback;}observe(){}disconnect(){disconnected++;}};
  try{
    const stop=startClickAnimations(node as any,{editor:true});
    assert.match(node.layers[0].style.animation,/pulse 1s/);assert.equal(node.layers[1].style.animation,'');
    node.dispatchEvent(new Event('mouseenter'));assert.match(node.layers[1].style.animation,/pulse 1s/);
    node.dispatchEvent(new Event('click'));assert.match(node.layers[2].style.animation,/pulse 1s/);assert.match(node.layers[0].style.animation,/pulse/);
    node.dispatchEvent(new Event('mouseleave'));assert.equal(node.layers[1].style.animation,'');assert.match(node.layers[2].style.animation,/pulse/);
    intersect([{isIntersecting:true}]);assert.match(node.layers[3].style.animation,/pulse/);
    stop();node.layers.forEach(layer=>assert.equal(layer.style.animation,''));assert.ok(disconnected>=1);
    node.dispatchEvent(new Event('click'));assert.equal(node.layers[2].style.animation,'');
  }finally{if(old===undefined)delete (globalThis as any).IntersectionObserver;else (globalThis as any).IntersectionObserver=old;}
});

test('exports preserve click/scroll text effects and explicit interaction bounds',()=>{
  const p=project([text([animation('onClick'),animation('onScroll','fadeIn')])]);
  const tree=buildExportTree(p,{layout:'canvas'}),viewport=tree.pages[0].node,design=viewport.children[0] as any,element=design.children[0].children[0];
  assert.equal(element.styles.pointerEvents,'auto');assert.equal(tree.usesClickAnimations,true);
  assert.match(String(element.attributes['data-animations']),/onScroll/);
  const output=new PowerWebCodeGenerator(p,{layout:'canvas'}).generate();
  assert.match(output.js,/IntersectionObserver/);assert.doesNotThrow(()=>new Function(output.js));
});

test('background pattern size is directly adjustable even for legacy shaders without u_size',()=>{
  const shader={...SHADER_PRESETS[0].config,fragment:'precision mediump float; uniform float u_scale; void main(){gl_FragColor=vec4(u_scale);}'};
  const html=renderToStaticMarkup(React.createElement(ShaderSettings,{shader,onChange:()=>{},onReset:()=>{}}));
  assert.match(html,/Размер узора/);assert.match(html,/Меньше значение/);
});

test('image/video frame fitting is consistent in editor, export and saved files',()=>{
  const media=['image','video'].map((type,i)=>({...text([]),id:'media'+i,type,content:'data:'+ (type==='image'?'image/png':'video/mp4')+';base64,AA=='} as CanvasElement));
  const p=project(media);
  for(const element of media){
    const html=renderToStaticMarkup(React.createElement(CanvasElementRenderer,{element,isSelected:false,scale:1}));
    assert.match(html,/object-fit:fill/);
  }
  const tree=buildExportTree(p),layer=tree.pages[0].node.children[0] as any;
  layer.children.forEach((node:any)=>assert.equal(node.styles.objectFit,'fill'));
  p.pages[0].layers[0].elements[0].style.objectFit='contain';
  assert.equal(parsePWB(serializePWB(p))!.pages[0].layers[0].elements[0].style.objectFit,'contain');
});

function rendererHarness(media=false,fit='fill',video=false){
  const saved=new Map<string,PropertyDescriptor|undefined>();
  const set=(key:string,value:any)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
  const values:Record<string,any>={},draws:any[]=[],uploads:any[]=[];let next:Function=()=>{};
  let width=320,height=160;
  class ImageNode extends EventTarget{style={opacity:''};complete=true;naturalWidth=1920;naturalHeight=1080;currentSrc='data:image/png;base64,AA==';}
  class VideoNode extends EventTarget{style={opacity:''};readyState=4;videoWidth=1920;videoHeight=1080;currentSrc='data:video/mp4;base64,AA==';currentTime=0;controls=false;}
  const source=video?new VideoNode():new ImageNode();
  const raster:any={width:0,height:0,getContext:()=>({drawImage:(...args:any[])=>draws.push(args)})};
  const page=new EventTarget(),surface=new EventTarget();
  const gl:any=new Proxy({LINK_STATUS:1,COMPILE_STATUS:2,ACTIVE_UNIFORMS:3,MAX_TEXTURE_SIZE:4,
    getProgramParameter:(_:any,key:number)=>key===3?0:true,getShaderParameter:()=>true,getParameter:()=>4096,
    getUniformLocation:(_:any,name:string)=>(name==='u_source'&&!media)||name.startsWith('u_clicks')?null:name,
    getAttribLocation:()=>-1,uniform2f:(name:string,...args:any[])=>values[name]=args,uniform2fv:(name:string,args:any[])=>values[name]=[...args],
    uniform1f:(name:string,value:number)=>values[name]=value,texImage2D:(...args:any[])=>uploads.push({width:args.at(-1).width,height:args.at(-1).height}),
  },{get:(target,key)=>key in target?(target as any)[key]:()=>({})});
  const canvas:any=Object.assign(new EventTarget(),{getContext:()=>gl,parentElement:{querySelector:()=>media?source:null},dataset:{pwbShaderWidth:'320',pwbShaderHeight:'160'},
    style:{},getClientRects:()=>[{}],getBoundingClientRect:()=>({left:0,top:0,right:width,bottom:height,width,height}),closest:(selector:string)=>selector==='[data-shader-page]'?page:surface});
  try{
    set('window',new EventTarget());set('document',Object.assign(new EventTarget(),{hidden:false,createElement:()=>raster}));
    set('HTMLImageElement',ImageNode);set('HTMLVideoElement',VideoNode);set('getComputedStyle',()=>({objectFit:fit}));
    set('innerWidth',10000);set('innerHeight',10000);set('devicePixelRatio',1);
    set('requestAnimationFrame',(callback:Function)=>{next=callback;return 1;});set('cancelAnimationFrame',()=>{});
    const shader={...SHADER_PRESETS.find(p=>p.id==='media-prism')!.config,response:0,interaction:'pointer'};
    const effect=startShader(canvas,shader);assert.ok(effect);
    return {values,draws,uploads,source,canvas,page,frame:(time:number)=>next(time),resize:(w:number,h:number)=>{width=w;height=h;},
      close:()=>{effect!.dispose();for(const [key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key];}};
  }catch(error){for(const [key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key];throw error;}
}

test('photo texture resolution follows displayed size in both directions using the original pixels',()=>{
  const h=rendererHarness(true);
  try{
    h.frame(100);assert.deepEqual(h.uploads.at(-1),{width:320,height:160});
    assert.deepEqual(h.draws.at(-1).slice(1),[0,0,320,160]);
    h.resize(80,40);h.frame(200);assert.deepEqual(h.uploads.at(-1),{width:80,height:40});
    h.resize(640,320);h.frame(300);assert.deepEqual(h.uploads.at(-1),{width:640,height:320});
    assert.equal(h.draws.at(-1)[0],h.source);assert.equal((h.source as any).naturalWidth,1920);
    assert.deepEqual(h.values.u_sourceSize,[640,320]);
  }finally{h.close();}
});

test('shaders react to page pointer events even when their own layer receives no events',()=>{
  const h=rendererHarness();
  try{
    const move=new Event('pointermove');Object.assign(move,{isPrimary:true,clientX:80,clientY:40});
    h.page.dispatchEvent(move);h.frame(100);
    assert.deepEqual(h.values.u_mouse,[0.25,0.75]);assert.equal(h.values.u_hover,1);
    const outside=new Event('pointermove');Object.assign(outside,{isPrimary:true,clientX:1000,clientY:1000});h.page.dispatchEvent(outside);h.frame(200);
    assert.equal(h.values.u_hover,0);
  }finally{h.close();}
});


test('video frames also resample after resize and when playback advances',()=>{
  const h=rendererHarness(true,'fill',true);
  try{
    h.frame(100);assert.deepEqual(h.uploads.at(-1),{width:320,height:160});
    h.resize(160,320);h.frame(200);assert.deepEqual(h.uploads.at(-1),{width:160,height:320});
    const count=h.uploads.length;(h.source as any).currentTime=1;h.frame(300);
    assert.equal(h.uploads.length,count+1);
    h.resize(640,360);h.frame(400);assert.deepEqual(h.uploads.at(-1),{width:640,height:360});
    assert.equal(h.draws.at(-1)[0],h.source);
  }finally{h.close();}
});

test('contained and cropped media are rasterized with the same geometry as their DOM fit',()=>{
  for(const fit of ['contain','cover']){
    const h=rendererHarness(true,fit);
    try{
      h.frame(100);const [,x,y,w,hg]=h.draws.at(-1);
      if(fit==='contain'){assert.ok(w<=320&&hg<=160);assert.ok(x>=0&&y>=0);}
      else{assert.ok(w>=320&&hg>=160);assert.ok(x<=0&&y<=0);}
    }finally{h.close();}
  }
});
