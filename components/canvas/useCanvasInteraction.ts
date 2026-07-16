// components/canvas/useCanvasInteraction.ts — All drag/resize/snap/pan/marquee logic

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElement } from '../../types';
import { createNewElement } from '../../utils/elementFactory';
import { ResizeDirection } from './CanvasElement';

interface SnapLine { orientation: 'vertical' | 'horizontal'; position: number; }

interface DragStart {
  type: 'move' | 'resize' | 'create' | 'pan' | 'marquee' | null;
  mouseX: number; mouseY: number;
  initialPositions: Record<string, { x: number; y: number; w: number; h: number }>;
  resizeDir: ResizeDirection | null;
}

const INITIAL_DRAG: DragStart = { type: null, mouseX: 0, mouseY: 0, initialPositions: {}, resizeDir: null };

export function useCanvasInteraction(
  containerRef: React.RefObject<HTMLDivElement | null>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const store = useEditorStore();
  const {
    project, activeLayerId, selectedElementIds, insertMode, scale,
    selectElement, deselectAll, addElement, moveElements, resizeElement,
    updateSpecificElement, setIsDragging, setIsResizing, setInsertMode,
    openContextMenu, closeContextMenu, switchPage,
  } = store;

  const activePage = project.pages.find(p => p.id === project.activePageId);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawingElement, setDrawingElement] = useState<CanvasElement | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragStart, setDragStart] = useState<DragStart>(INITIAL_DRAG);

  const dragDeltaRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const rafRef = useRef<number>(0);

  // ─── Keyboard: Space + Escape ─────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
      if (e.key === 'Escape' && editingId) setEditingId(null);
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [editingId]);

  // ─── Middle mouse block ───────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const block = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
    el.addEventListener('mousedown', block, { passive: false });
    return () => el.removeEventListener('mousedown', block);
  }, [project.activePageId]);

  // ─── Ctrl+Wheel zoom ──────────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5.0);
        useEditorStore.getState().setScale(newScale);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale]);

  // ─── File Drop ────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const activeLayer = activePage?.layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) return;
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? (e.clientX - rect.left) / scale : 0;
      const y = rect ? (e.clientY - rect.top) / scale : 0;
      const el = { ...createNewElement('image', x, y), content: ev.target?.result as string, width: 300, height: 200 };
      addElement(el);
    };
    reader.readAsDataURL(file);
  }, [activePage, activeLayerId, scale, addElement, containerRef]);

  // ─── Canvas mousedown ─────────────────────────────────────────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (editingId) { setEditingId(null); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // PAN: middle btn / space
    if (e.button === 1 || e.button === 2 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setDragStart({ type: 'pan', mouseX: e.clientX, mouseY: e.clientY,
        initialPositions: { container: { x: scrollContainerRef.current?.scrollLeft || 0, y: scrollContainerRef.current?.scrollTop || 0, w: 0, h: 0 } },
        resizeDir: null });
      return;
    }
    if (e.button !== 0) return;

    const activeLayer = activePage?.layers.find(l => l.id === activeLayerId);

    // INSERT MODE
    if (insertMode) {
      if (activeLayer?.locked) { alert('Cannot draw on a locked layer.'); setInsertMode(null); return; }
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;
      const newEl = createNewElement(insertMode, startX, startY, 1, 1);
      if (insertMode === 'line') newEl.height = 1;
      setDrawingElement(newEl);
      setDragStart({ type: 'create', mouseX: e.clientX, mouseY: e.clientY,
        initialPositions: { new: { x: startX, y: startY, w: 0, h: 0 } }, resizeDir: null });
      return;
    }

    // MARQUEE
    const startX = (e.clientX - rect.left) / scale;
    const startY = (e.clientY - rect.top) / scale;
    setMarqueeBox({ x: startX, y: startY, w: 0, h: 0 });
    setDragStart({ type: 'marquee', mouseX: e.clientX, mouseY: e.clientY,
      initialPositions: { start: { x: startX, y: startY, w: 0, h: 0 } }, resizeDir: null });

    if (!e.shiftKey && !e.ctrlKey) {
      deselectAll();
      closeContextMenu();
    }
  }, [editingId, isSpacePressed, insertMode, activePage, activeLayerId, scale, containerRef, scrollContainerRef, deselectAll, closeContextMenu, setInsertMode, addElement]);

  // ─── Element mousedown ────────────────────────────────────────────────────

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CanvasElement, layerId: string) => {
    e.stopPropagation();
    if (editingId === element.id) return;
    if (e.button === 0 && !isSpacePressed) e.preventDefault();
    if (e.button === 2) return;
    if (editingId && editingId !== element.id) setEditingId(null);

    // Alt+click: test logic
    if (e.altKey) {
      const clickLogic = element.logic?.find(l => l.event?.type === 'click');
      const action = clickLogic?.actions[0];
      if (action?.type === 'navigateToPage' && action.targetId) switchPage(action.targetId);
      else if (action?.type === 'navigateToUrl' && action.url) window.open(action.url, '_blank');
      else if (action?.type === 'showModal') alert(`Test: Show Modal (${action.targetId})`);
      return;
    }

    if (layerId !== activeLayerId) return;
    const layer = activePage?.layers.find(l => l.id === layerId);
    if (layer?.locked) return;
    if (isSpacePressed || e.button === 1) { handleCanvasMouseDown(e); return; }
    if (insertMode) { handleCanvasMouseDown(e); return; }

    const isAlreadySelected = selectedElementIds.includes(element.id);
    if (e.shiftKey || e.ctrlKey) {
      selectElement(element.id, true);
    } else {
      if (!isAlreadySelected) selectElement(element.id, false);
    }

    setIsDragging(true);
    closeContextMenu();

    const initialPositions: Record<string, { x: number; y: number; w: number; h: number }> = {};
    const newIds = (e.shiftKey || e.ctrlKey)
      ? isAlreadySelected ? selectedElementIds.filter(id => id !== element.id) : [...selectedElementIds, element.id]
      : isAlreadySelected ? selectedElementIds : [element.id];

    layer?.elements.forEach(el => {
      if (newIds.includes(el.id))
        initialPositions[el.id] = { x: el.x, y: el.y, w: el.width, h: el.height };
    });

    dragDeltaRef.current = { x: 0, y: 0, w: 0, h: 0 };
    setDragStart({ type: 'move', mouseX: e.clientX, mouseY: e.clientY, initialPositions, resizeDir: null });
  }, [editingId, isSpacePressed, insertMode, activeLayerId, activePage, selectedElementIds, selectElement, setIsDragging, closeContextMenu, switchPage, handleCanvasMouseDown]);

  // ─── Double click → edit ──────────────────────────────────────────────────

  const handleElementDoubleClick = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    if (element.type === 'text' || element.type === 'button') {
      setEditingId(element.id);
      selectElement(element.id, false);
    }
  }, [selectElement]);

  // ─── Resize mousedown ─────────────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection, element: CanvasElement) => {
    e.stopPropagation();
    if (isSpacePressed || e.button === 1) { handleCanvasMouseDown(e); return; }
    if (e.button === 0) e.preventDefault();
    selectElement(element.id, false);
    setIsResizing(true);
    closeContextMenu();
    dragDeltaRef.current = { x: 0, y: 0, w: 0, h: 0 };
    setDragStart({ type: 'resize', mouseX: e.clientX, mouseY: e.clientY,
      initialPositions: { [element.id]: { x: element.x, y: element.y, w: element.width, h: element.height } },
      resizeDir: direction });
  }, [isSpacePressed, handleCanvasMouseDown, selectElement, setIsResizing, closeContextMenu]);

  // ─── Mouse move (with snap + rAF) ─────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.type) return;
    const deltaX = e.clientX - dragStart.mouseX;
    const deltaY = e.clientY - dragStart.mouseY;

    if (dragStart.type === 'pan' && scrollContainerRef.current) {
      const s = dragStart.initialPositions.container;
      scrollContainerRef.current.scrollLeft = s.x - deltaX;
      scrollContainerRef.current.scrollTop = s.y - deltaY;
      return;
    }

    const scaledDX = deltaX / scale;
    const scaledDY = deltaY / scale;

    if (dragStart.type === 'marquee' && marqueeBox) {
      const s = dragStart.initialPositions.start;
      const x = scaledDX < 0 ? s.x + scaledDX : s.x;
      const y = scaledDY < 0 ? s.y + scaledDY : s.y;
      setMarqueeBox({ x, y, w: Math.abs(scaledDX), h: Math.abs(scaledDY) });
      return;
    }

    if (dragStart.type === 'create' && drawingElement) {
      const s = dragStart.initialPositions.new;
      const newX = scaledDX < 0 ? s.x + scaledDX : s.x;
      const newY = scaledDY < 0 ? s.y + scaledDY : s.y;
      setDrawingElement({ ...drawingElement, x: newX, y: newY,
        width: Math.abs(scaledDX), height: drawingElement.type === 'line' ? 1 : Math.abs(scaledDY) });
      return;
    }

    // ── Snap ──
    let finalDX = scaledDX, finalDY = scaledDY;
    const newSnapLines: SnapLine[] = [];

    if (dragStart.type === 'move' && activePage) {
      const activeLayer = activePage.layers.find(l => l.id === activeLayerId);
      if (activeLayer && selectedElementIds.length > 0) {
        const primaryId = selectedElementIds[0];
        const init = dragStart.initialPositions[primaryId];
        if (init) {
          const curX = init.x + scaledDX, curY = init.y + scaledDY;
          const THRESHOLD = 5 / scale;
          const vP = [curX, curX + init.w / 2, curX + init.w];
          const hP = [curY, curY + init.h / 2, curY + init.h];
          let snapX: number | null = null, snapY: number | null = null;

          activeLayer.elements.forEach(other => {
            if (selectedElementIds.includes(other.id)) return;
            [other.x, other.x + other.width / 2, other.x + other.width].forEach(ox => {
              vP.forEach(vx => { if (Math.abs(vx - ox) < THRESHOLD) { if (!snapX || Math.abs(vx - ox) < Math.abs(snapX)) snapX = vx - ox; } });
            });
            [other.y, other.y + other.height / 2, other.y + other.height].forEach(oy => {
              hP.forEach(hy => { if (Math.abs(hy - oy) < THRESHOLD) { if (!snapY || Math.abs(hy - oy) < Math.abs(snapY)) snapY = hy - oy; } });
            });
          });

          if (snapX !== null) finalDX -= snapX;
          if (snapY !== null) finalDY -= snapY;

          const finalX = init.x + finalDX, finalY = init.y + finalDY;
          activeLayer.elements.forEach(other => {
            if (selectedElementIds.includes(other.id)) return;
            [other.x, other.x + other.width / 2, other.x + other.width].forEach(ox => {
              [finalX, finalX + init.w / 2, finalX + init.w].forEach(mx => {
                if (Math.abs(mx - ox) < 1 && !newSnapLines.some(l => l.orientation === 'vertical' && Math.abs(l.position - ox) < 1))
                  newSnapLines.push({ orientation: 'vertical', position: ox });
              });
            });
            [other.y, other.y + other.height / 2, other.y + other.height].forEach(oy => {
              [finalY, finalY + init.h / 2, finalY + init.h].forEach(my => {
                if (Math.abs(my - oy) < 1 && !newSnapLines.some(l => l.orientation === 'horizontal' && Math.abs(l.position - oy) < 1))
                  newSnapLines.push({ orientation: 'horizontal', position: oy });
              });
            });
          });
        }
      }
    }

    setSnapLines(prev => JSON.stringify(prev) !== JSON.stringify(newSnapLines) ? newSnapLines : prev);
    dragDeltaRef.current = { x: finalDX, y: finalDY, w: scaledDX, h: scaledDY };

    // ── GPU rAF: zero-lag DOM manipulation ──
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      selectedElementIds.forEach(id => {
        const node = document.getElementById(`element-wrapper-${id}`);
        const init = dragStart.initialPositions[id];
        if (!node || !init) return;
        if (dragStart.type === 'move') {
          node.style.transform = `translate(${finalDX}px, ${finalDY}px)`;
        } else if (dragStart.type === 'resize' && dragStart.resizeDir) {
          const dir = dragStart.resizeDir;
          if (dir.includes('e')) node.style.width = Math.max(10, init.w + scaledDX) + 'px';
          if (dir.includes('w')) { const vd = Math.min(scaledDX, init.w - 10); node.style.transform = `translateX(${vd}px)`; node.style.width = (init.w - vd) + 'px'; }
          if (dir.includes('s')) node.style.height = Math.max(10, init.h + scaledDY) + 'px';
          if (dir.includes('n')) { const vd = Math.min(scaledDY, init.h - 10); node.style.transform += ` translateY(${vd}px)`; node.style.height = (init.h - vd) + 'px'; }
        }
      });
    });
  }, [dragStart, scale, marqueeBox, drawingElement, activePage, activeLayerId, selectedElementIds]);

  // ─── Mouse up ────────────────────────────────────────────────────────────

  const handleMouseUp = useCallback(() => {
    setSnapLines([]);

    // Marquee select
    if (dragStart.type === 'marquee' && marqueeBox && activePage) {
      const { x, y, w, h } = marqueeBox;
      const activeLayer = activePage.layers.find(l => l.id === activeLayerId);
      if (activeLayer && !activeLayer.locked && activeLayer.visible) {
        const ids = activeLayer.elements
          .filter(el => el.x < x + w && el.x + el.width > x && el.y < y + h && el.y + el.height > y)
          .map(el => el.id);
        ids.forEach(id => selectElement(id, true));
      }
      setMarqueeBox(null);
    }

    // Finalize create
    if (dragStart.type === 'create' && drawingElement) {
      const el = { ...drawingElement };
      if (el.width < 5) el.width = 100;
      if (el.type !== 'line' && el.height < 5) el.height = 100;
      if (el.type === 'line') el.height = 1;
      addElement(el);
      setDrawingElement(null);
    }

    // Commit move / resize to store (with history)
    if ((dragStart.type === 'move' || dragStart.type === 'resize') && Object.keys(dragStart.initialPositions).length > 0) {
      const { x: fx, y: fy, w: fw, h: fh } = dragDeltaRef.current;
      Object.entries(dragStart.initialPositions).forEach(([id, init]) => {
        if (dragStart.type === 'move') {
          resizeElement(id, init.x + fx, init.y + fy, init.w, init.h);
        } else if (dragStart.type === 'resize' && dragStart.resizeDir) {
          const dir = dragStart.resizeDir;
          let nx = init.x, ny = init.y, nw = init.w, nh = init.h;
          if (dir.includes('e')) nw = Math.max(10, init.w + fw);
          if (dir.includes('w')) { const vd = Math.min(fw, init.w - 10); nx = init.x + vd; nw = init.w - vd; }
          if (dir.includes('s')) nh = Math.max(10, init.h + fh);
          if (dir.includes('n')) { const vd = Math.min(fh, init.h - 10); ny = init.y + vd; nh = init.h - vd; }
          resizeElement(id, nx, ny, nw, nh);
        }
      });
    }

    // Cleanup GPU overrides
    selectedElementIds.forEach(id => {
      const node = document.getElementById(`element-wrapper-${id}`);
      if (node) { node.style.transform = ''; node.style.width = ''; node.style.height = ''; }
    });

    setIsDragging(false);
    setIsResizing(false);
    setDragStart(INITIAL_DRAG);
    dragDeltaRef.current = { x: 0, y: 0, w: 0, h: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [dragStart, marqueeBox, drawingElement, activePage, activeLayerId, selectedElementIds, selectElement, addElement, resizeElement, setIsDragging, setIsResizing]);

  // ─── Context menu ─────────────────────────────────────────────────────────

  const handleElementContextMenu = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    e.preventDefault(); e.stopPropagation();
    if (!activePage) return;
    const layer = activePage.layers.find(l => l.elements.some(el => el.id === element.id));
    if (layer && layer.id !== activeLayerId) return;
    if (isSpacePressed || insertMode) { setInsertMode(null); return; }
    if (!selectedElementIds.includes(element.id)) selectElement(element.id, false);
    openContextMenu(e.clientX, e.clientY, element.id, 'element');
  }, [activePage, activeLayerId, isSpacePressed, insertMode, selectedElementIds, selectElement, openContextMenu, setInsertMode]);

  return {
    activePage,
    isSpacePressed,
    snapLines,
    editingId, setEditingId,
    drawingElement,
    marqueeBox,
    dragStart,
    handleCanvasMouseDown,
    handleElementMouseDown,
    handleElementDoubleClick,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleElementContextMenu,
    handleDragOver,
    handleDrop,
  };
}
