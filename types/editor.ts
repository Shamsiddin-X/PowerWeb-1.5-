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

export type Language = 'en' | 'ru' | 'tj' | 'ar' | 'zh' | 'fr' | 'es';
export type ThemeMode = 'light' | 'dark' | 'system';

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

export interface HistoryContext {
  activeLayerId: string;
  selectedElementIds: string[];
}
export interface HistoryTransaction extends HistoryContext {
  project: Project;
  label: string;
}

export interface EditorState {
  showShaderEditor: boolean;
  showShaderCodeEditor: boolean;
  shaderPresetId: string | null;
  shaderEditorScope: 'layer' | 'object' | null;
  showStartScreen: boolean;
  hasOpenProject: boolean;
  project: Project;
  activeLayerId: string; 
  hoveredLayerId: string | null;
  selectedElementIds: string[]; 
  insertMode: ElementType | null; 
  scale: number;
  showGrid: boolean;
  showPages: boolean;
  showStatusBar: boolean;
  focusMode: boolean;
  gridSize: number;
  snapEnabled: boolean;
  showGuides: boolean;
  uiScale: number;
  ribbonExpanded: boolean;
  themeMode: ThemeMode;
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
  historyContexts: HistoryContext[];
  historyTransaction: HistoryTransaction | null;
  historyMergeKey: string | null;
  historyMergeTime: number;
  pasteCount: number;
  clipboardMode: 'copy' | 'cut';
  savedProject: Project | null;
  isPluginRunning: boolean;
}
