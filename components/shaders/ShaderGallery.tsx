import React, { useState } from 'react';
import { ShaderThumbnail } from './ShaderThumbnail';
import { Type, Image, Box, Layers } from 'lucide-react';
import { ShaderConfig, SHADER_TARGET_LABELS } from '../../types/shaders';
import { ShaderPreset } from '../../utils/shaderPresets';
export function ShaderTile({shader, selected=false, onSelect, compact=false, presetId}: {
  shader:ShaderConfig; selected?:boolean; onSelect:(shader:ShaderConfig)=>void; compact?:boolean; presetId?:string;
}) {
  const target=shader.target||'surface';
  const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false);

  return <button type="button" className={`shader-tile${compact?' compact':''}`} aria-pressed={selected}
    onPointerEnter={e=>{if(e.pointerType==='mouse')setHovered(true);}} onPointerLeave={()=>setHovered(false)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    aria-label={`${shader.name} · ${SHADER_TARGET_LABELS[target]}`} title={`${shader.name} · ${SHADER_TARGET_LABELS[target]}`} onClick={()=>onSelect(shader)}>
    <span className={`shader-swatch is-${shader.interaction||'none'} target-${target}`} style={{'--shader-a':shader.colorA,'--shader-b':shader.colorB} as React.CSSProperties}>
      <ShaderThumbnail shader={shader} id={presetId||''} live={hovered||focused}/>
    </span>
    {!compact&&<><span className="shader-tile-label">{shader.name}</span><span className="shader-tile-kind">{SHADER_TARGET_LABELS[target]}</span></>}
  </button>;
}
export const SHADER_COLLECTIONS=[{id:'surface',label:'Фон',icon:Layers},{id:'object',label:'Объекты',icon:Box},{id:'media',label:'Фото / видео',icon:Image},{id:'text',label:'Текст',icon:Type}] as const;
export function ShaderGallery({presets,selected,onSelect,compact=false,grouped=false}: {
  presets:ShaderPreset[];selected?:ShaderConfig;onSelect:(shader:ShaderConfig)=>void;compact?:boolean;grouped?:boolean;
}) {
  if(grouped)return <>{SHADER_COLLECTIONS.map(group=>{
    const items=presets.filter(item=>(item.config.target||'surface')===group.id);
    return items.length?<section className="shader-gallery-section" key={group.id}><h3><group.icon size={14}/>{group.label}<span>{items.length}</span></h3><ShaderGallery presets={items} selected={selected} onSelect={onSelect}/></section>:null;
  })}</>;
  return <div className={`shader-icon-grid${compact?' compact':''}`}>{presets.map(preset=><ShaderTile key={preset.id} presetId={preset.id} shader={preset.config} selected={selected?.fragment===preset.config.fragment} onSelect={onSelect} compact={compact}/>)}</div>;
}
