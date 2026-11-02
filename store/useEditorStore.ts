import { DEFAULT_PAGE_SIZE } from '../utils/pageDefaults';
// store/useEditorStore.ts — Main Zustand store combining all slices

import { readPreferences, resolveTheme } from '../services/editorPreferences';
import { create } from 'zustand';
import { EditorState, Project } from '../types';

// Slice creators
import { createProjectSlice, ProjectSlice } from './slices/projectSlice';
import { createLayerSlice, LayerSlice } from './slices/layerSlice';
import { createElementSlice, ElementSlice } from './slices/elementSlice';
import { createSelectionSlice, SelectionSlice } from './slices/selectionSlice';
import { createClipboardSlice, ClipboardSlice } from './slices/clipboardSlice';
import { createOrderSlice, OrderSlice } from './slices/orderSlice';
import { createGroupSlice, GroupSlice } from './slices/groupSlice';
import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createPluginSlice, PluginSlice } from './slices/pluginSlice';
import { generateId, normalizeContext, contextOf } from './helpers';

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
      width: DEFAULT_PAGE_SIZE.width,
      height: DEFAULT_PAGE_SIZE.height,
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
  & SelectionSlice
  & ClipboardSlice
  & OrderSlice
  & GroupSlice
  & HistorySlice
  & UiSlice
  & PluginSlice;

// ─── Initial State ───────────────────────────────────────────────────────────

const preferences=readPreferences();
const INITIAL_STATE: EditorState = {
  showShaderEditor: false,
  showShaderCodeEditor: false,
  shaderPresetId: null,
  shaderEditorScope: null,
  showStartScreen: true,
  hasOpenProject: false,
  project: INITIAL_PROJECT,
  activeLayerId: INITIAL_LAYER_ID,
  hoveredLayerId: null,
  selectedElementIds: [],
  insertMode: null,
  isDragging: false,
  isResizing: false,
  contextMenu: { visible: false, x: 0, y: 0, elementId: null },
  clipboard: [],
  theme: resolveTheme(preferences.themeMode),
  pluginContributions: { ribbonButtons: [] },
  history: [INITIAL_PROJECT],
  historyIndex: 0,
  historyContexts: [{ activeLayerId: INITIAL_LAYER_ID, selectedElementIds: [] }],
  historyTransaction: null,
  historyMergeKey: null,
  historyMergeTime: 0,
  pasteCount: 0,
  clipboardMode: 'copy',
  savedProject: INITIAL_PROJECT,
  isPluginRunning: false,
  ...preferences,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((baseSet, get, api) => {
  const set: typeof baseSet = (update: any) => baseSet(state => {
    const patch = typeof update === 'function' ? update(state) : update;
    if (!patch || Object.keys(patch).length === 0) return state;
    const next = { ...state, ...patch };
    const context = normalizeContext(next.project, contextOf(next));
    if (patch.history && patch.history !== state.history) {
      next.historyContexts = [...next.historyContexts];
      next.historyContexts[next.historyIndex] = context;
    }
    return { ...next, ...context };
  });
  return ({
  ...INITIAL_STATE,
  ...createProjectSlice(set, get, api),
  ...createLayerSlice(set, get, api),
  ...createElementSlice(set, get, api),
  ...createSelectionSlice(set, get, api),
  ...createClipboardSlice(set, get, api),
  ...createOrderSlice(set, get, api),
  ...createGroupSlice(set, get, api),
  ...createHistorySlice(set, get, api),
  ...createUiSlice(set, get, api),
  ...createPluginSlice(set, get, api),
});
});
