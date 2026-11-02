import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorNumber } from '../ui/EditorNumber';
import { EditorSelect } from '../ui/EditorSelect';
import { LANGUAGES } from '../../utils/languages';
export function ExportPageSettings({inputClass,labelClass}:{inputClass:string;labelClass:string}){
  const state=useEditorStore(),page=state.project.pages.find(page=>page.id===state.project.activePageId);if(!page)return null;
  return <section className="view-controls border-t border-gray-200 dark:border-slate-700 pt-2 space-y-2">
    <h4 className="text-[10px] font-bold uppercase">Экспорт сайта</h4>
    <button type="button" role="switch" aria-checked={page.responsive!==false} onClick={()=>state.updatePageProperty('responsive',page.responsive===false)} className="view-toggle"><span className="view-toggle-track" aria-hidden="true"><span/></span><span>Адаптация на узких экранах</span></button>
    {page.responsive!==false&&<label className="flex items-center justify-between gap-2"><span className={labelClass}>Брейкпоинт, px</span><EditorNumber label="Брейкпоинт экспорта" value={page.mobileBreakpoint||768} min={320} max={1600} step={16} onChange={value=>state.updatePageProperty('mobileBreakpoint',value)}/></label>}
    <label className="block"><span className={labelClass}>Язык сайта</span><EditorSelect label="Язык экспортируемого сайта" value={(state.project.language||'en').split('-')[0]} onChange={language=>state.updateProjectMetadata('language',language)} options={LANGUAGES.map(language=>({value:language.code==='tj'?'tg':language.code,label:language.name}))}/></label>
    <label className="block"><span className={labelClass}>Описание страницы (SEO)</span><textarea className={inputClass} rows={3} maxLength={320} value={page.description||''} onChange={e=>state.updatePageProperty('description',e.target.value)}/></label>
  </section>;
}
