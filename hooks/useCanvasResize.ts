// hooks/useCanvasResize.ts — GPU-accelerated element resize via handles

import React, { useState, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ResizeDirection } from '../components/canvas/CanvasElement';
import { canvasMetrics, canvasPoint, gestureDelta } from '../utils/canvasCoordinates';
import { CanvasElement } from '../types';

interface ResizeState {
  active: boolean;
  dir: ResizeDirection | null;
  mouseX: number;
  mouseY: number;
  init: { x: number; y: number; w: number; h: number };
  elementId: string;
  startPoint?: { x: number; y: number };
}

const IDLE: ResizeState = { active: false, dir: null, mouseX: 0, mouseY: 0, init: { x: 0, y: 0, w: 0, h: 0 }, elementId: '' };

export function useCanvasResize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { scale, setIsResizing, resizeElement } = useEditorStore();

  const [resize, setResize] = useState<ResizeState>(IDLE);
  const deltaRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const activeRef = useRef(false);

  /** Call on resize-handle mousedown */
  const startResize = useCallback((e: React.MouseEvent, direction: ResizeDirection, element: CanvasElement) => {
    e.stopPropagation();
    e.preventDefault();
    deltaRef.current = { x: 0, y: 0 };
    activeRef.current = true;
    const metrics = canvasMetrics(containerRef.current, scale);
    setResize({
      active: true,
      dir: direction,
      mouseX: e.clientX,
      mouseY: e.clientY,
      init: { x: element.x, y: element.y, w: element.width, h: element.height },
      elementId: element.id,
      startPoint: metrics ? canvasPoint(e.clientX, e.clientY, metrics) : undefined,
    });
    setIsResizing(true);
  }, [setIsResizing, containerRef, scale]);

  /** Call on mousemove while resizing */
  const moveResize = useCallback((e: React.MouseEvent): boolean => {
    if (!activeRef.current || !resize.active || !resize.dir) return false;
    const metrics = canvasMetrics(containerRef.current, scale);
    if (!metrics || !resize.startPoint) return false;
    const delta = gestureDelta(resize.startPoint, e.clientX, e.clientY, metrics);
    const scaledDX = delta.x, scaledDY = delta.y;

    deltaRef.current = { x: scaledDX, y: scaledDY };

    // GPU rAF DOM manipulation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const node = document.getElementById(`element-wrapper-${resize.elementId}`);
      if (!node || !resize.dir) return;
      const { w, h } = resize.init;
      const dir = resize.dir;
      node.style.transform = '';
      if (dir.includes('e')) node.style.width = Math.max(10, w + scaledDX) + 'px';
      if (dir.includes('w')) { const vd = Math.min(scaledDX, w - 10); node.style.transform = `translateX(${vd}px)`; node.style.width = (w - vd) + 'px'; }
      if (dir.includes('s')) node.style.height = Math.max(10, h + scaledDY) + 'px';
      if (dir.includes('n')) { const vd = Math.min(scaledDY, h - 10); node.style.transform = (node.style.transform || '') + ` translateY(${vd}px)`; node.style.height = (h - vd) + 'px'; }
    });
    return true;
  }, [resize, scale, containerRef]);

  /** Call on mouseup to commit to store */
  const endResize = useCallback((cancel = false) => {
    if (!activeRef.current || !resize.active || !resize.dir) return;
    activeRef.current = false;
    const { x: fw, y: fh } = deltaRef.current;
    const { x: ix, y: iy, w: iw, h: ih } = resize.init;
    const dir = resize.dir;
    let nx = ix, ny = iy, nw = iw, nh = ih;

    if (dir.includes('e')) nw = Math.max(10, iw + fw);
    if (dir.includes('w')) { const vd = Math.min(fw, iw - 10); nx = ix + vd; nw = iw - vd; }
    if (dir.includes('s')) nh = Math.max(10, ih + fh);
    if (dir.includes('n')) { const vd = Math.min(fh, ih - 10); ny = iy + vd; nh = ih - vd; }

    if (!cancel) resizeElement(resize.elementId, nx, ny, nw, nh);

    // Cleanup GPU overrides
    const node = document.getElementById(`element-wrapper-${resize.elementId}`);
    if (node) { node.style.transform = ''; node.style.width = `${cancel ? iw : nw}px`; node.style.height = `${cancel ? ih : nh}px`; }

    setResize(IDLE);
    setIsResizing(false);
    deltaRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [resize, resizeElement, setIsResizing]);

  return { isResizing: resize.active, startResize, moveResize, endResize };
}
