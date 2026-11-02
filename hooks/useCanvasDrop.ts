// OS file drag & drop shares the same import path as the file picker.
import React, { useCallback } from 'react';
import { canvasMetrics, canvasPoint } from '../utils/canvasCoordinates';
import { useEditorStore } from '../store/useEditorStore';
import { useMediaImport } from './useMediaImport';
export function useCanvasDrop(containerRef:React.RefObject<HTMLDivElement|null>){
  const scale=useEditorStore(s=>s.scale);
  const mediaImport=useMediaImport();
  const {insertFile}=mediaImport;
  const handleDragOver=useCallback((e:React.DragEvent)=>{e.preventDefault();e.dataTransfer.dropEffect='copy';},[]);
  const handleDrop=useCallback((e:React.DragEvent)=>{
    e.preventDefault();e.stopPropagation();
    const file=e.dataTransfer.files?.[0];if(!file)return;
    const metrics=canvasMetrics(containerRef.current,scale);if(!metrics)return;
    const point=canvasPoint(e.clientX,e.clientY,metrics);
    void insertFile(file,point);
  },[containerRef,scale,insertFile]);
  return {handleDragOver,handleDrop,mediaImport};
}
