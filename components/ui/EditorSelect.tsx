import React, { useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { EditorFlyout } from './EditorFlyout';
export interface EditorOption {value:string;label:string;disabled?:boolean;}
export function EditorSelect({value,options,onChange,label}: {value:string;options:EditorOption[];onChange:(value:string)=>void;label:string}) {
  const [open,setOpen]=useState(false), id=useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const close=()=>setOpen(false);
  return <div className="editor-select">
    <button ref={trigger} id={id} type="button" className="editor-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(v=>!v)} onKeyDown={e=>{
      if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();setOpen(true);}
    }}><span>{options.find(option=>option.value===value)?.label||'—'}</span><ChevronDown size={14}/></button>
    {open&&<EditorFlyout anchor={trigger} label={label} onClose={close} width={Math.max(200,trigger.current?.clientWidth||0)}>
      <div className="editor-options" role="listbox" aria-labelledby={id} onKeyDown={e=>{
        if(e.key==='Tab'){close();trigger.current?.focus();return;}
        if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
        e.preventDefault();const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const i=items.indexOf(e.target as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
        items[next]?.focus();
      }}>{options.map(option=><button type="button" role="option" aria-selected={option.value===value} disabled={option.disabled} key={option.value} onClick={()=>{onChange(option.value);close();trigger.current?.focus();}}><span>{option.label}</span>{option.value===value&&<Check size={14}/>}</button>)}</div>
    </EditorFlyout>}
  </div>;
}
