import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ShaderConfig, ShaderInteraction, shaderUsesSource } from '../../types/shaders';
import { Slider } from '../ui/Slider';
import { EditorNumber } from '../ui/EditorNumber';
import { EditorSelect } from '../ui/EditorSelect';
import { EditorColor } from '../ui/EditorColor';
import { EditorDisclosure } from '../ui/EditorDisclosure';
export const SHADER_MODES=[{value:'none',label:'Постоянно'},{value:'pointer',label:'Движение мыши'},{value:'hover',label:'При наведении'},{value:'click',label:'При нажатии'}];
export function ShaderSettings({shader,onChange,onReset}: {shader:ShaderConfig;onChange:(patch:Partial<ShaderConfig>)=>void;onReset:()=>void}) {
  const content=shaderUsesSource(shader),text=shader.target==='text';
  const colorKeys: ('colorA' | 'colorB' | 'backgroundColor')[] = content ? ['colorA', 'colorB'] : ['colorA', 'colorB', 'backgroundColor'];
  const uses=(uniform:string)=>(shader.fragment.match(new RegExp('\\b'+uniform+'\\b','g'))||[]).length>1;
  const source=shader.fragment.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
  const hasTime=/\bt\b/.test(source.replace(/float\s+t\s*=\s*u_time\s*;/g,''))||/u_time/.test(source.replace(/uniform[^;]*u_time[^;]*;/g,'').replace(/float\s+t\s*=\s*u_time\s*;/g,''));
  const interactive=!!shader.interaction&&shader.interaction!=='none';
  const control=(key:'opacity'|'backgroundOpacity'|'size'|'scale'|'intensity'|'speed'|'radius'|'strength'|'response',label:string,min:number,max:number,step:number,fallback=0,suffix?:string)=>{
    const opacity=key==='opacity'||key==='backgroundOpacity';
    const raw=shader[key]??fallback,value=Number((opacity?raw*100:raw).toFixed(3));
    const change=(next:number)=>onChange({[key]:opacity?next/100:next});
    return <div className="shader-control" key={key}><div className="shader-control-main"><span>{label}</span><Slider aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>change(Number(e.target.value))}/></div><EditorNumber label={label} min={min} max={max} step={step} value={value} suffix={opacity?'%':suffix} onChange={change}/></div>;
  };
  const toggle=(label:string,checked:boolean,change:(value:boolean)=>void)=><button type="button" className="shader-toggle" role="switch" aria-checked={checked} onClick={()=>change(!checked)}><span className="shader-toggle-track"><span/></span>{label}</button>;
  const background=!shader.target||shader.target==='surface';
  const size=(background||uses('u_size'))&&control('size',background?'Размер узора':'Масштаб эффекта',10,400,5,100,'%');
  return <div className="shader-settings">
    <div className="shader-settings-heading"><span>Параметры</span><button onClick={onReset} title="Сбросить параметры" aria-label="Сбросить параметры"><RotateCcw size={15}/></button></div>
    <div className="shader-colors">{colorKeys.filter(key=>key==='backgroundColor'||uses(key==='colorA'?'u_colorA':'u_colorB')).map(key=><EditorColor key={key} label={key==='backgroundColor'?'Фон':key==='colorA'?'Цвет 1':'Цвет 2'} value={shader[key]||'#111827'} onChange={color=>onChange({[key]:color})}/>)}</div>
    <div className="shader-compact-grid">{control('opacity',content?'Сила эффекта':'Непрозрачность эффекта',0,100,1)}{!content&&control('backgroundOpacity','Непрозрачность фона',0,100,1,1)}</div>
    {!text&&size&&<div className="shader-inline-size">{size}{background&&<span className="text-[10px] text-gray-500">Меньше значение — мельче узор. 100% — стандартный размер.</span>}</div>}
    <div className="shader-behavior">{hasTime&&toggle('Анимация',shader.animated!==false,animated=>onChange({animated}))}{interactive&&toggle('Реакция на курсор',shader.interactive!==false,value=>onChange({interactive:value}))}</div>
    {hasTime&&shader.animated!==false&&control('speed','Скорость',0,5,.05,1)}
    <EditorDisclosure label="Дополнительно"><div className="shader-compact-grid">
      {text&&size}{uses('u_intensity')&&control('intensity','Яркость',0,3,.05,1)}
      {uses('u_scale')&&control('scale','Плотность',.2,10,.1,1)}
      {interactive&&shader.interactive!==false&&control('response','Плавность курсора',0,1,.01,.18,'с')}
      {uses('u_radius')&&control('radius','Радиус',.05,1,.01,.28)}
      {uses('u_strength')&&control('strength','Сила искажения',0,3,.05,1)}
    </div>
      <div className="shader-field shader-mode"><span>Запуск</span><EditorSelect label="Запуск эффекта" value={shader.interaction||'none'} options={SHADER_MODES} onChange={value=>onChange({interaction:value as ShaderInteraction})}/></div>
      <label className="shader-field">Название<input type="text" aria-label="Название шейдера" maxLength={100} value={shader.name} onChange={e=>onChange({name:e.target.value})}/></label>
    </EditorDisclosure>
  </div>;
}
