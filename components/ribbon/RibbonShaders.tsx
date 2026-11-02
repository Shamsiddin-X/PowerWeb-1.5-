import React, { useRef, useState, useCallback } from 'react';
import { SlidersHorizontal, Eraser, ChevronDown, Code2 } from 'lucide-react';
import { RibbonGroup, BigButton } from './RibbonShared';
import { ShaderGallery, SHADER_COLLECTIONS } from '../shaders/ShaderGallery';
import { Popover } from '../ui/Popover';
import { SHADER_PRESETS } from '../../utils/shaderPresets';
import { ShaderConfig } from '../../types/shaders';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import '../shaders/shaders.css';
function Collection({id,label,selected,onSelect}: {id:string;label:string;selected?:ShaderConfig;onSelect:(shader:ShaderConfig)=>void}) {
  const [open,setOpen]=useState(false),anchor=useRef<HTMLButtonElement>(null);
  const close=useCallback(()=>setOpen(false),[]);
  const presets=SHADER_PRESETS.filter(p=>(p.config.target||'surface')===id);
  const favorites=id==='surface'?['aurora','plasma','mesh','caustics','cursor-light','hover-border']:presets.slice(0,6).map(p=>p.id);
  return <RibbonGroup label={label}><div className="shader-ribbon-collection">
    <ShaderGallery presets={presets.filter(p=>favorites.includes(p.id))} selected={selected} onSelect={onSelect} compact/>
    <button ref={anchor} type="button" className="shader-ribbon-more" aria-label={`Все эффекты: ${label}`} title={`Все эффекты: ${label} (${presets.length})`} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><ChevronDown size={14}/></button>
    <Popover open={open} onClose={close} anchor={anchor} title={label} width={360}><div className="shader-ribbon-fullgallery"><ShaderGallery presets={presets} selected={selected} onSelect={shader=>{close();onSelect(shader);}}/></div></Popover>
  </div></RibbonGroup>;
}
export const RibbonShaders=React.memo(()=>{
  const {project,activeLayerId,language}=useEditorStore();
  const selected=useSelectedElement();
  const layer=project.pages.find(p=>p.id===project.activePageId)?.layers.find(l=>l.id===activeLayerId);
  const ru=language==='ru';
  const open=(shader?:ShaderConfig)=>useEditorStore.setState({shaderPresetId:shader?SHADER_PRESETS.find(p=>p.config.fragment===shader.fragment)?.id||null:null,shaderEditorScope:null,showShaderEditor:true});
  return <>
    <RibbonGroup label={ru?'Редактор':'Editor'}><BigButton icon={SlidersHorizontal} label={ru?'Все эффекты':'All effects'} onClick={()=>open()}/><BigButton icon={Code2} label={ru?'Создать кодом':'Create with code'} onClick={()=>useEditorStore.setState({showShaderCodeEditor:true})}/></RibbonGroup>
    {SHADER_COLLECTIONS.map(group=><Collection key={group.id} id={group.id} label={ru?group.label:group.id} selected={group.id==='surface'?layer?.shader||undefined:selected?.shader||undefined} onSelect={open}/>)}
    <RibbonGroup label={ru?'Фон слоя':'Layer background'}><BigButton icon={Eraser} label={ru?'Убрать':'Remove'} disabled={!layer?.shader||layer.locked||!layer.visible} onClick={()=>{const s=useEditorStore.getState();s.commitTransaction();s.setLayerShader(activeLayerId,null);}}/></RibbonGroup>
  </>;
});
