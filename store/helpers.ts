// store/helpers.ts — Store utility functions: withHistory, updateActiveElements, generateId

import { EditorState, Project, CanvasElement } from '../types';

const MAX_HISTORY = 20;

/**
 * Wraps a state mutation so that the resulting project is automatically pushed
 * to the undo/redo history stack.
 * 
 * Usage inside a slice action:
 *   set(withHistory(state, newProject))
 */
export function withHistory(state: EditorState, newProject: Project): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newProject);
  if (newHistory.length > MAX_HISTORY) newHistory.shift();
  return {
    project: newProject,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

/**
 * Generic helper: applies an updater function to every selected element
 * in the currently active page's layers, returning a new project.
 */
export function updateActiveElements(
  state: EditorState,
  updater: (el: CanvasElement) => CanvasElement
): Project {
  const newPages = state.project.pages.map(page => {
    if (page.id !== state.project.activePageId) return page;
    return {
      ...page,
      layers: page.layers.map(layer => ({
        ...layer,
        elements: layer.elements.map(el =>
          state.selectedElementIds.includes(el.id) ? updater(el) : el
        ),
      })),
    };
  });
  return { ...state.project, pages: newPages };
}

/**
 * Helper: applies an updater function to a specific element by ID
 * on the active page.
 */
export function updateElementById(
  state: EditorState,
  elementId: string,
  updater: (el: CanvasElement) => CanvasElement
): Project {
  const newPages = state.project.pages.map(page => {
    if (page.id !== state.project.activePageId) return page;
    return {
      ...page,
      layers: page.layers.map(layer => ({
        ...layer,
        elements: layer.elements.map(el =>
          el.id === elementId ? updater(el) : el
        ),
      })),
    };
  });
  return { ...state.project, pages: newPages };
}

/**
 * Helper: applies an updater function to the active page, returning new project.
 */
export function updateActivePage(
  state: EditorState,
  updater: (page: import('../types').Page) => import('../types').Page
): Project {
  const newPages = state.project.pages.map(page => {
    if (page.id !== state.project.activePageId) return page;
    return updater(page);
  });
  return { ...state.project, pages: newPages };
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
