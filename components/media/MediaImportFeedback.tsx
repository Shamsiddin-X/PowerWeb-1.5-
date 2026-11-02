import React from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, X } from 'lucide-react';
export function MediaImportFeedback({busy,error,onDismiss}:{busy:boolean;error:string;onDismiss:()=>void}){
  if(!busy&&!error)return null;
  return createPortal(<div role={error?'alert':'status'} className="editor-shell fixed bottom-12 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 max-w-[min(440px,90vw)] px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-xl text-xs">
    {busy&&<LoaderCircle size={16} className="animate-spin text-brand-500 shrink-0"/>}<span>{error||'Открытие медиафайла…'}</span>
    {error&&<button type="button" aria-label="Закрыть сообщение" onClick={onDismiss} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><X size={15}/></button>}
  </div>,document.body);
}
