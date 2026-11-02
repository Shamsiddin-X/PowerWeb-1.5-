import { DEFAULT_PAGE_SIZE } from '../../utils/pageDefaults';
// store/slices/projectSlice.ts — Project-level actions

import { StateCreator } from 'zustand';
import { EditorState, Project, Page, Layer, ProjectFont } from '../../types';
import { withHistory, generateId, cloneElements, normalizeContext } from '../helpers';
import { validateProject } from '../../utils/fileFormat';

export interface ProjectSlice {
  updateProjectMetadata:(key:'description'|'language',value:string)=>void;
  addProjectFont:(font:ProjectFont)=>void;
  loadProject: (project: Project) => void;
  renameProject: (name: string) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  switchPage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  duplicatePage: (pageId: string) => void;
  updatePageProperty: (key: string, value: any) => void;
}

export const createProjectSlice: StateCreator<EditorState, [], [], ProjectSlice> = (set, get) => ({

  updateProjectMetadata:(key,value)=>set(state=>{const project=validateProject({...state.project,[key]:value});return withHistory(state,project);}),
  addProjectFont:font=>set(state=>{
    const fonts=[...(state.project.fonts||[]).filter(existing=>existing.family!==font.family),font];
    const project=validateProject({...state.project,fonts});return withHistory(state,project);
  }),
  loadProject: (input) => set(() => {
    const project = validateProject(input);
    const context = normalizeContext(project, { activeLayerId: '', selectedElementIds: [] });
    return { project, showShaderEditor: false, showShaderCodeEditor: false, shaderPresetId: null, shaderEditorScope: null, showStartScreen: false, hasOpenProject: true, history: [project], historyIndex: 0, ...context, historyContexts: [context],
      historyTransaction: null, historyMergeKey: null, historyMergeTime: 0,
      savedProject: project, insertMode: null, isDragging: false, isResizing: false,
      contextMenu: { visible: false, x: 0, y: 0, elementId: null } };
  }),

  renameProject: (name) => set(state => {
    const newProject = { ...state.project, name };
    return withHistory(state, newProject);
  }),

  addPage: () => set(state => {
    let counter = state.project.pages.length + 1;
    let newName = `Page ${counter}`;
    while (state.project.pages.some(p => p.name === newName)) {
      newName = `Page ${++counter}`;
    }
    const newLayer: Layer = {
      id: `layer_${generateId()}`,
      name: 'Layer 1',
      visible: true,
      locked: false,
      elements: [],
    };
    const newPage: Page = {
      id: generateId(),
      name: newName,
      width: DEFAULT_PAGE_SIZE.width,
      height: DEFAULT_PAGE_SIZE.height,
      backgroundColor: '#ffffff',
      transition: 'none',
      transitionDuration: 0.5,
      layers: [newLayer],
    };
    const newProject = {
      ...state.project,
      pages: [...state.project.pages, newPage],
      activePageId: newPage.id,
    };
    return {
      ...withHistory(state, newProject),
      activeLayerId: newLayer.id,
      selectedElementIds: [],
    };
  }),

  deletePage: (pageId) => set(state => {
    if (state.project.pages.length <= 1) return state;
    const newPages = state.project.pages.filter(p => p.id !== pageId);
    let newActiveId = state.project.activePageId;
    let newActiveLayerId = state.activeLayerId;
    if (pageId === state.project.activePageId) {
      newActiveId = newPages[0].id;
      newActiveLayerId = newPages[0].layers[0]?.id || '';
    }
    const newProject = { ...state.project, pages: newPages, activePageId: newActiveId };
    return { ...withHistory(state, newProject), activeLayerId: newActiveLayerId };
  }),

  switchPage: (pageId) => set(state => {
    const targetPage = state.project.pages.find(p => p.id === pageId);
    if (!targetPage) return {};
    return {
      historyMergeKey: null,
      project: { ...state.project, activePageId: pageId },
      activeLayerId: targetPage?.layers[0]?.id || '',
      selectedElementIds: [],
    };
  }),

  renamePage: (pageId, name) => set(state => {
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p => p.id === pageId ? { ...p, name } : p),
    };
    return withHistory(state, newProject);
  }),

  duplicatePage: (pageId) => set(state => {
    const source = state.project.pages.find(p => p.id === pageId);
    if (!source) return state;
    const newId = generateId();
    const ids = new Map<string, string>([[source.id, newId]]);
    const copiedElements = cloneElements(source.layers.flatMap(l => l.elements), 0, ids);
    let cursor = 0;
    const newPage: Page = {
      ...structuredClone(source), id: newId, name: `${source.name} (copy)`,
      layers: source.layers.map(l => {
        const elements = copiedElements.slice(cursor, cursor + l.elements.length);
        cursor += l.elements.length;
        return { ...l, id: `layer_${generateId()}`, elements };
      }),
    };
    const idx = state.project.pages.findIndex(p => p.id === pageId);
    const newPages = [
      ...state.project.pages.slice(0, idx + 1),
      newPage,
      ...state.project.pages.slice(idx + 1),
    ];
    const newProject = { ...state.project, pages: newPages, activePageId: newPage.id };
    return {
      ...withHistory(state, newProject),
      activeLayerId: newPage.layers[0]?.id || '',
      selectedElementIds: [],
    };
  }),

  updatePageProperty: (key, value) => set(state => {
    if (key === 'transition' && !['none','fade','push_left','push_right','push_up','push_down','zoom_in','zoom_out'].includes(value)) return {};
    if (key === 'backgroundColor' && typeof value !== 'string') return {};
    if(key==='responsive'&&typeof value!=='boolean')return {};
    if(key==='description'&&typeof value!=='string')return {};
    if(key==='mobileBreakpoint'&&(!Number.isFinite(value)||value<320||value>1600))return {};
    if (!['width', 'height', 'backgroundColor', 'transition', 'transitionDuration','responsive','mobileBreakpoint','description'].includes(key)) return {};
    if (['width', 'height', 'transitionDuration'].includes(key) &&
      (typeof value !== 'number' || !Number.isFinite(value) || value < (key === 'transitionDuration' ? 0 : 1))) return {};
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId ? { ...p, [key]: value } : p
      ),
    };
    return withHistory(state, newProject);
  }),
});
