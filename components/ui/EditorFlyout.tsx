import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './editorControls.css';

/** Render inside the owning modal so the popup remains in its focus and top layer. */
export function EditorFlyout({anchor,onClose,children,label,width=240,trapFocus=false}: {
  anchor:React.RefObject<HTMLElement|null>;onClose:()=>void;children:React.ReactNode;label:string;width?:number;trapFocus?:boolean;
}) {
  const panel=useRef<HTMLDivElement>(null);
  const latest=useRef(onClose);latest.current=onClose;
  const [position,setPosition]=useState({left:0,top:0,width,maxHeight:360});
  useLayoutEffect(()=>{
    const place=()=>{
      const node=anchor.current;if(!node)return;
      const rect=node.getBoundingClientRect(), zoom=Number(getComputedStyle(document.body).zoom)||1;
      const vw=innerWidth/zoom,vh=innerHeight/zoom,w=Math.min(width,vw-24);
      const below=vh-rect.bottom/zoom-12,above=rect.top/zoom-12;
      const height=Math.min((panel.current?.getBoundingClientRect().height||300)/zoom,Math.max(below,above),460);
      const up=below<height&&above>below;
      setPosition({left:Math.max(12,Math.min(rect.left/zoom,vw-w-12)),top:up?Math.max(12,rect.top/zoom-height-6):rect.bottom/zoom+6,width:w,maxHeight:Math.max(100,up?above-6:below-6)});
    };
    place();window.addEventListener('resize',place);
    const frame=requestAnimationFrame(()=>{place();panel.current?.querySelector<HTMLElement>('[aria-selected="true"], input, button')?.focus();});
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',place);};
  },[anchor,width]);
  useEffect(()=>{
    const outside=(e:PointerEvent)=>{if(!panel.current?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))latest.current();};
    document.addEventListener('pointerdown',outside,true);
    return ()=>document.removeEventListener('pointerdown',outside,true);
  },[anchor]);
  const host=anchor.current?.closest('dialog')||document.body;
  return createPortal(<div ref={panel} dir={anchor.current?.closest('[dir]')?.getAttribute('dir')||'ltr'} role="dialog" aria-label={label} className="editor-flyout editor-shell" style={position} onKeyDown={e=>{
    e.stopPropagation();
    if(trapFocus && e.key==='Tab'){
      const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(item=>item.getClientRects().length);
      if(items.length){e.preventDefault();const i=items.indexOf(document.activeElement as HTMLElement);items[(i+(e.shiftKey?-1:1)+items.length)%items.length]?.focus();}
    }
    if(e.key==='Escape'){e.preventDefault();latest.current();anchor.current?.focus();}
  }}>{children}</div>,host);
}
