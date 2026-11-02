import { useEditorStore } from '../store/useEditorStore';
export function centerCanvasInViewport(){
  const viewport=document.querySelector<HTMLElement>('[data-canvas-viewport]');
  const canvas=viewport?.querySelector<HTMLElement>('[data-shader-page]');
  if(!viewport||!canvas)return;
  const area=viewport.getBoundingClientRect(),bounds=canvas.getBoundingClientRect();
  const zoom=area.width/Math.max(1,viewport.offsetWidth);
  const x=Math.max(24,(viewport.clientWidth-bounds.width/zoom)/2);
  const y=Math.max(24,(viewport.clientHeight-bounds.height/zoom)/2);
  viewport.scrollLeft+=(bounds.left-area.left)/zoom-x;
  viewport.scrollTop+=(bounds.top-area.top)/zoom-y;
}
export function fitCanvasToViewport(){
  const state=useEditorStore.getState(),page=state.project.pages.find(p=>p.id===state.project.activePageId);
  const viewport=document.querySelector<HTMLElement>('[data-canvas-viewport]');
  if(!page||!viewport)return;
  state.setScale(Math.min((viewport.clientWidth-64)/page.width,(viewport.clientHeight-64)/page.height));
  requestAnimationFrame(centerCanvasInViewport);
}
