import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Play, Check, Code2, Download, Upload, Save, Plus, Trash2, Search, Layers } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import { ShaderConfig, isShaderConfig, shaderSupports, shaderCanApply, shaderUsesSource, SHADER_TARGET_LABELS } from '../../types/shaders';
import { SHADER_PRESETS } from '../../utils/shaderPresets';
import { ShaderGallery, ShaderTile } from './ShaderGallery';
import { ShaderCodeDialog } from './ShaderCodeDialog';
import { ShaderSettings } from './ShaderSettings';
import { ShaderPreview } from './ShaderPreview';
import { EditorSelect } from '../ui/EditorSelect';
import { EditorDisclosure } from '../ui/EditorDisclosure';
import { EditorConfirm } from '../ui/EditorConfirm';
import './shaders.css';
const LIBRARY = 'powerweb.shaders.v1';
const CATEGORIES = [
  {id:'all',label:'Все эффекты'}, {id:'surface',label:'Фон слоя'}, {id:'object',label:'Объекты'},
  {id:'media',label:'Фото / видео'}, {id:'text',label:'Только текст'}, {id:'saved',label:'Мои'},
] as const;
const TRIGGERS=[{id:'all',label:'Все'},{id:'pointer',label:'Курсор'},{id:'hover',label:'Наведение'},{id:'click',label:'Нажатие'},{id:'none',label:'Постоянно'}] as const;
function readLibrary(): ShaderConfig[] {
  try { const data=JSON.parse(localStorage.getItem(LIBRARY)||'[]'); return Array.isArray(data)?data.filter(isShaderConfig).slice(0,40):[]; } catch { return []; }
}
export function ShaderEditor() {
  return useEditorStore(s=>s.showShaderEditor) ? <EditorDialog /> : null;
}
function EditorDialog() {
  const selected = useSelectedElement();
  const project = useEditorStore(s=>s.project);
  const originals = useRef(project);
  const activeLayerId = useEditorStore(s=>s.activeLayerId);
  const page = project.pages.find(p=>p.id===project.activePageId)!;
  const [layerId,setLayerId] = useState(activeLayerId);
  const pendingPreset = useEditorStore(s=>s.shaderPresetId);
  const initialPreset=SHADER_PRESETS.find(p=>p.id===pendingPreset)?.config;
  const requestedScope=useEditorStore(s=>s.shaderEditorScope);
  const [scope,setScope] = useState<'layer'|'object'>(()=>{
    if(requestedScope)return requestedScope;
    if(initialPreset)return selected&&shaderCanApply(initialPreset,selected.type)?'object':shaderCanApply(initialPreset)?'layer':'object';
    return selected&&shaderSupports(selected.type)?'object':'layer';
  });
  const selectedLayer = page.layers.find(l=>l.id===layerId);
  const titleId = useId();
  const [targetId,setTargetId]=useState(()=>selected&&shaderSupports(selected.type)?selected.id:'');
  const targets=page.layers.flatMap(layer=>layer.elements).filter(element=>shaderSupports(element.type));
  const target=targets.find(element=>element.id===targetId)||null;
  const objectName=(element:typeof target)=>element?({text:'Текст',image:'Фото',video:'Видео',button:'Кнопка'}[element.type]||'Фигура')+' · '+(element.type==='text'||element.type==='button'?element.content?.slice(0,28)||'Без текста':element.attributes?.title||element.attributes?.alt||String(targets.indexOf(element)+1)):'Объект не выбран';
  const [config,setConfig] = useState<ShaderConfig>(()=>structuredClone(SHADER_PRESETS.find(p=>p.id===pendingPreset)?.config || (scope==='object'?target?.shader:selectedLayer?.shader) || SHADER_PRESETS.find(p=>shaderCanApply(p.config,scope==='object'?target?.type:undefined))?.config || SHADER_PRESETS[0].config));
  const [allEffects,setAllEffects]=useState(scope==='layer'||!target);
  const [creatingCode,setCreatingCode]=useState(false);
  const [pickDestination,setPickDestination]=useState(false);
  const compactText=scope==='object'&&config.target==='text';
  const [baseline,setBaseline] = useState(config);
  const [code,setCode] = useState(config.fragment);
  const [library,setLibrary] = useState(readLibrary);
  const [tab,setTab] = useState<'settings'|'code'>('settings');
  const [category,setCategory] = useState<typeof CATEGORIES[number]['id']>('all');
  const [trigger,setTrigger]=useState<typeof TRIGGERS[number]['id']>('all');
  const [search,setSearch] = useState('');
  const [paused,setPaused] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [hasApplied,setHasApplied]=useState(false);
  const [pendingChoice,setPendingChoice]=useState<ShaderConfig|null>(null);
  const [compiled,setCompiled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const unsentCode = code !== config.fragment;
  const ready = compiled && !unsentCode && isShaderConfig(config);
  const close = () => { useEditorStore.getState().commitTransaction(); useEditorStore.setState({showShaderEditor:false,shaderPresetId:null,shaderEditorScope:null}); };
  useEffect(()=>{
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    const fit=()=>dialog.current?.style.setProperty('--sh-ui-zoom',String(Number(getComputedStyle(document.body).zoom)||1));
    fit();const zoomObserver=new MutationObserver(fit);zoomObserver.observe(document.body,{attributes:true,attributeFilter:['style']});
    return ()=>{zoomObserver.disconnect();previous?.focus();};
  },[]);
  const patch = (next:Partial<ShaderConfig>) => setConfig(current=>({...current,...next}));
  const choose = (next:ShaderConfig, discardCode=false) => {
    if (unsentCode && !discardCode) {setPendingChoice(next);return;}
    if (next.fragment !== config.fragment) {setCompiled(false);setError('');}
    if(target&&!shaderCanApply(next,target.type))setAllEffects(true);
    if(!shaderCanApply(next))setScope('object');
    else if(scope==='object'&&!shaderCanApply(next,target?.type))setScope('layer');
    const copy = structuredClone({...next,size:config.size??100,opacity:config.opacity,
      ...(shaderUsesSource(next)?{}:{backgroundColor:config.backgroundColor||next.backgroundColor||'#111827',backgroundOpacity:config.backgroundOpacity??next.backgroundOpacity??1})});
    setConfig(copy); setBaseline(copy); setCode(copy.fragment); setNotice('');
  };
  const reset = () => {
    if(baseline.fragment !== config.fragment) setCompiled(false);
    setConfig(structuredClone(baseline)); setCode(baseline.fragment); setNotice('Параметры восстановлены.');
  };
  const compile = () => {
    if (code === config.fragment) return;
    if (!code.trim() || code.length>30000) { setNotice('GLSL: от 1 до 30 000 символов.'); return; }
    setCompiled(false); patch({fragment:code});
  };
  const editable = () => {
    const s=useEditorStore.getState();
    const page=s.project.pages.find(p=>p.id===s.project.activePageId);
    const layer=scope==='object' && target ? page?.layers.find(l=>l.elements.some(e=>e.id===target.id)) : page?.layers.find(l=>l.id===layerId);
    if(!layer || layer.locked || !layer.visible) { setNotice('Выберите видимый незаблокированный слой.'); return false; }
    return true;
  };
  const apply = () => {
    if (!ready || !compatible || !editable()) return;
    const s=useEditorStore.getState(); s.commitTransaction();
    if (scope==='object' && target) s.updateSpecificElement(target.id,{shader:config});
    else s.setLayerShader(layerId,config);
    setHasApplied(true);
    setNotice(scope==='layer'?`Применено: ${selectedLayer?.name}`:'Применено к объекту');
  };
  const saveLibrary = () => {
    if (!ready) return;
    const next=[structuredClone(config),...library].slice(0,40);
    try { localStorage.setItem(LIBRARY,JSON.stringify(next)); setLibrary(next); setNotice('Вариант сохранён. Откройте категорию «Мои».'); }
    catch { setNotice('Библиотека недоступна. Скачайте шейдер отдельным файлом.'); }
  };
  const download = () => {
    const blob=new Blob([JSON.stringify({version:1,shader:config},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url; link.download=(config.name.replace(/[^\p{L}\p{N}_-]/gu,'_')||'shader')+'.pws';
    link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const matches = (name:string) => name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const gallery = SHADER_PRESETS.filter(item=>(allEffects||!target||shaderCanApply(item.config,target.type)) && (category==='all'||(item.config.target||'surface')===category) && (trigger==='all'||(item.config.interaction||'none')===trigger) && matches(item.config.name));
  const saved = library.map((item,index)=>({item,index})).filter(({item})=>(allEffects||!target||shaderCanApply(item,target.type))&&(trigger==='all'||(item.interaction||'none')===trigger)&&matches(item.name));
  const compatible=scope==='layer'?shaderCanApply(config):!!target&&shaderCanApply(config,target.type);
  const objectLayer=target?page.layers.find(layer=>layer.elements.some(e=>e.id===target.id)):undefined;
  const canApply = compatible&&(scope==='layer' ? !!selectedLayer && selectedLayer.visible && !selectedLayer.locked : !!target&&!!objectLayer?.visible&&!objectLayer?.locked);
  const compatibilityLabel=compatible?(scope==='layer'?'Фон под объектами слоя':objectName(target)):config.target==='text'?'Выберите текст на холсте, чтобы применить этот эффект.':config.target==='media'?'Выберите фото или видео на холсте, чтобы применить этот эффект.':'Выберите совместимый объект или фон слоя.';
  const currentShader=scope==='layer'?selectedLayer?.shader:page.layers.flatMap(layer=>layer.elements).find(element=>element.id===target?.id)?.shader;
  const dirty=JSON.stringify(currentShader||null)!==JSON.stringify(config);
  const originalPage=originals.current.pages.find(p=>p.id===page.id);
  const originalShader=scope==='layer'?originalPage?.layers.find(layer=>layer.id===layerId)?.shader:originalPage?.layers.flatMap(layer=>layer.elements).find(element=>element.id===targetId)?.shader;
  const hasExisting = !!currentShader;
  const previewRatio = scope==='layer' ? page.width/page.height : target ? target.width/target.height : page.width/page.height;
  return createPortal(<dialog ref={dialog} className={`shader-dialog editor-shell${scope==='object'?' is-object':''}${compactText?' is-text':''}`} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
    e.stopPropagation(); if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();compile();}
  }}>
    <header className="shader-header"><Sparkles size={22}/><div><h1 id={titleId}>{compactText?'Шейдеры текста':'Шейдеры'}</h1></div>{scope==='object'&&target&&<button className="shader-target-chip" type="button" aria-expanded={pickDestination} onClick={()=>setPickDestination(v=>!v)} title="Выбрать другой объект">{objectName(target)} ▾</button>}<button type="button" onClick={close} aria-label="Закрыть редактор"><X size={20}/></button></header>
    <div className="shader-body">
      <aside className="shader-library" aria-label="Галерея шейдеров">
        {(!compactText||allEffects)&&<><label className="shader-search"><Search size={16}/><input type="text" inputMode="search" placeholder="Найти эффект" aria-label="Найти эффект" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button type="button" aria-label="Очистить поиск" onClick={()=>setSearch('')}><X size={13}/></button>}</label>
        <div className="shader-category-select"><span>Коллекция</span><EditorSelect label="Коллекция шейдеров" value={category} onChange={value=>setCategory(value as typeof category)} options={CATEGORIES.map(item=>({value:item.id,label:item.label}))}/></div>
        <div className="shader-filter-row" role="group" aria-label="Запуск эффекта">{TRIGGERS.map(item=><button key={item.id} aria-pressed={trigger===item.id} onClick={()=>setTrigger(item.id)}>{item.label}</button>)}</div>
        </>}
        {target&&<div className="shader-context-filter"><span>{allEffects?'Каталог':compactText?'Для текста':'Для объекта'}</span><button type="button" onClick={()=>{setAllEffects(v=>!v);setCategory('all');setTrigger('all');setSearch('');}}>{allEffects?'Совместимые':'Все эффекты'}</button></div>}
        <div className="shader-gallery-scroll">
          {category==='saved' ? <>
            {!saved.length && <p className="shader-empty">{search?'Ничего не найдено.':'Здесь будут ваши варианты. Настройте эффект и нажмите «Сохранить вариант».'}</p>}
            <div className="shader-icon-grid">{saved.map(({item,index})=><div className="shader-saved" key={index}><ShaderTile shader={item} onSelect={choose}/><button className="shader-delete" aria-label={`Удалить ${item.name}`} onClick={()=>{
              const next=library.filter((_,i)=>i!==index);try{localStorage.setItem(LIBRARY,JSON.stringify(next));setLibrary(next);}catch{setNotice('Не удалось обновить библиотеку.');}
            }}><Trash2 size={12}/></button></div>)}</div>
          </> : <>
            {!gallery.length && <p className="shader-empty">Ничего не найдено. Измените запрос или категорию.</p>}
            <ShaderGallery presets={gallery} selected={config} onSelect={choose} grouped={category==='all'&&allEffects}/>
          </>}
        </div>
        <button className="shader-new" onClick={()=>setCreatingCode(true)}><Plus size={16}/> Создать кодом</button>
      </aside>
      <section className="shader-workspace">
        <div className="shader-toolbar"><div role="group" aria-label="Раздел редактора"><button aria-pressed={tab==='settings'} onClick={()=>setTab('settings')}>Настройки</button><button title="Код GLSL" aria-label="Код GLSL" aria-pressed={tab==='code'} onClick={()=>setTab('code')}><Code2 size={15}/><span>Код GLSL</span></button></div>
          <div><button disabled={!ready} onClick={saveLibrary} title="Сохранить вариант в локальную библиотеку"><Save size={15}/><span>Сохранить вариант</span></button><button disabled={!ready} onClick={download} title="Скачать .pws" aria-label="Скачать шейдер"><Download size={16}/></button><button onClick={()=>upload.current?.click()} title="Импорт .pws / .json" aria-label="Импорт шейдера"><Upload size={16}/></button></div>
        </div>
        {(scope==='layer'||!target||pickDestination)&&<div className="shader-destination-bar">
          <div className="shader-field"><span>Применить к</span><EditorSelect label="Применить к" value={scope} onChange={value=>{setScope(value as typeof scope);setError('');}} options={[{value:'layer',label:'Фон слоя',disabled:!shaderCanApply(config)},{value:'object',label:'Объект'}]}/></div>
          {scope==='layer'?<div className="shader-field"><span>Слой</span><EditorSelect label="Слой" value={layerId} onChange={setLayerId} options={page.layers.map(layer=>({value:layer.id,label:layer.name+(layer.locked?' · заблокирован':!layer.visible?' · скрыт':'')}))}/></div>:<div className="shader-field"><span>Объект на странице</span><EditorSelect label="Объект для эффекта" value={targetId} onChange={id=>{setTargetId(id);setError('');}} options={[{value:'',label:'Демонстрационный образец'},...targets.map(element=>({value:element.id,label:objectName(element),disabled:!shaderCanApply(config,element.type)}))]}/></div>}

        </div>}
        <div className="shader-work-scroll">
          {!compatible&&<div className={`shader-compatibility${compatible?'':' is-incompatible'}`}><Sparkles size={14}/><span>{SHADER_TARGET_LABELS[config.target||'surface']} · {compatibilityLabel}</span></div>}
          <ShaderPreview target={scope==='object'&&compatible?target||undefined:undefined} objectScope={scope==='object'||!!config.target&&config.target!=='surface'} shader={config} originalShader={originalShader} baseColor={scope==='layer'?page.backgroundColor:target?.style.fill} ratio={previewRatio} pageWidth={scope==='object'&&target?target.width:page.width} backgroundColor={scope==='object'?target?.style.fill:undefined} layer={scope==='layer'&&shaderCanApply(config)?selectedLayer:undefined} paused={paused} onPause={()=>setPaused(v=>!v)} onError={message=>{setError(message);setCompiled(!message);}}/>
          {error && <pre role="alert" className="shader-error">{error}</pre>}
          {notice && <p role="status" className="shader-notice">{notice}<button onClick={()=>setNotice('')} aria-label="Скрыть сообщение"><X size={13}/></button></p>}
          {tab==='settings' ? <ShaderSettings shader={config} onChange={patch} onReset={reset}/> : <section className="shader-code"><div><span>Фрагментный шейдер · WebGL 1</span><button onClick={compile} disabled={!unsentCode}><Play size={14}/> Скомпилировать <small>Ctrl ↵</small></button></div>
            <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} aria-label="Код фрагментного шейдера GLSL" maxLength={30000}/>
            <EditorDisclosure label="Переменные для собственных эффектов"><p><code>u_mouse</code>, <code>u_trail</code>, <code>u_clickPosition</code> — координаты от 0 до 1, начало снизу слева. <code>u_hover</code> — плавное наведение, <code>u_click</code> — затухание нажатия, <code>u_clickAge</code> — секунды после нажатия.</p><p><code>u_source</code> — текстура фото, кадра видео или букв, <code>u_sourceSize</code> — её размер, <code>u_amount</code> — смешивание с оригиналом. <code>u_surfaceSize</code> — размер документа, <code>u_size</code> — размер эффекта в %, <code>u_time</code>, <code>u_resolution</code>, <code>u_colorA</code>, <code>u_colorB</code>, <code>u_scale</code>, <code>u_intensity</code>, <code>u_radius</code>, <code>u_strength</code>. Выход: <code>gl_FragColor</code>.</p></EditorDisclosure>
          </section>}
        </div>
      </section>
    </div>
    <footer className="shader-footer"><span>{unsentCode?'Скомпилируйте изменённый код.':!compatible?compatibilityLabel:!canApply?'Слой скрыт или заблокирован.':!dirty?'Изменений нет':scope==='layer'?`Под объектами · ${selectedLayer?.name}`:'Эффект выбранного объекта'}</span><div>
      {hasExisting && <button className="shader-remove" onClick={()=>{if(!editable())return;const s=useEditorStore.getState();s.commitTransaction();if(scope==='layer')s.setLayerShader(layerId,null);else if(target)s.updateSpecificElement(target.id,{shader:null});close();}} title="Убрать эффект" aria-label="Убрать эффект"><Trash2 size={15}/></button>}
      <button onClick={close}>{hasApplied?'Закрыть':'Отмена'}</button><button className="shader-apply" disabled={!ready||!canApply||!dirty} onClick={apply}>{scope==='layer'?<Layers size={16}/>:<Check size={16}/>} {scope==='layer'?'Применить к выбранному слою':'Применить'}</button>
    </div></footer>
    {creatingCode&&<ShaderCodeDialog target={scope==='object'?target:undefined} canApply={scope==='layer'?!!selectedLayer?.visible&&!selectedLayer?.locked:!!objectLayer?.visible&&!objectLayer?.locked} applyLabel="Создать и применить" onClose={()=>setCreatingCode(false)} onCreate={next=>{
      if(!editable())return;
      const state=useEditorStore.getState();state.commitTransaction();
      if(scope==='object'&&target)state.updateSpecificElement(target.id,{shader:next});else state.setLayerShader(layerId,next);
      try{localStorage.setItem(LIBRARY,JSON.stringify([next,...library].slice(0,40)));}catch{}
      close();
    }}/>}
    {pendingChoice&&<EditorConfirm message="Заменить несохранённый GLSL-код выбранным эффектом?" onCancel={()=>setPendingChoice(null)} onConfirm={()=>{choose(pendingChoice,true);setPendingChoice(null);}}/>}
    <input ref={upload} hidden type="file" accept=".pws,.json" onChange={async e=>{
      const file=e.target.files?.[0];e.target.value='';if(!file)return;
      try{if(file.size>100000)throw new Error('Файл слишком большой (максимум 100 КБ).');const data=JSON.parse(await file.text());const value=data.shader??data;if(!isShaderConfig(value))throw new Error('Неверный формат шейдера.');choose(value);}catch(err){setNotice(err instanceof Error?err.message:String(err));}
    }}/>
  </dialog>,document.body);
}
