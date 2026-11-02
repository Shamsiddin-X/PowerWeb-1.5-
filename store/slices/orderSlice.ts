// store/slices/orderSlice.ts — Z-order actions (bring to front / send to back)

import { StateCreator } from 'zustand';
import { EditorState } from '../../types';
import { withHistory } from '../helpers';

export interface OrderSlice {
  bringToFront: () => void;
  sendToBack: () => void;
  moveUp: () => void;
  moveDown: () => void;
}

export const createOrderSlice: StateCreator<EditorState, [], [], OrderSlice> = (set) => ({

  bringToFront: () => set(state => {
    if (state.selectedElementIds.length === 0) return state;
    const ids = new Set(state.selectedElementIds);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            if (l.locked || !l.visible) return l;
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
            if (l.locked || !l.visible) return l;
            const rest = l.elements.filter(el => !ids.has(el.id));
            const selected = l.elements.filter(el => ids.has(el.id));
            return { ...l, elements: [...selected, ...rest] };
          }),
        }
      ),
    };
    return withHistory(state, newProject);
  }),

  moveUp: () => set(state => {
    if (state.selectedElementIds.length !== 1) return state;
    const id = state.selectedElementIds[0];
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            if (l.locked || !l.visible) return l;
            const idx = l.elements.findIndex(el => el.id === id);
            if (idx < 0 || idx === l.elements.length - 1) return l;
            const els = [...l.elements];
            [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
            return { ...l, elements: els };
          }),
        }
      ),
    };
    return withHistory(state, newProject);
  }),

  moveDown: () => set(state => {
    if (state.selectedElementIds.length !== 1) return state;
    const id = state.selectedElementIds[0];
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id !== state.project.activePageId ? p : {
          ...p,
          layers: p.layers.map(l => {
            if (l.locked || !l.visible) return l;
            const idx = l.elements.findIndex(el => el.id === id);
            if (idx <= 0) return l;
            const els = [...l.elements];
            [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
            return { ...l, elements: els };
          }),
        }
      ),
    };
    return withHistory(state, newProject);
  }),
});
