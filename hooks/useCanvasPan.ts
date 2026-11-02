import React, { useState, useEffect, useCallback, useRef } from 'react';
interface PanState { startX: number; startY: number; scrollLeft: number; scrollTop: number; zoom: number; }
export function useCanvasPan(scrollContainerRef: React.RefObject<HTMLDivElement | null>) {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setPanning] = useState(false);
  const pan = useRef<PanState | null>(null);
  const endPan = useCallback(() => { pan.current = null; setPanning(false); }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.('button,input,textarea,select,[contenteditable="true"]')) return;
      if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    const blur = () => { setIsSpacePressed(false); endPan(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [endPan]);
  const startPan = useCallback((e: React.MouseEvent) => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    e.preventDefault();
    const zoom = sc.offsetWidth ? sc.getBoundingClientRect().width / sc.offsetWidth : 1;
    pan.current = { startX: e.clientX, startY: e.clientY, scrollLeft: sc.scrollLeft, scrollTop: sc.scrollTop, zoom: zoom || 1 };
    setPanning(true);
  }, [scrollContainerRef]);
  const movePan = useCallback((e: React.MouseEvent) => {
    const state = pan.current, sc = scrollContainerRef.current;
    if (!state || !sc) return false;
    sc.scrollLeft = state.scrollLeft - (e.clientX - state.startX) / state.zoom;
    sc.scrollTop = state.scrollTop - (e.clientY - state.startY) / state.zoom;
    return true;
  }, [scrollContainerRef]);
  return { isSpacePressed, isPanning, startPan, movePan, endPan };
}
