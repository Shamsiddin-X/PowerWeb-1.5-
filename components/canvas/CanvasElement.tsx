import { useElementAnimations } from '../../hooks/useElementAnimations';
import { ShaderCanvas } from '../shaders/ShaderCanvas';
// components/canvas/CanvasElement.tsx — Pure visual renderer for a single canvas element

import React, { useRef, useLayoutEffect, useId, useEffect } from 'react';
import { Pin } from 'lucide-react';
import { CanvasElement } from '../../types';
import { useEditorStore } from '../../store/useEditorStore';
import { getSvgPath } from '../../utils/shapeData';
import { shaderUsesSource, shaderCanApply } from '../../types/shaders';

export type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing?: boolean;
  scale: number;
  onResizeMouseDown?: (e: React.MouseEvent, direction: ResizeDirection) => void;
  onUpdate?: (updates: Partial<CanvasElement>) => void;
  onFinishEditing?: () => void;
  shaderPaused?: boolean;
  shaderDemo?: boolean;
  onShaderError?: (message:string)=>void;
}


const CanvasElementRendererInner: React.FC<CanvasElementRendererProps> = ({
  element, isSelected, isEditing = false, scale, onResizeMouseDown, onUpdate, onFinishEditing, shaderPaused, shaderDemo, onShaderError,
}) => {
  const { style, width, height, type, content } = element;
  const animationRef=useElementAnimations(element.animations,isEditing||shaderDemo);
  const objectFit=style.objectFit||'fill';
  const videoRef=useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const clipId='shader-clip-'+useId().replace(/:/g,'');
  const shader=element.shader&&shaderCanApply(element.shader,type)?element.shader:null;
  const sourceShader=shader&&shaderUsesSource(shader);
  const shaderCanvas=shader?<ShaderCanvas shader={shader} backgroundColor={style.fill} surfaceSize={{width,height}} paused={shaderPaused} demo={shaderDemo} onError={onShaderError}/>:null;

  useEffect(()=>{
    if(!shaderDemo||!videoRef.current)return;
    if(shaderPaused)videoRef.current.pause();else videoRef.current.play().catch(()=>{});
  },[shaderDemo,shaderPaused,content]);
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
    background: shader && !sourceShader ? 'transparent' : style.fill,
    borderColor: style.stroke,
    borderWidth: `${style.strokeWidth}px`,
    borderStyle: 'solid',
    borderRadius: type === 'circle' ? '50%' : style.borderRadius,
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
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.code === 'Escape') { useEditorStore.getState().cancelTransaction(); onFinishEditing?.(); }
            else if ((e.ctrlKey || e.metaKey) && e.code === 'Enter') { useEditorStore.getState().commitTransaction(); onFinishEditing?.(); }
          }}
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
        return <div style={divStyle}>{shaderCanvas}</div>;
      case 'line':
        return <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: style.fill || '#000', pointerEvents: 'none' }} />;
      case 'image':
        return sourceShader?<div style={{...divStyle,borderWidth:0}}><img data-pwb-shader-source="media" crossOrigin="anonymous" src={content} alt="User content" style={{width:'100%',height:'100%',objectFit}} draggable={false}/>{shaderCanvas}</div>:<img src={content} alt="User content" style={{ ...divStyle, objectFit, borderWidth: 0 }} draggable={false} />;
      case 'video':
        return (
          <div style={{ ...divStyle, borderWidth: 0 }}>
            <video ref={videoRef} data-pwb-shader-source={sourceShader?'media':undefined} crossOrigin={sourceShader?'anonymous':undefined} src={content} autoPlay={shaderDemo||element.videoProps?.autoplay} loop={shaderDemo||element.videoProps?.loop} muted style={{width:'100%',height:'100%',objectFit}} />
            {sourceShader&&shaderCanvas}
          </div>
        );
      case 'text':
        return (
          <div style={{ ...divStyle, background: 'transparent', borderWidth: 0, textAlign: style.textAlign, color: style.color, fontSize: style.fontSize, fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontStyle: style.fontStyle as any, whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
            <span data-pwb-shader-source={sourceShader?'text':undefined} style={{display:'block',width:'100%',height:'100%',overflowWrap:'anywhere'}}>{content}</span>
            {sourceShader&&shaderCanvas}
          </div>
        );
      case 'button':
        return (
          <div style={{ ...divStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.color, fontSize: style.fontSize, fontFamily: style.fontFamily, fontStyle: style.fontStyle as any, fontWeight: style.fontWeight, cursor: 'pointer', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
            {shaderCanvas}
            <span style={{position: 'relative'}}>{content}</span>
          </div>
        );
      default: {
        const pathData = getSvgPath(type);
        const isPath = type === 'heart';
        if(shader)return <div style={svgContainerStyle}>
          <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><clipPath id={clipId} clipPathUnits="objectBoundingBox">{isPath?<path d={pathData} transform="scale(.01)"/>:<polygon points={pathData} transform="scale(.01)"/>}</clipPath></defs></svg>
          <div style={{position:'absolute',inset:0,clipPath:`url(#${clipId})`}}>{shaderCanvas}</div>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">{isPath?<path d={pathData} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} vectorEffect="non-scaling-stroke"/>:<polygon points={pathData} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} vectorEffect="non-scaling-stroke"/>}</svg>
        </div>;
        return (
          <svg style={svgContainerStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
            {isPath
              ? <path d={pathData} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} vectorEffect="non-scaling-stroke" />
              : <polygon points={pathData} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} vectorEffect="non-scaling-stroke" />
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

  let visual = renderContent();
  if (element.animations?.length) {
    visual = element.animations!.reduceRight((children, animation, index) => (
      <div key={animation.id} data-pwb-animation-layer={index} data-pwb-animation-id={animation.id}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>{children}</div>
    ), visual);
  }
  return (
    <>
      {element.animations?.length?<div ref={animationRef} data-animations={JSON.stringify(element.animations)} style={{position:'absolute',inset:0,pointerEvents:'none'}}>{visual}</div>:visual}
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

export const CanvasElementRenderer = React.memo(CanvasElementRendererInner);
