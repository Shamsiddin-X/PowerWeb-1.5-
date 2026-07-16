// store/slices/pluginSlice.ts — Plugin system actions

import { StateCreator } from 'zustand';
import { EditorState } from '../../types';
import { Plugin, executePlugin } from '../../services/pluginService';

export interface PluginSlice {
  runPlugin: (plugin: Plugin) => void;
}

export const createPluginSlice: StateCreator<EditorState, [], [], PluginSlice> = (set, get) => ({

  runPlugin: (plugin) => {
    const state = get();

    // Build the plugin API object
    const api = {
      getProject: () => state.project,
      getSelectedElement: () => {
        const page = state.project.pages.find(p => p.id === state.project.activePageId);
        if (!page || state.selectedElementIds.length === 0) return null;
        for (const layer of page.layers) {
          const found = layer.elements.find(el => el.id === state.selectedElementIds[0]);
          if (found) return found;
        }
        return null;
      },
      addElement: (el: any) => get().addElement(el),
      updateElement: (key: string, value: any) => get().updateElementProp(key, value),
      updateStyle: (key: string, value: any) => get().updateElementStyle(key as any, value),
      log: (msg: string) => console.log(`[Plugin: ${plugin.name}]`, msg),
    };

    executePlugin(plugin, api);
  },
});
