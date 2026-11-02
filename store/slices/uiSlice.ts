// store/slices/uiSlice.ts — UI-only state (theme, panels, context menu, etc.)

import { VIEW_DEFAULTS, resolveTheme } from '../../services/editorPreferences';
import { isLanguage } from '../../utils/languages';
import { StateCreator } from 'zustand';
import { EditorState, Language, ThemeMode, ContextMenuState } from '../../types';

export interface UiSlice {
  setShowStartScreen: (show: boolean) => void;
  setUiScale:(value:number)=>void;
  setThemeMode:(mode:ThemeMode)=>void;
  setGridSize:(size:number)=>void;
  toggleViewOption:(key:'showPages'|'showStatusBar'|'focusMode'|'snapEnabled'|'showGuides')=>void;
  setRibbonExpanded:(expanded:boolean)=>void;
  resetViewSettings:()=>void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setScale: (scale: number) => void;
  toggleGrid: () => void;
  toggleLayers: () => void;
  toggleRightPanel: () => void;
  setShowRightPanel: (val: boolean) => void;
  setShowLayers: (val: boolean) => void;
  openContextMenu: (x: number, y: number, elementId: string | null, type?: 'element' | 'page') => void;
  closeContextMenu: () => void;
}

export const createUiSlice: StateCreator<EditorState, [], [], UiSlice> = (set) => ({
  setShowStartScreen: (showStartScreen) => set({ showStartScreen }),

  setUiScale:value=>{if(Number.isFinite(value))set({uiScale:Number(Math.min(2,Math.max(.5,value)).toFixed(2))});},
  setThemeMode:themeMode=>{if(['light','dark','system'].includes(themeMode))set({themeMode,theme:resolveTheme(themeMode)});},
  setGridSize:gridSize=>{if(Number.isFinite(gridSize))set({gridSize:Math.min(100,Math.max(5,Math.round(gridSize)))});},
  toggleViewOption:key=>set(state=>({[key]:!state[key]})),
  setRibbonExpanded:ribbonExpanded=>set({ribbonExpanded}),
  resetViewSettings:()=>set({...VIEW_DEFAULTS}),
  setTheme: (theme) => set({ theme,themeMode:theme }),

  toggleTheme: () => set(state => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
    themeMode:state.theme==='light'?'dark':'light',
  })),

  setLanguage: (language) => {if(isLanguage(language))set({ language });},

  setScale: (scale) => { if (Number.isFinite(scale)) set({ scale: Math.min(5, Math.max(0.1, scale)) }); },

  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),

  toggleLayers: () => set(state => ({ showLayers: !state.showLayers })),

  toggleRightPanel: () => set(state => ({ showRightPanel: !state.showRightPanel })),

  setShowRightPanel: (val) => set({ showRightPanel: val }),

  setShowLayers: (val) => set({ showLayers: val }),

  openContextMenu: (x, y, elementId, type = 'element') => set({
    contextMenu: { visible: true, x, y, elementId, type },
  }),

  closeContextMenu: () => set(state => ({
    contextMenu: { ...state.contextMenu, visible: false },
  })),
});
