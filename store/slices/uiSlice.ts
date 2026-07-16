// store/slices/uiSlice.ts — UI-only state (theme, panels, context menu, etc.)

import { StateCreator } from 'zustand';
import { EditorState, Language, ContextMenuState } from '../../types';

export interface UiSlice {
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

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => set(state => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
  })),

  setLanguage: (language) => set({ language }),

  setScale: (scale) => set({ scale }),

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
