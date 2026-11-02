import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { computeCanvasSnap, SnapLine } from './useCanvasSnap';
import { canvasMetrics } from '../utils/canvasCoordinates';
import { CanvasDragSession, DragSnapshot } from '../utils/canvasDragSession';

export function useCanvasDrag(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [isDragging, setDragging] = useState(false);
  const controller = useRef<CanvasDragSession | null>(null);
  const context = useRef({ containerRef }); context.current = { containerRef };
  if (!controller.current) controller.current = new CanvasDragSession({
    metrics: () => canvasMetrics(context.current.containerRef.current, useEditorStore.getState().scale),
    valid: snapshot => {
      const s = useEditorStore.getState();
      const page = s.project.pages.find(p => p.id === s.project.activePageId);
      const layer = page?.layers.find(l => l.id === s.activeLayerId);
      return page?.id === snapshot.pageId && layer?.id === snapshot.layerId && !layer.locked && layer.visible
        && Object.entries(snapshot.positions).every(([id, initial]) => {
          const element = layer.elements.find(e => e.id === id);
          return element && element.x === initial.x && element.y === initial.y && element.width === initial.w && element.height === initial.h;
        });
    },
    snap: (snapshot, dx, dy) => {
      const s = useEditorStore.getState();
      const layer = s.project.pages.find(p => p.id === snapshot.pageId)!.layers.find(l => l.id === snapshot.layerId)!;
      if(!s.snapEnabled)return {dx,dy,lines:[]};
      return computeCanvasSnap(snapshot.primaryId, Object.keys(snapshot.positions), snapshot.positions, dx, dy, layer, snapshot.metrics.scaleX);
    },
    preview: (snapshot, dx, dy) => {
      Object.keys(snapshot.positions).forEach(id => {
        const node = document.getElementById(`element-wrapper-${id}`);
        if (node) node.style.translate = `${dx}px ${dy}px`;
      });
    },
    finishPreview: (snapshot, dx, dy, cancel) => {
      const s = useEditorStore.getState();
      const layer = s.project.pages.find(p => p.id === snapshot.pageId)?.layers.find(l => l.id === snapshot.layerId);
      Object.entries(snapshot.positions).forEach(([id, initial]) => {
        const node = document.getElementById(`element-wrapper-${id}`);
        if (!node) return;
        const current = layer?.elements.find(e => e.id === id);
        // Set final geometry before clearing the GPU offset: no one-frame jump back to the start.
        node.style.left = `${cancel ? current?.x ?? initial.x : initial.x + dx}px`;
        node.style.top = `${cancel ? current?.y ?? initial.y : initial.y + dy}px`;
        node.style.translate = '';
      });
    },
    commit: (ids, dx, dy) => useEditorStore.getState().moveElements(ids, dx, dy),
    active: active => { setDragging(active); useEditorStore.getState().setIsDragging(active); },
    guides: lines => setSnapLines(previous => JSON.stringify(previous) === JSON.stringify(lines) ? previous : lines),
    frame: callback => requestAnimationFrame(callback), cancelFrame: id => cancelAnimationFrame(id),
  });
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((s, old) => {
      if (s.scale !== old.scale) controller.current?.end(true);
      else controller.current?.validate();
    });
    return () => { unsubscribe(); controller.current?.end(true); };
  }, []);
  const startDrag = useCallback((e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return;
    const s = useEditorStore.getState();
    const page = s.project.pages.find(p => p.id === s.project.activePageId);
    const layer = page?.layers.find(l => l.id === s.activeLayerId);
    const metrics = canvasMetrics(containerRef.current, s.scale);
    if (!layer || layer.locked || !layer.visible || !metrics) return;
    const focused = document.activeElement as HTMLElement | null;
    if (focused?.matches('input,textarea,select,[contenteditable="true"]')) focused.blur();
    e.preventDefault(); // Disable native text/image dragging and browser drag-autoscroll.
    controller.current!.end(true);
    const multi = e.shiftKey || e.ctrlKey || e.metaKey;
    if (multi || !s.selectedElementIds.includes(elementId)) s.selectElement(elementId, multi);
    const ids = useEditorStore.getState().selectedElementIds;
    const positions: DragSnapshot['positions'] = {};
    layer.elements.forEach(element => { if (ids.includes(element.id)) positions[element.id] = { x: element.x, y: element.y, w: element.width, h: element.height }; });
    controller.current!.begin({ pageId: page!.id, layerId: layer.id, primaryId: ids.includes(elementId) ? elementId : ids[0], positions, metrics, clientX: e.clientX, clientY: e.clientY });
  }, [containerRef]);
  const moveDrag = useCallback((e: React.MouseEvent) => controller.current!.move(e.clientX, e.clientY), []);
  const endDrag = useCallback((cancel = false) => controller.current!.end(cancel), []);
  return { snapLines, isDragging, startDrag, moveDrag, endDrag };
}
