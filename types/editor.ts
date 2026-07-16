// types/editor.ts — Editor state and UI types

import { CanvasElement, ElementType } from './elements';
import { Project } from './project';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string | null;
  type?: 'element' | 'page';
}

export type Language = 'en' | 'ru' | 'tj';

export interface RibbonContribution {
  id: string;
  pluginId: string;
  tab: string;
  group: string;
  label: string;
  icon: string;
  onClick: string;
}

export interface PluginRegistry {
  ribbonButtons: RibbonContribution[];
}

export interface EditorState {
  project: Project;
  activeLayerId: string; 
  hoveredLayerId: string | null;
  selectedElementIds: string[]; 
  insertMode: ElementType | null; 
  scale: number;
  showGrid: boolean;
  showLayers: boolean;
  showRightPanel: boolean;
  isDragging: boolean;
  isResizing: boolean;
  contextMenu: ContextMenuState;
  clipboard: CanvasElement[]; 
  theme: 'light' | 'dark';
  language: Language;
  pluginContributions: PluginRegistry;
  history: Project[];
  historyIndex: number;
}
