// store/selectors.ts — Memoized selectors for zero-prop-drilling access

import { EditorState, CanvasElement, Page, Layer } from '../types';
import { useEditorStore } from './useEditorStore';

// ─── Primitive Selectors (used directly as useEditorStore(selectorFn)) ───

export const selectProject         = (s: EditorState) => s.project;
export const selectActivePage      = (s: EditorState): Page | undefined =>
  s.project.pages.find(p => p.id === s.project.activePageId);
export const selectActiveLayer     = (s: EditorState): Layer | undefined => {
  const page = selectActivePage(s);
  return page?.layers.find(l => l.id === s.activeLayerId);
};
export const selectSelectedIds     = (s: EditorState) => s.selectedElementIds;
export const selectScale           = (s: EditorState) => s.scale;
export const selectInsertMode      = (s: EditorState) => s.insertMode;
export const selectTheme           = (s: EditorState) => s.theme;
export const selectLanguage        = (s: EditorState) => s.language;
export const selectShowGrid        = (s: EditorState) => s.showGrid;
export const selectShowLayers      = (s: EditorState) => s.showLayers;
export const selectShowRightPanel  = (s: EditorState) => s.showRightPanel;
export const selectContextMenu     = (s: EditorState) => s.contextMenu;
export const selectClipboard       = (s: EditorState) => s.clipboard;
export const selectIsDragging      = (s: EditorState) => s.isDragging;
export const selectIsResizing      = (s: EditorState) => s.isResizing;
export const selectHoveredLayerId  = (s: EditorState) => s.hoveredLayerId;
export const selectActiveLayerId   = (s: EditorState) => s.activeLayerId;

/**
 * Returns the first selected element, or null.
 */
export const selectSelectedElement = (s: EditorState): CanvasElement | null => {
  if (s.selectedElementIds.length === 0) return null;
  const page = selectActivePage(s);
  if (!page) return null;
  for (const layer of page.layers) {
    const found = layer.elements.find(el => el.id === s.selectedElementIds[0]);
    if (found) return found;
  }
  return null;
};

/**
 * Returns all selected elements.
 */
export const selectAllSelectedElements = (s: EditorState): CanvasElement[] => {
  const page = selectActivePage(s);
  if (!page) return [];
  const ids = new Set(s.selectedElementIds);
  const result: CanvasElement[] = [];
  for (const layer of page.layers) {
    for (const el of layer.elements) {
      if (ids.has(el.id)) result.push(el);
    }
  }
  return result;
};

// ─── Hook-based selectors (convenience) ───

export const useActivePage      = () => useEditorStore(selectActivePage);
export const useActiveLayer     = () => useEditorStore(selectActiveLayer);
export const useSelectedElement = () => useEditorStore(selectSelectedElement);
export const useSelectedIds     = () => useEditorStore(selectSelectedIds);
export const useScale           = () => useEditorStore(selectScale);
export const useInsertMode      = () => useEditorStore(selectInsertMode);
export const useTheme           = () => useEditorStore(selectTheme);
export const useLanguage        = () => useEditorStore(selectLanguage);
