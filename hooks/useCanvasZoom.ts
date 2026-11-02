// hooks/useCanvasZoom.ts — Ctrl+Wheel zoom

import React, { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export function useCanvasZoom(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const scale = useEditorStore(s => s.scale);
  const setScale = useEditorStore(s => s.setScale);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5.0);
        setScale(newScale);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale, setScale, scrollContainerRef]);
}
