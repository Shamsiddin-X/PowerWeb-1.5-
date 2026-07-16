// components/canvas/CanvasElement.tsx — Pure visual renderer for a single canvas element

import React, { useRef, useLayoutEffect } from 'react';
import { Pin } from 'lucide-react';
import { CanvasElement } from '../../types';

export type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing?: boolean;
  scale: number;
  onResizeMouseDown?: (e: React.MouseEvent, direction: ResizeDirection) => void;
  onUpdate?: (updates: Partial<CanvasElement>) => void;
}

const getSvgPath = (shapeType: string): string => {
  switch (shapeType) {
    case 'triangle':      return '50,0 100,100 0,100';
    case 'rightTriangle': return '0,0 100,100 0,100';
    case 'diamond':       return '50,0 100,50 50,100 0,50';
    case 'parallelogram': return '25,0 100,0 75,100 0,100';
    case 'trapezoid':     return '25,0 75,0 100,100 0,100';
    case 'pentagon':      return '50,0 100,38 82,100 18,100 0,38';
    case 'hexagon':       return '25,0 75,0 100,50 75,100 25,100 0,50';
    case 'octagon':       return '30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30';
    case 'star':          return '50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35';
    case 'star4':         return '50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35';
    case 'star6':         return '50,0 65,25 100,25 75,50 100,75 65,75 50,100 35,75 0,75 25,50 0,25 35,25';
    case 'arrowRight':    return '0,25 50,25 50,0 100,50 50,100 50,75 0,75';
    case 'arrowLeft':     return '100,25 50,25 50,0 0,50 50,100 50,75 100,75';
    case 'arrowUp':       return '25,100 25,50 0,50 50,0 100,50 75,50 75,100';
    case 'arrowDown':     return '25,0 25,50 0,50 50,100 100,50 75,50 75,0';
    case 'cross':         return '35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35';
    case 'heart':         return 'M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z';
    case 'message':       return '0,0 100,0 100,75 20,75 0,100 0,75';
    default:              return '';
  }
};

const CanvasElementRendererInner: React.FC<CanvasElementRendererProps> = ({
  element, isSelected, isEditing = false, scale, onResizeMouseDown, onUpdate,
}) => {
  const { style, width, height, type, content } = element;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (isEditing && textareaRef.current && (type === 'text' || type === 'button')) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      if (Math.abs(textareaRef.current.scrollHeight - height) > 2 && onUpdate) {
        onUpdate({ height: textareaRef.current.scrollHeight });
      }
    }
  }, [content, isEditing, height, type, onUpdate]);

  const divStyle: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    background: style.fill,
    borderColor: style.stroke,
    borderWidth: `${style.strokeWidth}px`,
    borderStyle: 'solid',
    borderRadius: style.borderRadius,
    opacity: style.opacity,
    boxShadow: `0 0 ${style.shadowBlur}px ${style.shadowColor}`,
    backdropFilter: style.backdropBlur ? `blur(${style.backdropBlur}px)` : undefined,
    WebkitBackdropFilter: style.backdropBlur ? `blur(${style.backdropBlur}px)` : undefined,
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const svgContainerStyle: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    opacity: style.opacity,
    pointerEvents: 'none',
    filter: `drop-shadow(0 0 ${style.shadowBlur}px ${style.shadowColor})`,
  };

  const renderContent = () => {
    if (isEditing && (type === 'text' || type === 'button')) {
      return (
        <textarea ref={textareaRef} value={content}
          onChange={(e) => onUpdate?.({ content: e.target.value })}
          className="w-full h-full resize-none outline-none overflow-hidden bg-transparent p-0 m-0 border-none"
          style={{ color: style.color, fontSize: style.fontSize, fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontStyle: style.fontStyle as any, textAlign: style.textAlign, pointerEvents: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}
          autoFocus
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
    }

    switch (type) {
      case 'group':
        return (
          <div style={{ ...divStyle, background: 'transparent', borderWidth: 0, boxShadow: 'none' }}>
            {element.elements?.map(child => (
              <div key={child.id} style={{ position: 'absolute', left: child.x, top: child.y, width: child.width, height: child.height }}>
                <CanvasElementRenderer element={child} isSelected={false} scale={scale} />
              </div>
            ))}
          </div>
        );
      case 'rect':
      case 'roundedRect':
      case 'circle':
        return <div style={divStyle} />;
      case 'line':
        return <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: style.fill || '#000', pointerEvents: 'none' }} />;
      case 'image':
        return <img src={content} alt="User content" style={{ ...divStyle, objectFit: 'cover', borderWidth: 0 }} draggable={false} />;
      case 'video':
        return (
          <div style={{ ...divStyle, borderWidth: 0 }}>
            <video src={content} autoPlay={element.videoProps?.autoplay} loop={element.videoProps?.loop} muted className="w-full h-full object-cover" />
          </div>
        );
      case 'text':
        return (
          <div style={{ ...divStyle, backgroundColor: 'transparent', borderWidth: 0, display: 'flex', alignItems: 'flex-start', justifyContent: style.textAlign, color: style.color, fontSize: style.fontSize, fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontStyle: style.fontStyle as any, whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
            {content}
          </div>
        );
      case 'button':
        return (
          <div style={{ ...divStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.color, fontSize: style.fontSize, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
            {content}
          </div>
        );
      default: {
        const pathData = getSvgPath(type);
        const isPath = type === 'heart';
        return (
          <svg style={svgContainerStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
            {isPath
              ? <path d={pathData} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth * (100 / Math.max(width, 1))} vectorEffect="non-scaling-stroke" />
              : <polygon points={pathData} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth * (100 / Math.max(width, 1))} vectorEffect="non-scaling-stroke" />
            }
          </svg>
        );
      }
    }
  };

  const Handle = ({ dir, cursor }: { dir: ResizeDirection; cursor: string }) => (
    <div
      className="absolute w-2.5 h-2.5 bg-white border border-brand-500 z-20 hover:bg-brand-500 transition-colors"
      style={{
        cursor,
        top:    dir.includes('n') ? -5 : (dir.includes('s') ? 'auto' : 'calc(50% - 4px)'),
        bottom: dir.includes('s') ? -5 : 'auto',
        left:   dir.includes('w') ? -5 : (dir.includes('e') ? 'auto' : 'calc(50% - 4px)'),
        right:  dir.includes('e') ? -5 : 'auto',
      }}
      onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown?.(e, dir); }}
    />
  );

  return (
    <>
      {renderContent()}
      {element.positionMode === 'fixed' && (
        <div className="absolute top-1 right-1 bg-brand-500 text-white rounded-full p-0.5 shadow-md z-10 pointer-events-none" title="Fixed Position">
          <Pin size={10} />
        </div>
      )}
      {isSelected && !isEditing && (
        <div className="absolute inset-0 border border-brand-500 pointer-events-none">
          <div className="pointer-events-auto">
            {type === 'line' ? (
              <><Handle dir="w" cursor="w-resize" /><Handle dir="e" cursor="e-resize" /></>
            ) : (
              <>
                <Handle dir="nw" cursor="nw-resize" /><Handle dir="ne" cursor="ne-resize" />
                <Handle dir="sw" cursor="sw-resize" /><Handle dir="se" cursor="se-resize" />
                <Handle dir="n" cursor="n-resize" /><Handle dir="s" cursor="s-resize" />
                <Handle dir="w" cursor="w-resize" /><Handle dir="e" cursor="e-resize" />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const CanvasElementRenderer = React.memo(CanvasElementRendererInner, (prev, next) => {
  if (prev.isEditing !== next.isEditing || prev.isSelected !== next.isSelected || prev.scale !== next.scale) return false;
  const pe = prev.element, ne = next.element;
  if (pe.x !== ne.x || pe.y !== ne.y || pe.width !== ne.width || pe.height !== ne.height ||
      pe.content !== ne.content || pe.type !== ne.type || pe.positionMode !== ne.positionMode ||
      JSON.stringify(pe.style) !== JSON.stringify(ne.style)) return false;
  return true;
});
