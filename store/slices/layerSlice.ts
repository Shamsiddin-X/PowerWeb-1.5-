import { ShaderConfig, isShaderConfig, shaderCanApply } from '../../types/shaders';
// store/slices/layerSlice.ts — Layer management actions

import { StateCreator } from 'zustand';
import { EditorState, Layer } from '../../types';
import { withHistory, generateId } from '../helpers';

export interface LayerSlice {
  setLayerShader: (layerId: string, shader: ShaderConfig | null) => void;
  addLayer: () => void;
  deleteLayer: () => void;
  selectLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  reorderLayers: (fromDisplayIndex: number, toDisplayIndex: number) => void;
  setHoveredLayer: (layerId: string | null) => void;
}

export const createLayerSlice: StateCreator<EditorState, [], [], LayerSlice> = (set, get) => ({

  setLayerShader: (layerId, shader) => set(state => {
    if (shader !== null && (!isShaderConfig(shader)||!shaderCanApply(shader))) return {};
    const page = state.project.pages.find(p => p.id === state.project.activePageId);
    const layer = page?.layers.find(l => l.id === layerId);
    if (!layer || layer.locked || !layer.visible) return {};
    const project = { ...state.project, pages: state.project.pages.map(p => p.id !== page!.id ? p : {
      ...p, layers: p.layers.map(l => l.id !== layerId ? l : { ...l, shader: shader ? structuredClone(shader) : null })
    }) };
    return withHistory(state, project);
  }),


  addLayer: () => set(state => {
    const activePage = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!activePage) return state;
    const newLayer: Layer = {
      id: `layer_${generateId()}`,
      name: `Layer ${activePage.layers.length + 1}`,
      visible: true,
      locked: false,
      elements: [],
    };
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId
          ? { ...p, layers: [...p.layers, newLayer] }
          : p
      ),
    };
    return { ...withHistory(state, newProject), activeLayerId: newLayer.id };
  }),

  deleteLayer: () => set(state => {
    const activePage = state.project.pages.find(p => p.id === state.project.activePageId);
    if (!activePage || activePage.layers.length <= 1) return state;
    const newLayers = activePage.layers.filter(l => l.id !== state.activeLayerId);
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId ? { ...p, layers: newLayers } : p
      ),
    };
    const newActiveId = newLayers[0]?.id || '';
    return { ...withHistory(state, newProject), activeLayerId: newActiveId };
  }),

  selectLayer: (layerId) => set(s => {
    if (!s.project.pages.find(p => p.id === s.project.activePageId)?.layers.some(l => l.id === layerId)) return {};
    return { activeLayerId: layerId, selectedElementIds: [], historyMergeKey: null };
  }),

  toggleLayerVisibility: (layerId) => set(state => {
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId
          ? {
              ...p,
              layers: p.layers.map(l =>
                l.id === layerId ? { ...l, visible: !l.visible } : l
              ),
            }
          : p
      ),
    };
    return withHistory(state, newProject);
  }),

  toggleLayerLock: (layerId) => set(state => {
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId
          ? {
              ...p,
              layers: p.layers.map(l =>
                l.id === layerId ? { ...l, locked: !l.locked } : l
              ),
            }
          : p
      ),
    };
    return withHistory(state, newProject);
  }),

  renameLayer: (layerId, name) => set(state => {
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId
          ? {
              ...p,
              layers: p.layers.map(l =>
                l.id === layerId ? { ...l, name: name || 'Untitled Layer' } : l
              ),
            }
          : p
      ),
    };
    return withHistory(state, newProject);
  }),

  reorderLayers: (fromDisplayIndex, toDisplayIndex) => set(state => {
    if (fromDisplayIndex === toDisplayIndex) return state;
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p => {
        if (p.id !== state.project.activePageId) return p;
        if (![fromDisplayIndex, toDisplayIndex].every(i => Number.isInteger(i) && i >= 0 && i < p.layers.length)) return p;
        // Display is reversed (front layer first), storage is back-to-front
        const displayOrder = [...p.layers].reverse();
        const [moved] = displayOrder.splice(fromDisplayIndex, 1);
        displayOrder.splice(toDisplayIndex, 0, moved);
        return { ...p, layers: displayOrder.reverse() };
      }),
    };
    return withHistory(state, newProject);
  }),

  setHoveredLayer: (layerId) => set({ hoveredLayerId: layerId }),
});
