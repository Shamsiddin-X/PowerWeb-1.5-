import { Project, CanvasElement, Animation, LogicBlock } from '../types';
import { ShaderConfig, shaderCanApply, shaderUsesSource } from '../types/shaders';
import { getSvgPath } from '../utils/shapeData';
import { safeUrl } from './safety';
export type ExportLayout='responsive'|'canvas';
export type Styles=Record<string,string|number|undefined>;
export interface ExportNode {tag:string;attributes:Record<string,string|boolean|number>;styles:Styles;children:(ExportNode|string)[];mobile?:Styles;breakpoint?:number;events?:LogicBlock[];}
export interface ExportPage {id:string;name:string;file:string;node:ExportNode;}
export interface ExportTree {name:string;language:string;description:string;pages:ExportPage[];fonts:NonNullable<Project['fonts']>;extraCss:string[];animationNames:Set<string>;logic:{id:string;logic:LogicBlock[]}[];usesShaders:boolean;usesClickAnimations:boolean;pageUrls:Record<string,string>;singleDocument:boolean;canvasLayout:boolean;}
const tags=new Set('div span p h1 h2 h3 h4 h5 h6 section article main nav header footer aside button a figure figcaption form label input textarea ul ol li'.split(' '));
export function node(tag:string,styles:Styles={},attributes:ExportNode['attributes']={},children:ExportNode['children']=[]):ExportNode{return {tag,styles,attributes,children};}
const px=(value:number)=>Number(value.toFixed(3))+'px';
const percent=(value:number,parent:number)=>Number((value/parent*100).toFixed(5))+'%';
const fill:Styles={position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',borderRadius:'inherit'};
function shaderNodes(shader:ShaderConfig,fallback:string,width:number,height:number,page=false):ExportNode[]{
  return [...(shaderUsesSource(shader)?[]:[node('span',{...fill,background:shader.backgroundColor||fallback,opacity:shader.backgroundOpacity??1},{'aria-hidden':'true'})]),node('canvas',fill,{'data-pwb-shader':JSON.stringify(shader),'data-pwb-shader-width':width,'data-pwb-shader-height':height,...(page?{'data-pwb-shader-input':'page','data-pwb-shader-responsive':'true'}:{}),'aria-hidden':'true'})];
}
const easing=(value:string|undefined)=>['ease','ease-in','ease-out','ease-in-out','linear','cubic-bezier(0.34,1.56,0.64,1)'].includes(value||'')?value!:'ease';
const animationValue=(animation:Animation)=>`${/^[a-z][a-z0-9]*$/i.test(animation.name)?animation.name:'fadeIn'} ${animation.duration}s ${easing(animation.easing)} ${animation.delay}s ${animation.iterationCount||1} both`;
const pageTransitions:Record<string,string>={
  fade:'from { opacity: 0; } to { opacity: 1; }',
  push_left:'from { transform: translateX(100%); } to { transform: translateX(0); }',
  push_right:'from { transform: translateX(-100%); } to { transform: translateX(0); }',
  push_up:'from { transform: translateY(100%); } to { transform: translateY(0); }',
  push_down:'from { transform: translateY(-100%); } to { transform: translateY(0); }',
  zoom_in:'from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); }',
  zoom_out:'from { opacity: 0; transform: scale(1.15); } to { opacity: 1; transform: scale(1); }',
};
export function buildExportTree(project:Project,{singleDocument=true,layout='responsive'}:{singleDocument?:boolean;layout?:ExportLayout}={}):ExportTree{
  const pageUrls=Object.fromEntries(project.pages.map((page,index)=>[page.id,singleDocument?'#'+encodeURIComponent(page.id):index===0?'index.html':`page-${index+1}.html`]));
  const tree:ExportTree={name:project.name,language:project.language||'en',description:project.description||project.pages[0]?.description||'',pages:[],fonts:project.fonts||[],extraCss:[],animationNames:new Set(),logic:[],usesShaders:false,usesClickAnimations:false,pageUrls,singleDocument,canvasLayout:layout==='canvas'};
  let sequence=0;const usedPageTransitions=new Set<string>();
  for(const page of project.pages){
    const mobile=layout!=='canvas'&&page.responsive!==false,breakpoint=page.mobileBreakpoint||768;
    const texts:CanvasElement[]=[];const collect=(elements:CanvasElement[])=>elements.forEach(element=>{if(element.type==='text'&&!element.tagName&&(element.style.fontSize||16)>=28&&(element.content||'').length<160)texts.push(element);collect(element.elements||[]);});
    page.layers.filter(layer=>layer.visible).forEach(layer=>collect(layer.elements));
    const heading=texts.sort((a,b)=>a.y-b.y||a.x-b.x)[0]?.id;
    const elementNode=(element:CanvasElement,parentWidth:number,index:number):ExportNode=>{
      const {style,type}=element,isText=type==='text'||type==='button',isShape=!['rect','roundedRect','circle','text','button','image','video','line','group'].includes(type);
      const shader=element.shader&&shaderCanApply(element.shader,type)?element.shader:null;
      const sourceShader=shader&&shaderUsesSource(shader);
      let tag=element.tagName&&tags.has(element.tagName)?element.tagName:type==='text'?element.id===heading?'h1':(style.fontSize||16)>=24&&(element.content||'').length<160?'h2':'p':type==='button'?'button':type==='image'?'img':type==='video'?'video':'div';
      const attributes:ExportNode['attributes']={id:element.id};
      for(const [key,value] of Object.entries(element.attributes||{}))if(/^(aria-[a-z-]+|data-[a-z-]+|title|role|name|type|value|placeholder|required|alt|href|target|rel)$/.test(key)&&!key.startsWith('data-pwb-')&&key!=='data-media-name')attributes[key]=key==='href'?safeUrl(value):key==='required'?value!=='false':value;
      let events=structuredClone(element.logic||[]);
      const navigation=events.length===1&&events[0].event?.type==='click'&&!events[0].condition&&!events[0].elseActions?.length&&events[0].actions.length===1?events[0].actions[0]:null;
      if(navigation&&['navigateToPage','navigateToUrl'].includes(navigation.type)){
        const href=navigation.type==='navigateToPage'?pageUrls[navigation.targetId||'']:safeUrl(navigation.url||'');
        if(href){tag='a';attributes.href=href;attributes['aria-label']??=element.content||project.pages.find(p=>p.id===navigation.targetId)?.name||href;if(navigation.type==='navigateToPage')attributes['data-page-target']=navigation.targetId!;else attributes.target??='_blank';events=[];}
      }
      if(attributes.href&&tag!=='img'&&type!=='video')tag='a';
      if(tag==='a'&&attributes.target==='_blank')attributes.rel='noopener noreferrer';
      if(tag==='button')attributes.type=attributes.type||'button';
      if(type==='image')attributes.alt=element.attributes?.alt??element.attributes?.['data-media-name']?.replace(/\.[^.]+$/,'')??'';
      if(events.length){tree.logic.push({id:element.id,logic:events});if(events.some(block=>block.event?.type==='click')&&!['button','a','input','textarea','video'].includes(tag)){attributes.role='button';attributes.tabindex=0;attributes['aria-label']??=element.content||element.attributes?.title||'Interactive object';}}
      if(shader){tree.usesShaders=true;attributes['data-shader-surface']=true;}
      const styles:Styles={position:element.positionMode==='fixed'?'fixed':'absolute',left:percent(element.x,parentWidth),top:px(element.y),width:percent(element.width,parentWidth),height:px(element.height),zIndex:index+1,
        pointerEvents:'auto',opacity:style.opacity,borderRadius:type==='circle'?'50%':px(style.borderRadius),margin:0,
        ...(['rect','roundedRect','circle','button','line'].includes(type)?{background:shader&&!sourceShader?'transparent':style.fill}:{}),
        ...(!isShape&&style.strokeWidth>0&&!['text','image','video','group','line'].includes(type)?{border:`${px(style.strokeWidth)} solid ${style.stroke}`}:{border:'none'}),
        ...(style.shadowBlur?{boxShadow:`0 0 ${px(style.shadowBlur)} ${style.shadowColor}`} :{}),...(style.backdropBlur?{backdropFilter:`blur(${px(style.backdropBlur)})`}:{}),
        ...(shader?{overflow:'hidden'}:{}),...((type==='image'||type==='video')?{objectFit:style.objectFit||'fill'}:{}),...(events.length||shader?.interaction&&shader.interaction!=='none'?{cursor:'pointer'}:{}),
      };
      if(isText)Object.assign(styles,{fontFamily:style.fontFamily,fontSize:`clamp(${Math.min(style.fontSize||16,element.id===heading?28:16)}px, ${Number(((style.fontSize||16)/page.width*100).toFixed(4))}cqi, ${px(style.fontSize||16)})`,fontWeight:style.fontWeight,fontStyle:style.fontStyle,color:style.color,textAlign:style.textAlign,whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.2,display:type==='button'?'flex':'block',alignItems:type==='button'?'center':undefined,justifyContent:type==='button'?'center':undefined,padding:0});
      let children:ExportNode['children']=[];
      if(type==='group')children=(element.elements||[]).map((element,index)=>({element,index})).sort((a,b)=>a.element.y-b.element.y||a.element.x-b.element.x).map(({element:child,index})=>elementNode(child,element.width,index));
      else if(type==='image'||type==='video'){
        const mediaAttributes:ExportNode['attributes']={src:safeUrl(element.content||'',true),...(type==='image'?{alt:attributes.alt??'',loading:'lazy',decoding:'async',width:element.width,height:element.height}:{controls:true,preload:'metadata',autoplay:!!element.videoProps?.autoplay,loop:!!element.videoProps?.loop,muted:!!element.videoProps?.muted,playsinline:true})};
        if(sourceShader){
          tag=tag==='a'?'a':type==='image'?'figure':'div';delete attributes.alt;
          children=[node(type==='image'?'img':'video',{width:'100%',height:'100%',objectFit:style.objectFit||'fill',display:'block'},{...mediaAttributes,'data-pwb-shader-source':'media',crossorigin:'anonymous'}),...shaderNodes(shader!,style.fill,element.width,element.height)];
        }else if(tag!==(type==='image'?'img':'video'))children=[node(type==='image'?'img':'video',{width:'100%',height:'100%',objectFit:style.objectFit||'fill'},mediaAttributes)];
        else Object.assign(attributes,mediaAttributes);
      }else if(isShape){
        const path=getSvgPath(type),clipId='clip-'+(++sequence),shapeTag=type==='heart'?'path':'polygon',geometry=type==='heart'?{d:path}:{points:path};
        if(shader){
          const clip=node('svg',{position:'absolute'},{width:0,height:0,'aria-hidden':'true'},[node('defs',{}, {},[node('clipPath',{}, {id:clipId,clipPathUnits:'objectBoundingBox'},[node(shapeTag,{}, {...geometry,transform:'scale(.01)'})])])]);
          children=[clip,node('div',{...fill,clipPath:`url(#${clipId})`},{},shaderNodes(shader,style.fill,element.width,element.height))];
        }
        children.push(node('svg',{width:'100%',height:'100%',display:'block'},{viewBox:'0 0 100 100',preserveAspectRatio:'none','aria-hidden':'true'},[node(shapeTag,{}, {...geometry,fill:shader?'none':style.fill,stroke:style.stroke,'stroke-width':style.strokeWidth,'vector-effect':'non-scaling-stroke'})]));
      }else if(sourceShader&&type==='text')children=[node('span',{display:'block',width:'100%',height:'100%'},{'data-pwb-shader-source':'text'},[element.content||'']),...shaderNodes(shader!,style.fill,element.width,element.height)];
      else if(shader)children=[...shaderNodes(shader,style.fill,element.width,element.height),...(element.content?[node('span',{position:'relative'},{},[element.content])]:[])];
      else if(element.content&&type!=='line')children=[element.content];
      const result=node(tag,styles,attributes,children);result.events=events;
      if(mobile&&element.positionMode!=='fixed'){
        result.breakpoint=breakpoint;result.mobile={position:'relative',inset:'auto',left:'auto',top:'auto',width:'100%',maxWidth:'100%',display:type==='button'||type==='group'?'flex':'block',height:isText||type==='group'?'auto':undefined,minHeight:type==='button'?px(Math.max(44,element.height)):undefined,aspectRatio:['image','video'].includes(type)||isShape||['rect','roundedRect','circle'].includes(type)?`${element.width} / ${element.height}`:undefined,zIndex:'auto',...(type==='group'?{flexDirection:'column',gap:'16px',padding:'16px'}:{})};
        if(!isText&&type!=='group')result.mobile.height='auto';
        if(type==='text')result.mobile.minHeight=px(Math.min(element.height,(style.fontSize||16)*1.2));
        if(isText)result.mobile.fontSize=`clamp(${Math.min(style.fontSize||16,16)}px, ${Number(((style.fontSize||16)/page.width*160).toFixed(3))}cqi, ${px(style.fontSize||16)})`;
      }
      const animations=element.animations||[];
      if(animations.length){
        let visual=node(['img','video'].includes(tag)?tag:'span',{...styles,position:'relative',left:'auto',top:'auto',width:'100%',height:'100%',zIndex:'auto',opacity:1},{...attributes},children);
        delete visual.attributes.id;delete visual.attributes.href;delete visual.attributes.role;delete visual.attributes.tabindex;
        if(!['img','video'].includes(tag)){delete visual.attributes.type;delete visual.attributes['aria-label'];}
        for(let i=animations.length-1;i>=0;i--){
          const animation=animations[i],className='animation-'+(++sequence);tree.animationNames.add(animation.name);
          const wrapper=node('span',{display:'block',position:'absolute',inset:0,width:'100%',height:'100%',...(animation.trigger==='onLoad'?{animation:animationValue(animation)}:{})},{class:className,'data-pwb-animation-layer':i},[visual]);
          if(mobile){wrapper.breakpoint=breakpoint;wrapper.mobile={position:'relative',inset:'auto',height:isText||type==='group'?'auto':'100%'};visual.breakpoint=breakpoint;visual.mobile={left:'auto',top:'auto',position:'relative',width:'100%',height:isText||type==='group'?'auto':'100%',...(type==='group'&&i===animations.length-1?{display:'flex',flexDirection:'column',gap:'16px'}:{})};}
          if(animation.trigger==='onHover')tree.extraCss.push(`.${'trigger-'+element.id.replace(/[^a-z0-9_-]/gi,'_')}:hover .${className} { animation: ${animationValue(animation)}; }`);
          visual=wrapper;
        }
        const runtimeAnimations=animations.filter(animation=>animation.trigger==='onClick'||animation.trigger==='onScroll');
        if(runtimeAnimations.length){tree.usesClickAnimations=true;attributes['data-animations']=JSON.stringify(animations.map(animation=>['onClick','onScroll'].includes(animation.trigger)?animation:{...animation,trigger:'css'}));}
        attributes.class='trigger-'+element.id.replace(/[^a-z0-9_-]/gi,'_');
        result.tag=['img','video'].includes(tag)?'div':tag;result.children=[visual];
        result.styles={position:styles.position,left:styles.left,top:styles.top,width:styles.width,height:styles.height,zIndex:styles.zIndex,opacity:styles.opacity,pointerEvents:'auto',cursor:animations.some(a=>a.trigger==='onClick')?'pointer':styles.cursor,margin:0,border:'none',padding:0,background:'transparent'};
        if(['img','video'].includes(tag))for(const key of ['src','alt','loading','decoding','autoplay','loop','muted','controls','playsinline','preload','width','height'])delete result.attributes[key];
      }
      return result;
    };
    const layers=page.layers.filter(layer=>layer.visible).map((layer,index)=>{
      const background=layer.shader?node('div',{position:'absolute',inset:0,zIndex:-1,overflow:'hidden',pointerEvents:'none'},{'data-layer-shader':layer.id},shaderNodes(layer.shader,'#111827',page.width,page.height,true)):null;
      if(background)tree.usesShaders=true;
      const sorted=layer.elements.map((element,index)=>({element,index})).sort((a,b)=>a.element.y-b.element.y||a.element.x-b.element.x);
      const result=node('div',{position:'absolute',inset:0,isolation:'isolate',zIndex:index+1,pointerEvents:'none'},{'data-layer':layer.name},[...(background?[background]:[]),...sorted.map(({element,index})=>elementNode(element,page.width,index))]);
      if(mobile){result.breakpoint=breakpoint;result.mobile={position:'static',inset:'auto',display:'flex',flexDirection:'column',gap:'20px',padding:'20px',...(layer.elements.length?{}:{padding:0})};}
      return result;
    });
    const pageNode=node('section',{position:'relative',width:'100%',maxWidth:px(page.width),minHeight:px(page.height),margin:'0 auto',background:page.backgroundColor,containerType:'inline-size',isolation:'isolate'}, {id:page.id,class:'pwb-page','aria-label':page.name,...(tree.usesShaders?{'data-shader-page':true}:{})},layers);
    if(page.transition&&pageTransitions[page.transition]){
      const name='page-'+page.transition;
      pageNode.styles.animation=`${name} ${page.transitionDuration??.5}s ease both`;
      if(!usedPageTransitions.has(name)){usedPageTransitions.add(name);tree.extraCss.push(`@keyframes ${name} { ${pageTransitions[page.transition]} }`);}
    }
    if(mobile){pageNode.breakpoint=breakpoint;pageNode.mobile={minHeight:'100svh',height:'auto'};}
    if(layout==='canvas'){
      // A fixed design surface scales as a unit, including nested objects, text and shaders.
      Object.assign(pageNode.styles,{width:px(page.width),height:px(page.height),maxWidth:undefined,minHeight:undefined,margin:0,position:'absolute',left:0,top:0,transformOrigin:'top left'});
      pageNode.attributes={'data-shader-page':true,'data-pwb-design-width':page.width};
      const viewport=node('section',{position:'relative',width:'100%',maxWidth:px(page.width),aspectRatio:`${page.width} / ${page.height}`,margin:'0 auto',overflow:'hidden',background:page.backgroundColor},
        {id:page.id,class:'pwb-page','aria-label':page.name},[pageNode]);
      tree.pages.push({id:page.id,name:page.name,file:pageUrls[page.id],node:viewport});
    }else{
    tree.pages.push({id:page.id,name:page.name,file:pageUrls[page.id],node:pageNode});
    }
  }
  return tree;
}
