// store/slices/selectionSlice.ts — Element selection actions

import { StateCreator } from 'zustand';
import { EditorState } from '../../types';

export interface SelectionSlice {
  selectElement: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  selectAll: () => void;
}

export const createSelectionSlice: StateCreator<EditorState, [], [], SelectionSlice> = (set, get) => ({

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

  selectAll: () => set(state => {
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const layer = page.layers.find(l => l.id === state.activeLayerId);
    if (!layer || layer.locked) return state;
    return { selectedElementIds: layer.elements.map(el => el.id) };
  }),
});
