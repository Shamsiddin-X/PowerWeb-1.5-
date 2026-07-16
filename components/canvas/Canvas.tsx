// components/canvas/Canvas.tsx — Thin layout wrapper (~80 lines)

import React, { useRef, useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { CanvasElementRenderer } from './CanvasElement';
import { useCanvasInteraction } from './useCanvasInteraction';

export const Canvas: React.FC = () => {
  const { project, activeLayerId, selectedElementIds, insertMode, scale, showGrid, isDragging, isResizing, hoveredLayerId } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useCanvasInteraction(containerRef, scrollContainerRef);

  const { updateSpecificElement } = useEditorStore();

  if (!activePage) return null;

  const cursorClass = dragStart.type === 'pan' ? 'cursor-grabbing'
    : isSpacePressed ? 'cursor-grab'
    : insertMode ? 'cursor-crosshair'
    : 'cursor-default';

  return (
    <div ref={scrollContainerRef}
      className={`flex-1 overflow-auto bg-gray-200 dark:bg-slate-950 relative transition-colors ${cursorClass}`}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={handleCanvasMouseDown}
    >
      <div className="min-w-full min-h-full p-[500px] flex items-center justify-center box-content">
        <div ref={containerRef}
          className="relative flex-shrink-0 bg-white border border-gray-300 dark:border-slate-800 shadow-md"
          style={{ width: activePage.width, height: activePage.height, transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'width 0.2s, height 0.2s', contain: 'layout style', willChange: 'transform' }}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Background */}
          <div style={{ position: 'absolute', inset: 0, background: activePage.backgroundColor, pointerEvents: 'none', zIndex: 0 }} />

          {/* Grid */}
          {showGrid && <div className="canvas-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />}

          {/* Layers */}
          {useMemo(() => activePage.layers.map(layer => layer.visible && (
            <div key={layer.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
              {layer.elements.map(el => (
                <div key={el.id} id={`element-wrapper-${el.id}`}
                  className={layer.id === activeLayerId && !layer.locked ? 'pointer-events-auto' : 'pointer-events-none'}
                  onMouseDown={(e) => handleElementMouseDown(e, el, layer.id)}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  onContextMenu={(e) => handleElementContextMenu(e, el)}
                  style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                    cursor: isSpacePressed ? 'grab' : insertMode ? 'crosshair' : editingId === el.id ? 'text' : isDragging && selectedElementIds.includes(el.id) ? 'grabbing' : 'move',
                    zIndex: editingId === el.id ? 9999 : undefined,
                    willChange: (isDragging || isResizing) && selectedElementIds.includes(el.id) ? 'transform' : 'auto',
                    contain: 'layout style' }}
                >
                  <CanvasElementRenderer element={el}
                    isSelected={selectedElementIds.includes(el.id)}
                    isEditing={editingId === el.id}
                    scale={scale}
                    onResizeMouseDown={(e, dir) => handleResizeMouseDown(e, dir, el)}
                    onUpdate={(updates) => updateSpecificElement(el.id, updates)}
                  />
                  {hoveredLayerId === layer.id && !selectedElementIds.includes(el.id) && (
                    <div className="absolute inset-0 border-2 border-brand-400 border-dashed pointer-events-none z-50 opacity-50" />
                  )}
                </div>
              ))}
            </div>
          )), [activePage.layers, activeLayerId, hoveredLayerId, selectedElementIds, editingId, isSpacePressed, insertMode, isDragging, isResizing, scale])}

          {/* Drawing preview */}
          {drawingElement && (
            <div style={{ position: 'absolute', left: drawingElement.x, top: drawingElement.y, width: drawingElement.width, height: drawingElement.height, zIndex: 9999, opacity: 0.7 }}>
              <CanvasElementRenderer element={drawingElement} isSelected scale={scale} />
            </div>
          )}

          {/* Marquee */}
          {marqueeBox && (
            <div style={{ position: 'absolute', left: marqueeBox.x, top: marqueeBox.y, width: marqueeBox.w, height: marqueeBox.h, backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', zIndex: 9999, pointerEvents: 'none' }} />
          )}

          {/* Snap guides */}
          {snapLines.map((line, i) => (
            <div key={i} className="absolute bg-red-500 z-[9999] pointer-events-none"
              style={{ left: line.orientation === 'vertical' ? line.position : 0, top: line.orientation === 'horizontal' ? line.position : 0, width: line.orientation === 'vertical' ? '1px' : '100%', height: line.orientation === 'horizontal' ? '1px' : '100%', opacity: 0.8 }}
            />
          ))}
        </div>
      </div>

      {/* Pan overlay */}
      {dragStart.type === 'pan' && (
        <div className="fixed inset-0 z-[99999]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          style={{ cursor: 'grabbing' }}
        />
      )}
    </div>
  );
};
