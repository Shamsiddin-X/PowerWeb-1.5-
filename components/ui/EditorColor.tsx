import React, { useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { EditorFlyout } from './EditorFlyout';
type HSV={h:number;s:number;v:number};
function toHex({h,s,v}:HSV) {
  const f=(n:number)=>{const k=(n+h/60)%6;return Math.round(255*(v-v*s*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0');};
  return '#'+f(5)+f(3)+f(1);
}
function toHSV(hex:string):HSV {
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  return {h:d===0?0:((max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60),s:max===0?0:d/max,v:max};
}
const PALETTE=[['#9bc1ed','#609ee2','#3083db','#206cc7','#2056a0'],['#96eca6','#4ddd7b','#32c96f','#2cba89','#249970'],['#fff36c','#fae758','#f7d72a','#f5c426','#e6a519'],['#ffc36e','#ffa241','#ff850a','#ea6703','#bf4705'],['#fa6456','#f03243','#e41629','#be1d2c','#9e2634'],['#db8cdb','#bc60cc','#9145ad','#7d3e97','#603774'],['#ccaa8f','#b4845d','#956944','#815a3d','#60472f'],['#ffffff','#f5f5f5','#dededc','#c5c5c4','#999999'],['#7d7a80','#5f5c65','#403b49','#272331','#111111']];
const CUSTOM_KEY='powerweb.custom-colors.v1';
export function EditorColor({value,onChange,label}: {value:string;onChange:(color:string)=>void;label:string}) {
  const trigger=useRef<HTMLButtonElement>(null);const original=useRef(value);const [open,setOpen]=useState(false);
  return <><button ref={trigger} type="button" className="editor-color-trigger" aria-label={`${label}: ${value}`} aria-expanded={open} onClick={()=>{if(open){onChange(original.current);setOpen(false);}else{original.current=value;setOpen(true);}}}><span className="editor-color-chip" style={{background:value}}/><span>{label}</span></button>
    {open&&<ColorPanel anchor={trigger} initial={value} label={label} onPreview={onChange} onClose={(_accepted,color)=>{onChange(color);setOpen(false);trigger.current?.focus();}}/>}</>;
}
function ColorPanel({anchor,initial,onPreview,onClose,label}: {anchor:React.RefObject<HTMLButtonElement|null>;initial:string;onPreview:(value:string)=>void;onClose:(accepted:boolean,color:string)=>void;label:string}) {
  const [hsv,setHsv]=useState(()=>toHSV(initial));const [hex,setHex]=useState(initial.toUpperCase());
  const [tab,setTab]=useState<'palette'|'custom'>('palette');
  const [saved]=useState<string[]>(()=>{
    const first=initial.toLowerCase();
    try{const colors=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]');return [first,...(Array.isArray(colors)?colors.filter(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)&&c.toLowerCase()!==first).map(c=>c.toLowerCase()):[])].slice(0,8);}catch{return [first];}
  });
  const current=toHex(hsv);
  const baseline=useRef(initial); // The original value stays stable while live preview updates the parent.
  const change=(next:HSV)=>{setHsv(next);const color=toHex(next);setHex(color.toUpperCase());onPreview(color);};
  const select=(color:string)=>change(toHSV(color));
  const cancel=()=>onClose(false,baseline.current);
  const point=(event:React.PointerEvent<HTMLDivElement>,kind:'sv'|'hue')=>{
    const rect=event.currentTarget.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
    change(kind==='hue'?{...hsv,h:Math.min(359.99,y*360)}:{...hsv,s:x,v:1-y});
  };
  return <EditorFlyout anchor={anchor} onClose={cancel} label={`Выбор цвета: ${label}`} width={330} trapFocus>
    <div className="editor-color-header"><button type="button" onClick={cancel}>Отмена</button><strong>{label}</strong><button type="button" className="editor-color-accept" onClick={()=>{
      const next=[current,...saved.filter(c=>c!==current)].slice(0,8);try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(next));}catch{}onClose(true,current);
    }}>Выбрать</button></div>
    <div className="editor-color-tabs" role="group" aria-label="Режим выбора цвета"><button type="button" aria-pressed={tab==='palette'} onClick={()=>setTab('palette')}>Палитра</button><button type="button" aria-pressed={tab==='custom'} onClick={()=>setTab('custom')}>Свой цвет</button></div>
    {tab==='palette'?<div className="editor-color-palette">{PALETTE.map((column,i)=><div key={i}>{column.map(color=><button key={color} type="button" style={{background:color}} aria-label={color} aria-pressed={current===color} onClick={()=>select(color)}>{current===color&&<Check size={14}/>}</button>)}</div>)}</div>:<div className="editor-color-custom">
      <div className="editor-color-hex"><span style={{background:current}}/><input type="text" aria-label="Цвет HEX" spellCheck={false} maxLength={7} value={hex} aria-invalid={!/^#[0-9a-f]{6}$/i.test(hex)} onChange={e=>{
        const next=e.target.value;setHex(next);if(/^#[0-9a-f]{6}$/i.test(next)){setHsv(toHSV(next));onPreview(next);}
      }} onBlur={()=>setHex(current.toUpperCase())}/></div>
      <div className="editor-color-plane">
        <div role="slider" aria-label="Оттенок" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv.h)} tabIndex={0} className="editor-color-hue" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e,'hue');}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))point(e,'hue');}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();change({...hsv,h:(hsv.h+(e.key==='ArrowDown'?1:359))%360});}}}><i style={{top:`${hsv.h/360*100}%`}}/></div>
        <div role="slider" aria-label="Насыщенность и яркость" aria-valuetext={current} aria-valuenow={Math.round(hsv.s*100)} aria-valuemin={0} aria-valuemax={100} tabIndex={0} className="editor-color-sv" style={{backgroundColor:`hsl(${hsv.h},100%,50%)`}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e,'sv');}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))point(e,'sv');}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{
          if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
          change({...hsv,s:Math.max(0,Math.min(1,hsv.s+(e.key==='ArrowRight'?0.01:e.key==='ArrowLeft'?-.01:0))),v:Math.max(0,Math.min(1,hsv.v+(e.key==='ArrowUp'?0.01:e.key==='ArrowDown'?-.01:0)))});
        }}><i style={{left:`${hsv.s*100}%`,top:`${(1-hsv.v)*100}%`}}/></div>
      </div>
    </div>}
    <div className="editor-color-saved"><button type="button" aria-label="Создать свой цвет" onClick={()=>setTab('custom')}><Plus size={16}/></button>{saved.map(color=><button key={color} type="button" aria-label={`Сохранённый цвет ${color}`} style={{background:color}} onClick={()=>select(color)}>{current===color&&<Check size={13}/>}</button>)}</div>
  </EditorFlyout>;
}
