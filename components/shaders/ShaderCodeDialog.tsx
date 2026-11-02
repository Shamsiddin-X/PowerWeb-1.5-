import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Code2, X, Check, Braces } from 'lucide-react';
import { CanvasElement } from '../../types';
import { ShaderConfig, ShaderTarget, shaderCanApply, shaderSupports, isShaderConfig, SHADER_TARGET_LABELS } from '../../types/shaders';
import { prepareShaderCode, SHADER_CODE_EXAMPLE } from '../../utils/shaderCode';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import { EditorSelect } from '../ui/EditorSelect';
import { ShaderPreview } from './ShaderPreview';
import './shaders.css';
export function ShaderCodeDialog({onClose,onCreate,target,applyLabel='Готово',canApply=true}: {
  onClose:()=>void;onCreate:(shader:ShaderConfig)=>void;target?:CanvasElement|null;applyLabel?:string;canApply?:boolean;
}) {
  const id=useId(),dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLTextAreaElement>(null);
  const [raw,setRaw]=useState(''),[code,setCode]=useState('');
  const [kind,setKind]=useState<ShaderTarget>(target?.type==='text'?'text':target?.type==='image'||target?.type==='video'?'media':target?'object':'surface');
  const [result,setResult]=useState({fragment:'',error:''});
  useEffect(()=>{const timer=setTimeout(()=>setCode(raw),350);return ()=>clearTimeout(timer);},[raw]);
  const config=useMemo<ShaderConfig>(()=>({name:'Мой шейдер',target:kind,fragment:prepareShaderCode(code,kind),colorA:'#ffb35c',colorB:'#7856ff',speed:1,scale:1,size:100,intensity:1,opacity:1,backgroundColor:'#111827',backgroundOpacity:1,interaction:/u_mouse|iMouse/.test(code)?'pointer':'none',response:.15,radius:.28,strength:1}),[code,kind]);
  const compatible=target?shaderCanApply(config,target.type):shaderCanApply(config);
  const ready=!!code.trim()&&raw===code&&config.fragment.length<=30000&&result.fragment===config.fragment&&!result.error;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement;
    dialog.current?.style.setProperty('--sh-ui-zoom',String(Number(getComputedStyle(document.body).zoom)||1));
    dialog.current?.showModal();input.current?.focus();
    return ()=>previous?.focus();
  },[]);
  const submit=()=>{if(ready&&canApply&&compatible)onCreate(config);};
  return createPortal(<dialog ref={dialog} className="shader-dialog shader-code-dialog editor-shell" aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{e.stopPropagation();if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();submit();}}}>
    <header className="shader-header"><Code2 size={20}/><h1 id={id}>Создать кодом</h1><button type="button" aria-label="Закрыть" onClick={onClose}><X size={18}/></button></header>
    <div className="shader-code-compose"><div className="shader-code-input"><textarea ref={input} value={raw} maxLength={27000} spellCheck={false} aria-label="Код шейдера GLSL" placeholder="Вставьте GLSL или mainImage(…)" onChange={e=>setRaw(e.target.value)}/><div><span>GLSL · WebGL 1</span><button type="button" onClick={()=>setRaw(SHADER_CODE_EXAMPLE)}><Braces size={13}/>Пример</button></div></div>
      <aside className="shader-code-side"><EditorSelect label="Для чего создаём шейдер" value={kind} onChange={value=>setKind(value as ShaderTarget)} options={Object.entries(SHADER_TARGET_LABELS).map(([value,label])=>({value,label,disabled:target?!shaderCanApply({...config,target:value as ShaderTarget},target.type):value!=='surface'}))}/>
        <div className="shader-code-preview">{code.trim()?<ShaderPreview shader={config} objectScope={kind!=='surface'} target={target&&compatible?target:undefined} ratio={target?target.width/target.height:5/3} pageWidth={target?.width||600} paused={false} onPause={()=>{}} onError={error=>setResult({fragment:config.fragment,error})}/>:<div className="shader-code-placeholder"><Code2 size={28}/><span>Превью появится здесь</span></div>}</div>
        <span className="shader-code-status">{!raw?'Вставьте код':raw!==code?'Обновление…':result.error?'Проверьте код':ready?'Готов к применению':'Компиляция…'}</span>
      </aside>
    </div>
    {result.error&&result.fragment===config.fragment&&<pre role="alert" className="shader-code-error">{result.error}</pre>}
    <footer className="shader-footer"><span>{!canApply?'Слой скрыт или заблокирован.':!compatible?'Выберите совместимый объект.':'Ctrl + Enter'}</span><div><button type="button" onClick={onClose}>Отмена</button><button type="button" className="shader-apply" disabled={!ready||!canApply||!compatible} onClick={submit}><Check size={15}/>{applyLabel}</button></div></footer>
  </dialog>,document.body);
}
/** Global entry point used by the ribbon and quick context actions. */
export function ShaderCodeCreator(){
  const open=useEditorStore(s=>s.showShaderCodeEditor),selected=useSelectedElement();
  const target=selected&&shaderSupports(selected.type)?selected:null;
  const state=useEditorStore();
  if(!open)return null;
  const page=state.project.pages.find(p=>p.id===state.project.activePageId);
  const layer=target?page?.layers.find(l=>l.elements.some(e=>e.id===target.id)):page?.layers.find(l=>l.id===state.activeLayerId);
  return <ShaderCodeDialog target={target} canApply={!!layer?.visible&&!layer.locked} applyLabel="Создать и применить" onClose={()=>useEditorStore.setState({showShaderCodeEditor:false})} onCreate={shader=>{
    const s=useEditorStore.getState();s.commitTransaction();
    try{
      const saved=JSON.parse(localStorage.getItem('powerweb.shaders.v1')||'[]');
      localStorage.setItem('powerweb.shaders.v1',JSON.stringify([shader,...(Array.isArray(saved)?saved.filter(isShaderConfig):[])].slice(0,40)));
    }catch{}
    if(target)s.updateSpecificElement(target.id,{shader});else s.setLayerShader(s.activeLayerId,shader);
    useEditorStore.setState({showShaderCodeEditor:false});
  }}/>;
}
