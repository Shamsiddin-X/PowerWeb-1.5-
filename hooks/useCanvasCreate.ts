// hooks/useCanvasCreate.ts — Insert mode: drawing new elements on canvas

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { createNewElement } from '../utils/elementFactory';
import { canvasMetrics, canvasPoint } from '../utils/canvasCoordinates';
import { useMediaImport } from './useMediaImport';
import { CanvasElement } from '../types';

export function useCanvasCreate(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const { insertMode, activeLayerId, project, scale, addElement, setInsertMode } = useEditorStore();
  const mediaImport=useMediaImport();
  const {pickAndInsert}=mediaImport;
  const activePage = project.pages.find(p => p.id === project.activePageId);

  const [drawingElement, setDrawingElement] = useState<CanvasElement | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);

  /** Returns true if this mousedown was consumed by create mode */
  const startCreate = useCallback((e: React.MouseEvent): boolean => {
    if (!insertMode) return false;
    if(insertMode==='image'||insertMode==='video'){
      setInsertMode(null);void pickAndInsert(insertMode);return true;
    }
    const activeLayer = activePage?.layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
      alert('Cannot draw on a locked layer.');
      setInsertMode(null);
      return true;
    }
    const metrics = canvasMetrics(containerRef.current, scale);
    if (!metrics) return false;
    const { x, y } = canvasPoint(e.clientX, e.clientY, metrics);
    const newEl = createNewElement(insertMode, x, y, 1, 1);
    if (insertMode === 'line') newEl.height = 1;
    setDrawingElement(newEl);
    setDrawStart({ x, y, mouseX: e.clientX, mouseY: e.clientY });
    return true;
  }, [insertMode, activePage, activeLayerId, scale, containerRef, setInsertMode, pickAndInsert]);

  /** Call on mousemove while creating */
  const updateCreate = useCallback((e: React.MouseEvent) => {
    if (!drawStart || !drawingElement) return;
    const metrics = canvasMetrics(containerRef.current, scale);
    if (!metrics) return;
    const point = canvasPoint(e.clientX, e.clientY, metrics);
    const scaledDX = point.x - drawStart.x;
    const scaledDY = point.y - drawStart.y;
    const newX = scaledDX < 0 ? drawStart.x + scaledDX : drawStart.x;
    const newY = scaledDY < 0 ? drawStart.y + scaledDY : drawStart.y;
    setDrawingElement({
      ...drawingElement,
      x: newX,
      y: newY,
      width: Math.abs(scaledDX),
      height: drawingElement.type === 'line' ? 1 : Math.abs(scaledDY),
    });
  }, [drawStart, drawingElement, scale, containerRef]);

  /** Call on mouseup to commit the new element */
  const endCreate = useCallback((cancel = false) => {
    if (!drawingElement) return;
    const el = { ...drawingElement };
    if (el.width < 5) el.width = 100;
    if (el.type !== 'line' && el.height < 5) el.height = 100;
    if (el.type === 'line') el.height = 1;
    if (!cancel) addElement(el);
    setDrawingElement(null);
    setDrawStart(null);
  }, [drawingElement, addElement]);

  const isCreating = drawStart !== null;

  return { drawingElement, isCreating, startCreate, updateCreate, endCreate, mediaImport };
}
