// types/project.ts — Project, Page, Layer types

import { CanvasElement } from './elements';

export interface Layer {
  /** Background belongs to the layer and always renders below its elements. */
  shader?: import('./shaders').ShaderConfig | null;
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: CanvasElement[];
}

export type PageTransitionType = 'none' | 'fade' | 'push_left' | 'push_right' | 'push_up' | 'push_down' | 'zoom_in' | 'zoom_out';

export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: Layer[];
  transition?: PageTransitionType;
  transitionDuration?: number;
  responsive?:boolean;
  mobileBreakpoint?:number;
  description?:string;
}

export interface ProjectFont {
  id:string;
  family:string;
  source:string;
  weight?:string;
  style?:'normal'|'italic';
}
export interface Project {
  id: string;
  name: string;
  pages: Page[];
  activePageId: string;
  fonts?:ProjectFont[];
  description?:string;
  language?:string;
}
