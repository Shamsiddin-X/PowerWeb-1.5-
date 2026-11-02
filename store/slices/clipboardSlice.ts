import { StateCreator } from 'zustand';
import { EditorState } from '../../types';
import { withHistory, clone, cloneElements, selectedElements, activeEditableLayer } from '../helpers';
export interface ClipboardSlice {
  copySelected: () => void;
  cutSelected: () => void;
  pasteElements: () => void;
  duplicateSelected: () => void;
}
export const createClipboardSlice: StateCreator<EditorState, [], [], ClipboardSlice> = (set) => ({
  copySelected: () => set(s => {
    const elements = selectedElements(s, false);
    return elements.length ? { clipboard: clone(elements), clipboardMode: 'copy', pasteCount: 0 } : {};
  }),
  cutSelected: () => set(s => {
    const elements = selectedElements(s);
    if (!elements.length) return {};
    const ids = new Set(elements.map(e => e.id));
    const project = { ...s.project, pages: s.project.pages.map(p => p.id !== s.project.activePageId ? p : {
      ...p, layers: p.layers.map(l => ({ ...l, elements: l.elements.filter(e => !ids.has(e.id)) })) }) };
    return { ...withHistory(s, project), clipboard: clone(elements), clipboardMode: 'cut', pasteCount: 0, selectedElementIds: [] };
  }),
  pasteElements: () => set(s => {
    const layer = activeEditableLayer(s);
    if (!layer || !s.clipboard.length) return {};
    const offset = 20 * (s.pasteCount + (s.clipboardMode === 'cut' ? 0 : 1));
    const documentIds = new Set<string>();
    const collect = (list: import('../../types').CanvasElement[], ids: Set<string>) => list.forEach(e => { ids.add(e.id); collect(e.elements || [], ids); });
    s.project.pages.forEach(p => p.layers.forEach(l => collect(l.elements, documentIds)));
    const clipboardIds = new Set<string>(); collect(s.clipboard, clipboardIds);
    const canMove = s.clipboardMode === 'cut' && s.pasteCount === 0 && [...clipboardIds].every(id => !documentIds.has(id));
    const elements = canMove ? clone(s.clipboard) : cloneElements(s.clipboard, offset);
    const project = { ...s.project, pages: s.project.pages.map(p => p.id !== s.project.activePageId ? p : {
      ...p, layers: p.layers.map(l => l.id !== layer.id ? l : { ...l, elements: [...l.elements, ...elements] }) }) };
    return { ...withHistory(s, project), selectedElementIds: elements.map(e => e.id), pasteCount: s.pasteCount + 1 };
  }),
  duplicateSelected: () => set(s => {
    const source = selectedElements(s);
    if (!source.length) return {};
    const copies = cloneElements(source, 20);
    const byId = new Map(source.map((e, i) => [e.id, copies[i]]));
    const project = { ...s.project, pages: s.project.pages.map(p => p.id !== s.project.activePageId ? p : {
      ...p, layers: p.layers.map(l => {
        const additions = l.elements.filter(e => byId.has(e.id)).map(e => byId.get(e.id)!);
        return additions.length ? { ...l, elements: [...l.elements, ...additions] } : l;
      }) }) };
    return { ...withHistory(s, project), selectedElementIds: copies.map(e => e.id) };
  }),
});
