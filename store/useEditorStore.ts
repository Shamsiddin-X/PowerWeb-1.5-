// store/useEditorStore.ts — Main Zustand store combining all slices

import { create } from 'zustand';
import { EditorState, Project } from '../types';

// Slice creators
import { createProjectSlice, ProjectSlice } from './slices/projectSlice';
import { createLayerSlice, LayerSlice } from './slices/layerSlice';
import { createElementSlice, ElementSlice } from './slices/elementSlice';
import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createPluginSlice, PluginSlice } from './slices/pluginSlice';
import { generateId } from './helpers';

// ─── Initial Project ────────────────────────────────────────────────────────

const INITIAL_LAYER_ID = `layer_${generateId()}`;
const INITIAL_PAGE_ID = generateId();

const INITIAL_PROJECT: Project = {
  id: generateId(),
  name: 'My Project',
  activePageId: INITIAL_PAGE_ID,
  pages: [
    {
      id: INITIAL_PAGE_ID,
      name: 'Page 1',
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      transition: 'none',
      transitionDuration: 0.5,
      layers: [
        {
          id: INITIAL_LAYER_ID,
          name: 'Layer 1',
          visible: true,
          locked: false,
          elements: [],
        },
      ],
    },
  ],
};

// ─── Full Store Type ─────────────────────────────────────────────────────────

export type EditorStore = EditorState
  & ProjectSlice
  & LayerSlice
  & ElementSlice
  & HistorySlice
  & UiSlice
  & PluginSlice;

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_STATE: EditorState = {
  project: INITIAL_PROJECT,
  activeLayerId: INITIAL_LAYER_ID,
  hoveredLayerId: null,
  selectedElementIds: [],
  insertMode: null,
  scale: 1,
  showGrid: false,
  showLayers: false,
  showRightPanel: true,
  isDragging: false,
  isResizing: false,
  contextMenu: { visible: false, x: 0, y: 0, elementId: null },
  clipboard: [],
  theme: 'light',
  language: 'en',
  pluginContributions: { ribbonButtons: [] },
  history: [INITIAL_PROJECT],
  historyIndex: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get, api) => ({
  ...INITIAL_STATE,
  ...createProjectSlice(set, get, api),
  ...createLayerSlice(set, get, api),
  ...createElementSlice(set, get, api),
  ...createHistorySlice(set, get, api),
  ...createUiSlice(set, get, api),
  ...createPluginSlice(set, get, api),
}));
