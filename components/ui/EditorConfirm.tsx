import './editorControls.css';
import React, { useEffect, useId, useRef } from 'react';
export function EditorConfirm({message,onCancel,onConfirm}: {message:string;onCancel:()=>void;onConfirm:()=>void}) {
  const ref=useRef<HTMLDivElement>(null),id=useId();
  useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.querySelector<HTMLButtonElement>('button')?.focus();return ()=>previous?.focus();},[]);
  return <div className="editor-confirm-backdrop"><div ref={ref} className="editor-confirm" role="alertdialog" aria-modal="true" aria-labelledby={id} onKeyDown={e=>{
    e.stopPropagation();if(e.key==='Escape'){e.preventDefault();onCancel();}
    if(e.key==='Tab'){const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));const i=buttons.indexOf(e.target as HTMLButtonElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
  }}><p id={id}>{message}</p><div><button type="button" onClick={onCancel}>Отмена</button><button type="button" className="editor-confirm-accept" onClick={onConfirm}>Заменить</button></div></div></div>;
}
