import React, { useState } from 'react';
import { FolderOpen, Image, Video, ChevronDown } from 'lucide-react';
import { t } from '../../utils/localization';
import { CanvasElement } from '../../types';
import { useEditorStore } from '../../store/useEditorStore';
import { useMediaImport } from '../../hooks/useMediaImport';
import { MediaImportFeedback } from './MediaImportFeedback';
export function MediaProperties({element,inputClass,labelClass}:{element:CanvasElement;inputClass:string;labelClass:string}){
  const language=useEditorStore(s=>s.language);
  const [showUrl,setShowUrl]=useState(false);
  const {busy,error,dismissError,replaceFile}=useMediaImport();
  const video=element.type==='video',Icon=video?Video:Image;
  const local=element.content?.startsWith('data:');
  let name=element.attributes?.['data-media-name']||'';
  if(!name&&element.content&&!local){try{name=decodeURIComponent(new URL(element.content).pathname.split('/').pop()||'');}catch{}}
  const patch=(updates:Partial<CanvasElement>)=>useEditorStore.getState().updateSpecificElement(element.id,updates);
  const props={autoplay:true,loop:true,muted:true,...element.videoProps};
  return <section className="border-t border-gray-200 dark:border-slate-700 pt-2">
    <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1 uppercase"><Icon size={12} className="text-brand-500"/>{t(video?'Video':'Image',language)}</h4>
    <div className="text-[11px] text-gray-500 dark:text-slate-400 mb-2 truncate" title={name}>{name||t(local?'Embedded file':'Linked media',language)}</div>
    <button type="button" disabled={busy} onClick={()=>void replaceFile(element)} className="flex items-center justify-center gap-2 w-full px-3 py-2 mb-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 hover:border-brand-400 disabled:opacity-50"><FolderOpen size={15}/>{t(busy?'Opening':'Replace file',language)}</button>
    <label className="block mb-2"><span className={labelClass}>Вписывание в рамку</span><select aria-label="Вписывание в рамку" className={inputClass} value={element.style.objectFit||'fill'} onChange={e=>useEditorStore.getState().updateElementStyle('objectFit',e.target.value)}>
      <option value="fill">Растянуть без обрезки</option><option value="contain">Поместить целиком</option><option value="cover">Заполнить с обрезкой</option>
    </select></label>
    {!video&&<label className="block mb-2"><span className={labelClass}>Alt · описание изображения</span><input className={inputClass} maxLength={320} value={element.attributes?.alt||''} onChange={e=>patch({attributes:{...element.attributes,alt:e.target.value}})}/></label>}
    {video&&<div className="space-y-1 my-2">{(['autoplay','loop','muted'] as const).map(key=><button key={key} type="button" role="switch" aria-checked={props[key]} onClick={()=>patch({videoProps:{...props,[key]:!props[key]}})} className="flex items-center justify-between gap-2 w-full py-1 text-[11px] text-gray-600 dark:text-slate-300">
      <span>{t({autoplay:'Autoplay',loop:'Loop',muted:'Muted'}[key],language)}</span>
      <span aria-hidden="true" className={`w-7 h-4 p-0.5 rounded-full transition-colors ${props[key]?'bg-brand-500':'bg-gray-300 dark:bg-slate-600'}`}><span className={`block w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${props[key]?'translate-x-3':''}`}/></span>
    </button>)}</div>}
    <button type="button" aria-expanded={showUrl} onClick={()=>setShowUrl(v=>!v)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-brand-600"><ChevronDown size={12} style={{transform:showUrl?'rotate(180deg)':undefined}}/>{t('Use a URL',language)}</button>
    {showUrl&&<label className="block mt-2"><span className={labelClass}>URL</span><input type="text" inputMode="url" aria-label={t('Media URL',language)} className={inputClass} placeholder="https://…" value={local?'':element.content||''} onChange={e=>patch({content:e.target.value,attributes:{...element.attributes,'data-media-name':''}})}/></label>}
    <MediaImportFeedback busy={busy} error={error} onDismiss={dismissError}/>
  </section>;
}
