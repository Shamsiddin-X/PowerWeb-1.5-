import { StateCreator } from 'zustand';
import { executePlugin, Plugin } from '../../services/pluginService';
import { validateProject } from '../../utils/fileFormat';
import { contextOf, normalizeContext, withHistory } from '../helpers';
import type { EditorStore } from '../useEditorStore';
export interface PluginSlice { runPlugin: (plugin: Plugin) => Promise<void>; }
export const createPluginSlice: StateCreator<EditorStore, [], [], PluginSlice> = (set, get) => ({
  runPlugin: async plugin => {
    if (get().isPluginRunning) throw new Error('A plugin is already running.');
    set({ isPluginRunning: true });
    get().commitTransaction();
    get().beginTransaction(`Plugin: ${plugin.name}`);
    const commands: Record<string, keyof EditorStore> = { copy:'copySelected', cut:'cutSelected', paste:'pasteElements', duplicate:'duplicateSelected', delete:'deleteSelected', group:'groupSelected', ungroup:'ungroupSelected', bringToFront:'bringToFront', sendToBack:'sendToBack' };
    const api = {
      get state() { return structuredClone(Object.fromEntries(Object.entries(get()).filter(([,v]) => typeof v !== 'function'))); },
      setState: (update: any) => {
        const previous = structuredClone(Object.fromEntries(Object.entries(get()).filter(([,v]) => typeof v !== 'function')));
        const patch = typeof update === 'function' ? update(previous) : update;
        if (!patch) return;
        set(s => {
          const project = patch.project ? validateProject(patch.project) : s.project;
          const context = normalizeContext(project, { ...contextOf(s), ...(patch.activeLayerId ? { activeLayerId:patch.activeLayerId } : {}), ...(patch.selectedElementIds ? { selectedElementIds:patch.selectedElementIds } : {}) });
          return { ...withHistory(s,project), ...context };
        });
      },
      getProject: () => structuredClone(get().project),
      getSelectedElement: () => {
        const s = get(); const page = s.project.pages.find(p => p.id === s.project.activePageId);
        return structuredClone(page?.layers.flatMap(l => l.elements).find(e => e.id === s.selectedElementIds[0]) || null);
      },
      addElement: (el: any) => { const s=get(); const copy=structuredClone(el);
        const p=structuredClone(s.project); const layer=p.pages.find(page=>page.id===p.activePageId)?.layers[0];
        // Validate plugin elements with the normal document schema before insertion.
        if (layer) layer.elements.push(copy); validateProject(p); get().addElement(copy);
      },
      deleteSelected: () => get().deleteSelected(),
      performAction: (action: string) => {
        if (action === 'undo' || action === 'redo') throw new Error('Undo/Redo cannot run inside a plugin transaction.');
        const name=commands[action]; if (name) (get()[name] as () => void)();
      },
      updateElement: (key: string, value: unknown) => get().updateElementProp(key,value),
      updateStyle: (key: any, value: unknown) => get().updateElementStyle(key,value),
      log: (message: string) => console.log(`[Plugin: ${plugin.name}] ${message}`),
    };
    try { await executePlugin(plugin,api); validateProject(get().project); get().commitTransaction(); }
    catch (error) { get().cancelTransaction(); throw error; }
    finally { set({ isPluginRunning: false }); }
  },
});
