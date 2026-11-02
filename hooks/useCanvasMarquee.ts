// hooks/useCanvasMarquee.ts — Marquee (rubber-band) selection

import React, { useState, useCallback } from 'react';
import { canvasMetrics, canvasPoint } from '../utils/canvasCoordinates';
import { useEditorStore } from '../store/useEditorStore';

export interface MarqueeBox {
  x: number; y: number; w: number; h: number;
}

export function useCanvasMarquee(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const { activeLayerId, project, selectElement } = useEditorStore();
  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const activePage = project.pages.find(p => p.id === project.activePageId);

  /** Call on mousedown to begin marquee */
  const startMarquee = useCallback((e: React.MouseEvent) => {
    const metrics = canvasMetrics(containerRef.current, useEditorStore.getState().scale);
    if (!metrics) return;
    const { x, y } = canvasPoint(e.clientX, e.clientY, metrics);
    setStartPos({ x, y });
    setMarqueeBox({ x, y, w: 0, h: 0 });
  }, [containerRef]);

  /** Call on mousemove to update marquee */
  const updateMarquee = useCallback((e: React.MouseEvent) => {
    if (!startPos) return;
    const metrics = canvasMetrics(containerRef.current, useEditorStore.getState().scale);
    if (!metrics) return;
    const point = canvasPoint(e.clientX, e.clientY, metrics);
    const dx = point.x - startPos.x, dy = point.y - startPos.y;
    setMarqueeBox({
      x: dx < 0 ? startPos.x + dx : startPos.x,
      y: dy < 0 ? startPos.y + dy : startPos.y,
      w: Math.abs(dx),
      h: Math.abs(dy),
    });
  }, [startPos, containerRef]);

  /** Call on mouseup to commit selection */
  const endMarquee = useCallback((cancel = false) => {
    if (cancel || !marqueeBox || !activePage) { setMarqueeBox(null); setStartPos(null); return; }
    const { x, y, w, h } = marqueeBox;
    const layer = activePage.layers.find(l => l.id === activeLayerId);
    if (layer && !layer.locked && layer.visible) {
      layer.elements
        .filter(el => el.x < x + w && el.x + el.width > x && el.y < y + h && el.y + el.height > y)
        .forEach(el => { if (!useEditorStore.getState().selectedElementIds.includes(el.id)) selectElement(el.id, true); });
    }
    setMarqueeBox(null);
    setStartPos(null);
  }, [marqueeBox, activePage, activeLayerId, selectElement]);

  const isMarqueeActive = startPos !== null;

  return { marqueeBox, isMarqueeActive, startMarquee, updateMarquee, endMarquee };
}
