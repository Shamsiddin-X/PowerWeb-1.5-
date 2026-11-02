import React from 'react';
import { CanvasElement } from '../../types';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSelect } from '../ui/EditorSelect';
export function SemanticProperties({element,inputClass,labelClass}:{element:CanvasElement;inputClass:string;labelClass:string}){
  const state=useEditorStore();
  if(['image','video','line'].includes(element.type))return null;
  const patch=(updates:Partial<CanvasElement>)=>state.updateSpecificElement(element.id,updates);
  return <section className="view-controls border-t border-gray-200 dark:border-slate-700 pt-2 space-y-2">
    <h4 className="text-[10px] font-bold uppercase">HTML · Семантика</h4>
    <EditorSelect label="HTML-тег" value={element.tagName||''} onChange={tag=>patch({tagName:tag||undefined})} options={[{value:'',label:'Автоматически'},...['div','section','article','header','nav','footer','aside','p','h1','h2','h3','h4','h5','h6','button','a'].map(tag=>({value:tag,label:'<'+tag+'>'}))]}/>
    {(element.tagName==='a'||element.type==='button')&&<label className="block"><span className={labelClass}>Ссылка</span><input className={inputClass} placeholder="https://…" value={element.attributes?.href||''} onChange={e=>patch({attributes:{...element.attributes,href:e.target.value}})}/></label>}
    <label className="block"><span className={labelClass}>Название для доступности</span><input className={inputClass} value={element.attributes?.['aria-label']||''} onChange={e=>patch({attributes:{...element.attributes,'aria-label':e.target.value}})}/></label>
  </section>;
}
