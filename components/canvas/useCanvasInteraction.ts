// components/canvas/useCanvasInteraction.ts — Orchestrator: wires all canvas sub-hooks together

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { canvasMouseIntent } from '../../utils/canvasCoordinates';
import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElement } from '../../types';
import { useCanvasPan } from '../../hooks/useCanvasPan';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useCanvasDrop } from '../../hooks/useCanvasDrop';
import { useCanvasSnap } from '../../hooks/useCanvasSnap';
import { useCanvasMarquee } from '../../hooks/useCanvasMarquee';
import { useCanvasCreate } from '../../hooks/useCanvasCreate';
import { useCanvasDrag } from '../../hooks/useCanvasDrag';
import { useCanvasResize } from '../../hooks/useCanvasResize';
import { ResizeDirection } from './CanvasElement';

export function useCanvasInteraction(
  containerRef: React.RefObject<HTMLDivElement | null>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const { project, activeLayerId, selectedElementIds, insertMode, scale,
    selectElement, deselectAll, openContextMenu, closeContextMenu, switchPage } = useEditorStore();

  const activePage = project.pages.find(p => p.id === project.activePageId);

  // ── Sub-hooks ───────────────────────────────────────────────────────────────
  const { isSpacePressed, isPanning, startPan, movePan, endPan } = useCanvasPan(scrollContainerRef);
  useCanvasZoom(scrollContainerRef);
  const { handleDragOver, handleDrop, mediaImport:dropMediaImport } = useCanvasDrop(containerRef);
  const { marqueeBox, startMarquee, updateMarquee, endMarquee } = useCanvasMarquee(containerRef);
  const { drawingElement, isCreating, startCreate, updateCreate, endCreate, mediaImport:createMediaImport } = useCanvasCreate(containerRef);
  const { snapLines, startDrag, moveDrag, endDrag } = useCanvasDrag(containerRef);
  const { startResize, moveResize, endResize } = useCanvasResize(containerRef);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Escape clears editing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === 'Escape' && editingId) setEditingId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingId]);

  // ── Canvas mousedown ────────────────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) setEditingId(null);
    const intent = canvasMouseIntent(e.button, isSpacePressed, false);
    if (intent === 'pan') {
      endDrag(true); endResize(true); endMarquee(true); endCreate(true);
      e.preventDefault(); startPan(e); return;
    }
    if (intent !== 'select') return;
    const focused = document.activeElement as HTMLElement | null;
    if (focused?.matches('input,textarea,select,[contenteditable="true"]')) focused.blur();
    e.preventDefault(); endPan();
    if (startCreate(e)) return;      // consumed by insert mode
    if (!e.shiftKey && !e.ctrlKey) { deselectAll(); closeContextMenu(); }
    startMarquee(e);
  }, [editingId, isSpacePressed, startPan, startCreate, deselectAll, closeContextMenu, startMarquee, endPan, endDrag, endResize, endMarquee, endCreate]);

  // ── Element mousedown ───────────────────────────────────────────────────────
  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CanvasElement, layerId: string) => {
    e.stopPropagation();
    if (editingId === element.id) return;
    if (e.button === 2) return;
    if (editingId && editingId !== element.id) setEditingId(null);

    // Alt+click: test logic interactions
    if (e.altKey) {
      const action = element.logic?.find(l => l.event?.type === 'click')?.actions[0];
      if (action?.type === 'navigateToPage' && action.targetId) switchPage(action.targetId);
      else if (action?.type === 'navigateToUrl' && action.url) window.open(action.url, '_blank');
      else if (action?.type === 'showModal') alert(`Test: Show Modal (${action.targetId})`);
      return;
    }

    if (layerId !== activeLayerId) return;
    const layer = activePage?.layers.find(l => l.id === layerId);
    if (!layer || layer.locked || !layer.visible) return;
    if (canvasMouseIntent(e.button, isSpacePressed, true) === 'pan') { handleCanvasMouseDown(e); return; }
    if (e.button !== 0) return;
    if (insertMode) { handleCanvasMouseDown(e); return; }

    endPan(); endMarquee(true); endCreate(true); endResize(true);
    closeContextMenu();
    startDrag(e, element.id);
  }, [editingId, activeLayerId, activePage, isSpacePressed, insertMode, switchPage, handleCanvasMouseDown, closeContextMenu, startDrag, endPan, endMarquee, endCreate, endResize]);

  // ── Double click ────────────────────────────────────────────────────────────
  const handleElementDoubleClick = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    if (element.type === 'text' || element.type === 'button') {
      setEditingId(element.id);
      selectElement(element.id, false);
    }
  }, [selectElement]);

  // ── Resize handle mousedown ─────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection, element: CanvasElement) => {
    if (canvasMouseIntent(e.button, isSpacePressed, true) === 'pan') { handleCanvasMouseDown(e); return; }
    if (e.button !== 0) return;
    endPan(); endDrag(true); endMarquee(true); endCreate(true);
    closeContextMenu();
    startResize(e, direction, element);
  }, [isSpacePressed, handleCanvasMouseDown, closeContextMenu, startResize, endPan, endDrag, endMarquee, endCreate]);

  // ── Mouse move ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (movePan(e)) return;
    updateMarquee(e);
    updateCreate(e);
    moveDrag(e);
    moveResize(e);
  }, [movePan, updateMarquee, updateCreate, moveDrag, moveResize]);

  // ── Mouse up ────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    endPan();
    endMarquee();
    endCreate();
    endDrag();
    endResize();
  }, [endPan, endMarquee, endCreate, endDrag, endResize]);

  // Window listeners keep gestures alive when the pointer leaves the canvas or is released over a panel.
  const handlers = useRef({ handleMouseMove, handleMouseUp });
  handlers.current = { handleMouseMove, handleMouseUp };
  const cancel = useRef(() => {});
  cancel.current = () => { endPan(); endMarquee(true); endCreate(true); endDrag(true); endResize(true); };
  useEffect(() => {
    const move = (e: MouseEvent) => handlers.current.handleMouseMove(e as unknown as React.MouseEvent);
    const up = (e: MouseEvent) => {
      if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
      // Capture the final pointer position even when the browser coalesced the last mousemove.
      if (useEditorStore.getState().isDragging || useEditorStore.getState().isResizing) handlers.current.handleMouseMove(e as unknown as React.MouseEvent);
      handlers.current.handleMouseUp();
    };
    const abort = () => cancel.current();
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape') abort(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('blur', abort);
    window.addEventListener('powerweb:cancel-gesture', abort);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      window.removeEventListener('blur', abort); window.removeEventListener('powerweb:cancel-gesture', abort); window.removeEventListener('keydown', key);
    };
  }, []);

  // ── Context menu ────────────────────────────────────────────────────────────
  const handleElementContextMenu = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    e.preventDefault(); e.stopPropagation();
    if (!activePage) return;
    const layer = activePage.layers.find(l => l.elements.some(el => el.id === element.id));
    if (layer && layer.id !== activeLayerId) return;
    if (isSpacePressed || insertMode) return;
    if (!selectedElementIds.includes(element.id)) selectElement(element.id, false);
    openContextMenu(e.clientX, e.clientY, element.id, 'element');
  }, [activePage, activeLayerId, isSpacePressed, insertMode, selectedElementIds, selectElement, openContextMenu]);

  return {
    activePage,
    isSpacePressed, isPanning,
    snapLines,
    editingId, setEditingId,
    drawingElement, marqueeBox,
    handleCanvasMouseDown,
    handleElementMouseDown,
    handleElementDoubleClick,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleElementContextMenu,
    handleDragOver,
    handleDrop,
    mediaImports:[dropMediaImport,createMediaImport],
  };
}
