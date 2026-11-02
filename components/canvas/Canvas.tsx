import { centerCanvasInViewport } from '../../services/viewCommands';
import { MediaImportFeedback } from '../media/MediaImportFeedback';
import { ShaderCanvas } from '../shaders/ShaderCanvas';
// components/canvas/Canvas.tsx — Thin layout wrapper using extracted overlay components

import React, { useRef, useLayoutEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElementRenderer } from './CanvasElement';
import { useCanvasInteraction } from './useCanvasInteraction';
import { DrawingOverlay } from './DrawingOverlay';
import { MarqueeOverlay } from './MarqueeOverlay';
import { SnapGuides } from './SnapGuides';
import { PanOverlay } from './PanOverlay';

export const Canvas: React.FC = () => {
  const { project, activeLayerId, selectedElementIds, insertMode, scale, showGrid, gridSize, showGuides, isDragging, isResizing, hoveredLayerId } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    activePage,
    isSpacePressed, isPanning,
    snapLines,
    editingId, setEditingId,
    drawingElement,
    marqueeBox,
    handleCanvasMouseDown,
    handleElementMouseDown,
    handleElementDoubleClick,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleElementContextMenu,
    handleDragOver,
    handleDrop,
    mediaImports,
  } = useCanvasInteraction(containerRef, scrollContainerRef);

  const { updateSpecificElement } = useEditorStore();



  const cursorClass = isPanning    ? 'cursor-grabbing'
    : isSpacePressed               ? 'cursor-grab'
    : insertMode                   ? 'cursor-crosshair'
    : 'cursor-default';

  useLayoutEffect(() => {
    const viewport = scrollContainerRef.current, canvas = containerRef.current;
    if (!viewport || !canvas) return;
    let frame=0;
    const center=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(centerCanvasInViewport);};
    center();const observer=new ResizeObserver(center);observer.observe(viewport);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
  }, [activePage?.id,scale]);
  if (!activePage) return null;

  return (
    <div dir="ltr" data-canvas-viewport ref={scrollContainerRef}
      style={{ overflowAnchor: 'none', scrollbarGutter: 'stable' }}
      className={`flex-1 min-w-0 min-h-0 overflow-auto bg-gray-200 dark:bg-slate-950 relative transition-colors ${cursorClass}`}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={handleCanvasMouseDown}
    >
      <div className="min-w-full min-h-full p-[500px] flex items-center justify-center box-content">
        <div ref={containerRef} data-shader-page
          className="relative flex-shrink-0 bg-white border border-gray-300 dark:border-slate-800 shadow-md"
          style={{ width: activePage.width, height: activePage.height, transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'width 0.2s, height 0.2s', contain: 'layout style', willChange: 'transform' }}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Background */}
          <div style={{ position: 'absolute', inset: 0, background: activePage.backgroundColor, pointerEvents: 'none', zIndex: 0 }} />

          {/* Grid */}
          {showGrid && <div className="canvas-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,backgroundSize:`${gridSize}px ${gridSize}px` }} />}

          {/* Layers */}
          {activePage?.layers.map(layer => layer.visible && (
            <div key={layer.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, isolation: 'isolate' }}>
              {layer.shader && <div data-layer-shader={layer.id} style={{position:'absolute',inset:0,zIndex:-1,pointerEvents:'none',overflow:'hidden'}}>
                <ShaderCanvas shader={layer.shader} pageInput surfaceSize={{width:activePage.width,height:activePage.height}} />
              </div>}
              {layer.elements.map(el => (
                <div key={el.id} id={`element-wrapper-${el.id}`} data-shader-surface
                  className={layer.id === activeLayerId && !layer.locked ? 'pointer-events-auto' : 'pointer-events-none'}
                  onMouseDown={(e) => handleElementMouseDown(e, el, layer.id)}
                  onDragStart={e => { if (editingId !== el.id) e.preventDefault(); }}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  onContextMenu={(e) => handleElementContextMenu(e, el)}
                  style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                    cursor: isSpacePressed ? 'grab' : insertMode ? 'crosshair' : editingId === el.id ? 'text' : isDragging && selectedElementIds.includes(el.id) ? 'grabbing' : 'move',
                    zIndex: editingId === el.id ? 9999 : undefined,
                    willChange: (isDragging || isResizing) && selectedElementIds.includes(el.id) ? 'transform' : 'auto',
                    contain: 'layout style', userSelect: editingId === el.id ? 'text' : 'none' }}
                >
                  <CanvasElementRenderer element={el}
                    isSelected={selectedElementIds.includes(el.id)}
                    isEditing={editingId === el.id}
                    scale={scale}
                    onResizeMouseDown={(e, dir) => handleResizeMouseDown(e, dir, el)}
                    onFinishEditing={() => setEditingId(null)}
                    onUpdate={(updates) => updateSpecificElement(el.id, updates)}
                  />
                  {hoveredLayerId === layer.id && !selectedElementIds.includes(el.id) && (
                    <div className="absolute inset-0 border-2 border-brand-400 border-dashed pointer-events-none z-50 opacity-50" />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Overlays */}
          <DrawingOverlay element={drawingElement} scale={scale} />
          <MarqueeOverlay box={marqueeBox} />
          {showGuides&&<SnapGuides lines={snapLines} />}
        </div>
      </div>

      {mediaImports.map((media,index)=><MediaImportFeedback key={index} busy={media.busy} error={media.error} onDismiss={media.dismissError}/>)}
      {/* Pan capture overlay (outside canvas div — fixed position) */}
      <PanOverlay isPanning={isPanning} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
    </div>
  );
};
