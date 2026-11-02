import './editorControls.css';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
export function EditorNumber({value,min,max,step=1,onChange,label,suffix}: {value:number;min:number;max:number;step?:number;onChange:(value:number)=>void;label:string;suffix?:string}) {
  const language=useEditorStore(s=>s.language);
  const [draft,setDraft]=useState(String(value));const focused=useRef(false);const cancelled=useRef(false);
  useEffect(()=>{if(!focused.current)setDraft(String(value));},[value]);
  const number=(raw:string)=>Number(raw.replace(',','.'));
  const commit=(n:number)=>{const next=Number(Math.max(min,Math.min(max,n)).toFixed(4));setDraft(String(next));onChange(next);};
  return <div className="editor-number"><button type="button" tabIndex={-1} aria-label={`${t('Decrease',language)}: ${label}`} disabled={value<=min} onClick={()=>commit(value-step)}><Minus size={11}/></button>
    <input type="text" inputMode="decimal" role="spinbutton" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} value={draft} onFocus={e=>{focused.current=true;e.target.select();}} onChange={e=>{
      setDraft(e.target.value);const n=number(e.target.value);if(e.target.value.trim()&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);
    }} onBlur={()=>{focused.current=false;if(cancelled.current){cancelled.current=false;setDraft(String(value));return;}const n=number(draft);commit(draft.trim()&&Number.isFinite(n)?n:value);}} onKeyDown={e=>{
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();commit(value+(e.key==='ArrowUp'?step:-step)*(e.shiftKey?10:1));}
      if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelled.current=true;setDraft(String(value));e.currentTarget.blur();}
    }}/>{suffix&&<span>{suffix}</span>}
    <button type="button" tabIndex={-1} aria-label={`${t('Increase',language)}: ${label}`} disabled={value>=max} onClick={()=>commit(value+step)}><Plus size={11}/></button></div>;
}
