import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Play, Pause, Columns2 } from 'lucide-react';
import { Layer, CanvasElement, DEFAULT_STYLE } from '../../types';
import { ShaderConfig } from '../../types/shaders';
import { Slider } from '../ui/Slider';
import { ShaderCanvas } from './ShaderCanvas';
import { CanvasElementRenderer } from '../canvas/CanvasElement';
import { SHADER_DEMO_IMAGE } from '../../utils/shaderDemo';
function demo(shader:ShaderConfig):CanvasElement {
  const text=shader.target==='text';
  return {id:'shader-preview-demo',type:text?'text':shader.target==='media'?'image':'roundedRect',x:0,y:0,width:text?620:640,height:text?240:400,
    content:text?'MAKE\nIT MOVE':shader.target==='media'?SHADER_DEMO_IMAGE:'',style:{...DEFAULT_STYLE,strokeWidth:0,borderRadius:24,fontSize:92,fontWeight:'800',fontFamily:'Arial',color:'#1e293b',textAlign:'center'},shader};
}
export function ShaderPreview({shader,originalShader,ratio,layer,pageWidth,paused,onPause,onError,backgroundColor,baseColor='#ffffff',target,objectScope=false}: {
  shader:ShaderConfig;originalShader?:ShaderConfig|null;backgroundColor?:string;baseColor?:string;ratio:number;layer?:Layer;pageWidth:number;paused:boolean;onPause:()=>void;onError:(message:string)=>void;target?:CanvasElement;objectScope?:boolean;
}) {
  const ref=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(0),[objects,setObjects]=useState(true),[comparison,setComparison]=useState<'before'|'after'|'split'>(shader.target==='media'?'split':'after'),[split,setSplit]=useState(50);
  const previewTarget=objectScope?(target||demo(shader)):undefined;
  const width=previewTarget?.width||pageWidth;
  const height=previewTarget?.height||pageWidth/ratio;
  const previewRatio=width/height;
  useEffect(()=>{setComparison(shader.target==='media'?'split':'after');},[shader.fragment,target?.id]);
  useEffect(()=>{
    const node=ref.current;if(!node)return;
    const measure=()=>setScale(node.clientWidth/width);
    const observer=new ResizeObserver(measure);observer.observe(node);measure();
    return ()=>observer.disconnect();
  },[width,previewRatio]);
  const size={width,height};
  const renderObject=(config:ShaderConfig|null|undefined,report=false)=><div className="shader-preview-objects" style={{width,height,transform:`scale(${scale})`}}><CanvasElementRenderer key={previewTarget!.id} element={{...previewTarget!,shader:config}} isSelected={false} scale={scale} shaderPaused={paused} shaderDemo onShaderError={report?onError:undefined}/></div>;
  return <section className="shader-preview-section">
    <div className="shader-preview-heading"><h2>{shader.name||'Без названия'}</h2><div>
      <div className="shader-comparison" role="group" aria-label="Сравнить эффект"><button aria-pressed={comparison==='before'} onClick={()=>setComparison('before')}>До</button><button aria-pressed={comparison==='after'} onClick={()=>setComparison('after')}>После</button>{shader.target==='media'&&<button title="Сравнить рядом" aria-label="Сравнить рядом" aria-pressed={comparison==='split'} onClick={()=>setComparison('split')}><Columns2 size={14}/></button>}</div>
      {layer&&<button aria-label="Показать объекты слоя" aria-pressed={objects} title="Объекты слоя" onClick={()=>setObjects(v=>!v)}>{objects?<Eye size={15}/>:<EyeOff size={15}/>}</button>}
      <button onClick={onPause} title={paused?'Продолжить':'Пауза'} aria-label={paused?'Продолжить':'Пауза'}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>
    </div></div>
    <div className="shader-preview-stage" style={{'--preview-ratio':String(previewRatio)} as React.CSSProperties}>
      <div ref={ref} className="shader-preview" data-shader-surface data-shader-page tabIndex={0} role="button" aria-label="Предпросмотр: движение мыши, наведение и нажатие" style={{aspectRatio:previewRatio,background:baseColor}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click();}}}>
        <div style={{position:'absolute',inset:0,opacity:comparison==='before'?0:1}}>{previewTarget?scale>0&&renderObject(shader,true):<ShaderCanvas shader={shader} pageInput surfaceSize={size} paused={paused} demo onError={onError} backgroundColor={backgroundColor}/>}</div>
        {comparison!=='after'&&<div className="shader-preview-original" style={{position:'absolute',inset:0,clipPath:comparison==='split'?`inset(0 ${100-split}% 0 0)`:undefined,background:baseColor}}>{previewTarget?renderObject(originalShader):originalShader&&<ShaderCanvas shader={originalShader} pageInput surfaceSize={size} paused={paused} backgroundColor={backgroundColor}/>}</div>}
        {comparison==='split'&&<><span className="shader-split-label before">Оригинал</span><span className="shader-split-label after">С эффектом</span><span className="shader-split-divider" style={{left:`${split}%`}}/></>}
        {layer&&objects&&scale>0&&<div className="shader-preview-objects" style={{width,height,transform:`scale(${scale})`}}>{layer.elements.map(element=><div key={element.id} style={{position:'absolute',left:element.x,top:element.y,width:element.width,height:element.height}}><CanvasElementRenderer element={element} isSelected={false} scale={scale} shaderPaused={paused}/></div>)}</div>}
      </div>
    </div>
    {comparison==='split'&&<div className="shader-split-control"><Slider aria-label="Граница сравнения" min={5} max={95} step={1} value={split} onChange={e=>setSplit(Number(e.target.value))}/></div>}
    <div className="shader-preview-status"><span>{Math.round(width)} × {Math.round(height)} px{objectScope&&!target?' · демонстрация':''}</span><span>{shader.size??100}% · {comparison==='before'?'До изменений':shader.interactive!==false&&shader.interaction&&shader.interaction!=='none'?'Наведите курсор · автопоказ':'Предпросмотр'}</span></div>
  </section>;
}
