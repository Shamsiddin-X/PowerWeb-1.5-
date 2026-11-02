// store/slices/groupSlice.ts — Group / Ungroup actions

import { StateCreator } from 'zustand';
import { EditorState, CanvasElement } from '../../types';
import { withHistory, generateId } from '../helpers';

export interface GroupSlice {
  groupSelected: () => void;
  ungroupSelected: () => void;
}

export const createGroupSlice: StateCreator<EditorState, [], [], GroupSlice> = (set) => ({

  groupSelected: () => set(state => {
    if (state.selectedElementIds.length < 2) return state;
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!page) return state;
    const ids = new Set(state.selectedElementIds);
    const activeLayer = page.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return state;
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
              elements: l.elements.flatMap((el, index) => index === l.elements.findIndex(e => ids.has(e.id))
                ? [group] : ids.has(el.id) ? [] : [el]),
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
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return state;
    const group = activeLayer.elements.find(el => el.id === groupId && el.type === 'group');
    if (!group || !group.elements) return state;

    const ungrouped = group.elements.map(el => ({
      ...el,
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
              elements: l.elements.flatMap(el => el.id === groupId ? ungrouped : [el]),
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
});
