// store/slices/projectSlice.ts — Project-level actions

import { StateCreator } from 'zustand';
import { EditorState, Project, Page, Layer } from '../../types';
import { withHistory, generateId } from '../helpers';

export interface ProjectSlice {
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

  loadProject: (project) => set({
    project,
    history: [project],
    historyIndex: 0,
    selectedElementIds: [],
    activeLayerId: project.pages[0]?.layers[0]?.id || '',
  }),

  renameProject: (name) => set(state => {
    const newProject = { ...state.project, name };
    return withHistory(state, newProject);
  }),

  addPage: () => set(state => {
    const counter = state.project.pages.length + 1;
    let newName = `Page ${counter}`;
    while (state.project.pages.some(p => p.name === newName)) {
      newName = `Page ${state.project.pages.length + Math.random()}`;
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
      width: 1200,
      height: 800,
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
    return {
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
    const newPage: Page = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(),
      name: `${source.name} (copy)`,
      layers: source.layers.map(l => ({
        ...l,
        id: `layer_${generateId()}`,
        elements: l.elements.map(el => ({ ...el, id: generateId() })),
      })),
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
    const newProject = {
      ...state.project,
      pages: state.project.pages.map(p =>
        p.id === state.project.activePageId ? { ...p, [key]: value } : p
      ),
    };
    return withHistory(state, newProject);
  }),
});
