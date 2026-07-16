// utils/elementFactory.ts — Factory functions for creating new canvas elements

import { CanvasElement, ElementType, DEFAULT_STYLE } from '../types';
import { generateId } from '../store/helpers';

export const createNewElement = (type: ElementType, x: number, y: number, w?: number, h?: number): CanvasElement => {
  const base = {
    id: generateId(),
    x, y,
    width: w || 100,
    height: h || 100,
    style: { ...DEFAULT_STYLE },
  };

  switch (type) {
    case 'rect':
      return { ...base, type, style: { ...DEFAULT_STYLE, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 1 } };

    case 'roundedRect':
      return { ...base, type: 'rect', style: { ...DEFAULT_STYLE, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 1, borderRadius: 20 } };

    case 'circle':
      return { ...base, type, style: { ...DEFAULT_STYLE, fill: '#2563eb', borderRadius: 50, strokeWidth: 0 } };

    case 'line':
      return { ...base, type, width: w || 200, height: 1, style: { ...DEFAULT_STYLE, fill: '#1e293b', strokeWidth: 0 } };

    case 'text':
      return { ...base, type, width: w || 200, height: h || 50, content: 'Double click to edit', style: { ...DEFAULT_STYLE, fill: 'transparent', strokeWidth: 0, fontSize: 24, color: '#0f172a' } };

    case 'button':
      return { ...base, type, width: w || 120, height: h || 40, content: 'Click Me', style: { ...DEFAULT_STYLE, fill: '#3b82f6', borderRadius: 6, strokeWidth: 0, textAlign: 'center', color: '#ffffff' } };

    case 'image':
      return { ...base, type, width: w || 200, height: h || 150, content: 'https://picsum.photos/200/150', style: { ...DEFAULT_STYLE, strokeWidth: 0 } };

    case 'video':
      return { ...base, type, width: w || 400, height: h || 225, content: 'https://www.w3schools.com/html/mov_bbb.mp4', style: { ...DEFAULT_STYLE, strokeWidth: 0, fill: '#000000' }, videoProps: { autoplay: true, loop: true, muted: true } };

    case 'triangle':
    case 'rightTriangle':
    case 'diamond':
    case 'parallelogram':
    case 'trapezoid':
    case 'pentagon':
    case 'hexagon':
    case 'octagon':
    case 'star':
    case 'star4':
    case 'star6':
    case 'cross':
    case 'heart':
    case 'message':
      return { ...base, type, style: { ...DEFAULT_STYLE, fill: '#6366f1', stroke: '#4338ca', strokeWidth: 1 } };

    case 'arrowRight':
    case 'arrowLeft':
    case 'arrowUp':
    case 'arrowDown':
      return { ...base, type, width: w || 120, height: h || 80, style: { ...DEFAULT_STYLE, fill: '#0ea5e9', stroke: '#0369a1', strokeWidth: 1 } };

    default:
      return { ...base, type: 'rect', style: { ...DEFAULT_STYLE } };
  }
};
