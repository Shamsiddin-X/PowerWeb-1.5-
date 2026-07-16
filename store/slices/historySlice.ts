// store/slices/historySlice.ts — Undo / Redo

import { StateCreator } from 'zustand';
import { EditorState } from '../../types';

export interface HistorySlice {
  undo: () => void;
  redo: () => void;
}

export const createHistorySlice: StateCreator<EditorState, [], [], HistorySlice> = (set, get) => ({

  undo: () => set(state => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    return {
      project: state.history[newIndex],
      historyIndex: newIndex,
      selectedElementIds: [],
    };
  }),

  redo: () => set(state => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    return {
      project: state.history[newIndex],
      historyIndex: newIndex,
      selectedElementIds: [],
    };
  }),
});
