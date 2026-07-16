// types/elements.ts — Element types and default styles

export type ElementType = 
  | 'rect' | 'roundedRect' | 'circle' | 'text' | 'image' | 'button' | 'video'
  | 'line' 
  | 'triangle' | 'rightTriangle' | 'diamond' | 'parallelogram' | 'trapezoid'
  | 'pentagon' | 'hexagon' | 'octagon'
  | 'star' | 'star4' | 'star6'
  | 'arrowRight' | 'arrowLeft' | 'arrowUp' | 'arrowDown'
  | 'cross' | 'heart' | 'message'
  | 'group';

export interface ElementStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  borderRadius: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  shadowBlur?: number;
  shadowColor?: string;
  color?: string;
  backdropBlur?: number; 
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style: ElementStyle;
  tagName?: string;
  attributes?: Record<string, string>;
  animations?: import('./animations').Animation[];
  logic?: import('./logic').LogicBlock[];
  positionMode?: 'absolute' | 'fixed'; 
  videoProps?: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
  };
  elements?: CanvasElement[];
}

export const DEFAULT_STYLE: ElementStyle = {
  fill: '#ffffff',
  stroke: '#cbd5e1',
  strokeWidth: 1,
  opacity: 1,
  borderRadius: 0,
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  shadowBlur: 0,
  shadowColor: 'rgba(0,0,0,0.2)',
  color: '#000000',
  backdropBlur: 0
};
