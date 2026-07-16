// store/slices/elementSlice.ts — Element CRUD and transform actions

import { StateCreator } from 'zustand';
import { EditorState, CanvasElement, ElementStyle, ElementType, DEFAULT_STYLE } from '../../types';
import { withHistory, updateActiveElements, updateElementById, generateId } from '../helpers';

export interface ElementSlice {
  // Selection
  selectElement: (id: string, multi?: boolean) => void;
  deselectAll: () => void;

  // CRUD
  addElement: (element: CanvasElement) => void;
  deleteSelected: () => void;

  // Transform (position / size)
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, x: number, y: number, width: number, height: number) => void;
  updateElementPosition: (id: string, x: number, y: number) => void;

  // Properties
  updateElementProp: (key: string, value: any) => void;
  updateElementStyle: (key: keyof ElementStyle, value: any) => void;
  updateElementStyleBulk: (style: Partial<ElementStyle>) => void;
  updateSpecificElement: (id: string, updates: Partial<CanvasElement>) => void;
  setPositionMode: (mode: 'absolute' | 'fixed') => void;

  // Clipboard
  copySelected: () => void;
  pasteElements: () => void;
  cutSelected: () => void;
  duplicateSelected: () => void;

  // Ordering
  bringToFront: () => void;
  sendToBack: () => void;

  // Group
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Insert mode
  setInsertMode: (type: ElementType | null) => void;

  // Drag/resize flags
  setIsDragging: (val: boolean) => void;
  setIsResizing: (val: boolean) => void;
}

export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set, get) => ({

  selectElement: (id, multi = false) => set(state => {
    if (multi) {
      const already = state.selectedElementIds.includes(id);
      return {
        selectedElementIds: already
          ? state.selectedElementIds.filter(x => x !== id)
          : [...state.selectedElementIds, id],
      };
    }
    return { selectedElementIds: [id] };
  }),

  deselectAll: () => set({ selectedElementIds: [] }),

  addElement: (element) => set(state => {
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p => {
        if (p.id !== state.project.activePageId) return p;
        return {
          ...p,
          layers: p.layers.map(l => {
            if (l.id !== state.activeLayerId) return l;
            return { ...l, elements: [...l.elements, element] };
          }),
        };
      }),
    };
    return {
      ...withHistory(state, newProject),
      selectedElementIds: [element.id],
      insertMode: null,
    };
  }),

  deleteSelected: () => set(state => {
    if (state.selectedElementIds.length === 0) return state;
    const ids = new Set(state.selectedElementIds);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => ({
            ...l,
            elements: l.elements.filter(el => !ids.has(el.id)),
          })),
        }
      ),
    };
    return { ...withHistory(state, newProject), selectedElementIds: [] };
  }),

  moveElements: (ids, dx, dy) => set(state => {
    const idSet = new Set(ids);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => ({
            ...l,
            elements: l.elements.map(el =>
              idSet.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
            ),
          })),
        }
      ),
    };
    return withHistory(state, newProject);
  }),

  resizeElement: (id, x, y, width, height) => set(state => {
    const newProject = updateElementById(state, id, el => ({ ...el, x, y, width, height }));
    return withHistory(state, newProject);
  }),

  updateElementPosition: (id, x, y) => set(state => {
    const newProject = updateElementById(state, id, el => ({ ...el, x, y }));
    return withHistory(state, newProject);
  }),

  updateElementProp: (key, value) => set(state => {
    const newProject = updateActiveElements(state, el => ({ ...el, [key]: value }));
    return withHistory(state, newProject);
  }),

  updateElementStyle: (key, value) => set(state => {
    const newProject = updateActiveElements(state, el => ({
      ...el,
      style: { ...el.style, [key]: value },
    }));
    return withHistory(state, newProject);
  }),

  updateElementStyleBulk: (style) => set(state => {
    const newProject = updateActiveElements(state, el => ({
      ...el,
      style: { ...el.style, ...style },
    }));
    return withHistory(state, newProject);
  }),

  updateSpecificElement: (id, updates) => set(state => {
    const newProject = updateElementById(state, id, el => ({ ...el, ...updates }));
    // NOTE: does NOT push history — used for live drag/resize updates
    return { project: newProject };
  }),

  setPositionMode: (mode) => set(state => {
    const newProject = updateActiveElements(state, el => ({ ...el, positionMode: mode }));
    return withHistory(state, newProject);
  }),

  copySelected: () => set(state => {
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const ids = new Set(state.selectedElementIds);
    const copied: CanvasElement[] = [];
    for (const layer of page.layers) {
      for (const el of layer.elements) {
        if (ids.has(el.id)) copied.push(el);
      }
    }
    return { clipboard: copied };
  }),

  pasteElements: () => set(state => {
    if (state.clipboard.length === 0) return state;
    const newElements = state.clipboard.map(el => ({
      ...JSON.parse(JSON.stringify(el)),
      id: generateId(),
      x: el.x + 20,
      y: el.y + 20,
    }));
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l =>
            l.id !== state.activeLayerId ? l : {
              ...l,
              elements: [...l.elements, ...newElements],
            }
          ),
        }
      ),
    };
    return {
      ...withHistory(state, newProject),
      selectedElementIds: newElements.map(el => el.id),
    };
  }),

  cutSelected: () => set(state => {
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const ids = new Set(state.selectedElementIds);
    const copied: CanvasElement[] = [];
    for (const layer of page.layers) {
      for (const el of layer.elements) {
        if (ids.has(el.id)) copied.push(el);
      }
    }
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => ({
            ...l,
            elements: l.elements.filter(el => !ids.has(el.id)),
          })),
        }
      ),
    };
    return {
      ...withHistory(state, newProject),
      clipboard: copied,
      selectedElementIds: [],
    };
  }),

  duplicateSelected: () => set(state => {
    if (state.selectedElementIds.length === 0) return state;
    const ids = new Set(state.selectedElementIds);
    const newElements: CanvasElement[] = [];
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            const dupes = l.elements
              .filter(el => ids.has(el.id))
              .map(el => ({ ...JSON.parse(JSON.stringify(el)), id: generateId(), x: el.x + 20, y: el.y + 20 }));
            newElements.push(...dupes);
            return { ...l, elements: [...l.elements, ...dupes] };
          }),
        }
      ),
    };
    return {
      ...withHistory(state, newProject),
      selectedElementIds: newElements.map(el => el.id),
    };
  }),

  bringToFront: () => set(state => {
    if (state.selectedElementIds.length === 0) return state;
    const ids = new Set(state.selectedElementIds);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            const rest = l.elements.filter(el => !ids.has(el.id));
            const selected = l.elements.filter(el => ids.has(el.id));
            return { ...l, elements: [...rest, ...selected] };
          }),
        }
      ),
    };
    return withHistory(state, newProject);
  }),

  sendToBack: () => set(state => {
    if (state.selectedElementIds.length === 0) return state;
    const ids = new Set(state.selectedElementIds);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            const rest = l.elements.filter(el => !ids.has(el.id));
            const selected = l.elements.filter(el => ids.has(el.id));
            return { ...l, elements: [...selected, ...rest] };
          }),
        }
      ),
    };
    return withHistory(state, newProject);
  }),

  groupSelected: () => set(state => {
    if (state.selectedElementIds.length < 2) return state;
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const ids = new Set(state.selectedElementIds);

    // Collect all selected elements from the active layer
    const activeLayer = page.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return state;
    const selected = activeLayer.elements.filter(el => ids.has(el.id));
    if (selected.length < 2) return state;

    const minX = Math.min(...selected.map(el => el.x));
    const minY = Math.min(...selected.map(el => el.y));
    const maxX = Math.max(...selected.map(el => el.x + el.width));
    const maxY = Math.max(...selected.map(el => el.y + el.height));

    const group: CanvasElement = {
      id: generateId(),
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      style: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0, opacity: 1, borderRadius: 0 },
      elements: selected.map(el => ({ ...el, x: el.x - minX, y: el.y - minY })),
    };

    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l =>
            l.id !== state.activeLayerId ? l : {
              ...l,
              elements: [...l.elements.filter(el => !ids.has(el.id)), group],
            }
          ),
        }
      ),
    };
    return { ...withHistory(state, newProject), selectedElementIds: [group.id] };
  }),

  ungroupSelected: () => set(state => {
    if (state.selectedElementIds.length !== 1) return state;
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const groupId = state.selectedElementIds[0];
    const activeLayer = page.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return state;
    const group = activeLayer.elements.find(el => el.id === groupId && el.type === 'group');
    if (!group || !group.elements) return state;

    const ungrouped = group.elements.map(el => ({
      ...el,
      id: generateId(),
      x: el.x + group.x,
      y: el.y + group.y,
    }));

    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l =>
            l.id !== state.activeLayerId ? l : {
              ...l,
              elements: [...l.elements.filter(el => el.id !== groupId), ...ungrouped],
            }
          ),
        }
      ),
    };
    return {
      ...withHistory(state, newProject),
      selectedElementIds: ungrouped.map(el => el.id),
    };
  }),

  setInsertMode: (type) => set({ insertMode: type, selectedElementIds: [] }),
  setIsDragging: (val) => set({ isDragging: val }),
  setIsResizing: (val) => set({ isResizing: val }),
});
