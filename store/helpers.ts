import { EditorState, Project, CanvasElement, ElementStyle, HistoryContext } from '../types';
import { generateId } from '../utils/ids';
export { generateId } from '../utils/ids';
export const MAX_HISTORY = 200;
export const clone = <T,>(value: T): T => structuredClone(value);
export const equal = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
export const contextOf = (s: Pick<EditorState, 'activeLayerId' | 'selectedElementIds'>): HistoryContext =>
  ({ activeLayerId: s.activeLayerId, selectedElementIds: [...s.selectedElementIds] });

export function normalizeContext(project: Project, context: HistoryContext): HistoryContext {
  const page = project.pages.find(p => p.id === project.activePageId) || project.pages[0];
  if (!page) return { activeLayerId: '', selectedElementIds: [] };
  const layer = page.layers.find(l => l.id === context.activeLayerId) || page.layers[0];
  const selectable = new Set(page.layers.filter(l => l.visible && !l.locked).flatMap(l => l.elements.map(e => e.id)));
  return { activeLayerId: layer?.id || '', selectedElementIds: context.selectedElementIds.filter(id => selectable.has(id)) };
}

export function withHistory(state: EditorState, newProject: Project, mergeKey?: string): Partial<EditorState> {
  if (equal(state.project, newProject)) return {};
  if (state.historyTransaction) return { project: newProject };
  const history = state.history.slice(0, state.historyIndex + 1);
  const contexts = state.historyContexts.slice(0, state.historyIndex + 1);
  // A page/layer selection is navigation, not a document edit. Keep it with the next command's baseline.
  history[state.historyIndex] = state.project;
  contexts[state.historyIndex] = contextOf(state);
  const now = Date.now();
  const merge = !!mergeKey && state.historyMergeKey === mergeKey && now - state.historyMergeTime < 700
    && state.historyIndex === state.history.length - 1 && history.length > 1;
  if (merge) { history.pop(); contexts.pop(); }
  history.push(newProject);
  contexts.push(normalizeContext(newProject, contextOf(state)));
  if (history.length > MAX_HISTORY) { history.shift(); contexts.shift(); }
  return { project: newProject, history, historyContexts: contexts, historyIndex: history.length - 1,
    historyMergeKey: mergeKey || null, historyMergeTime: now };
}

export function updateActiveElements(state: EditorState, updater: (el: CanvasElement) => CanvasElement): Project {
  return { ...state.project, pages: state.project.pages.map(page => page.id !== state.project.activePageId ? page : {
    ...page, layers: page.layers.map(layer => layer.locked || !layer.visible ? layer : { ...layer,
      elements: layer.elements.map(el => state.selectedElementIds.includes(el.id) ? updater(el) : el) }) }) };
}
export function updateSelectedStyles(state: EditorState, patch: Partial<ElementStyle>): Project {
  return updateActiveElements(state, el => ({ ...el, style: { ...el.style, ...patch } }));
}
export function updateElementById(state: EditorState, id: string, updater: (el: CanvasElement) => CanvasElement): Project {
  return updateActiveElements({ ...state, selectedElementIds: [id] }, updater);
}
export function findElementById(state: EditorState, id: string): CanvasElement | null {
  return state.project.pages.find(p => p.id === state.project.activePageId)?.layers.flatMap(l => l.elements).find(e => e.id === id) || null;
}
export function updateActivePage(state: EditorState, updater: (p: import('../types').Page) => import('../types').Page): Project {
  return { ...state.project, pages: state.project.pages.map(p => p.id === state.project.activePageId ? updater(p) : p) };
}
export function activeEditableLayer(state: EditorState) {
  return state.project.pages.find(p => p.id === state.project.activePageId)?.layers.find(l => l.id === state.activeLayerId && l.visible && !l.locked);
}
export function selectedElements(state: EditorState, editable = true): CanvasElement[] {
  const ids = new Set(state.selectedElementIds);
  return state.project.pages.find(p => p.id === state.project.activePageId)?.layers
    .filter(l => !editable || (!l.locked && l.visible)).flatMap(l => l.elements.filter(e => ids.has(e.id))) || [];
}
/** Deep-clone a forest in two passes so links between siblings and nested groups follow their copies. */
export function cloneElements(elements: CanvasElement[], offset = 0, ids = new Map<string, string>()): CanvasElement[] {
  const result = clone(elements);
  const allocate = (list: CanvasElement[]) => list.forEach(e => { ids.set(e.id, generateId()); allocate(e.elements || []); });
  allocate(result);
  const remap = (list: CanvasElement[]) => list.forEach(e => {
    e.id = ids.get(e.id)!;
    e.animations?.forEach(a => { a.id = generateId(); });
    e.logic?.forEach(block => {
      if (block.condition?.elementId) block.condition.elementId = ids.get(block.condition.elementId) || block.condition.elementId;
      if (block.condition?.formId) block.condition.formId = ids.get(block.condition.formId) || block.condition.formId;
      [...block.actions, ...(block.elseActions || [])].forEach(a => { if (a.targetId) a.targetId = ids.get(a.targetId) || a.targetId; });
    });
    remap(e.elements || []);
  });
  remap(result);
  return result.map(e => ({ ...e, x: e.x + offset, y: e.y + offset }));
}
export function resizeWithChildren(el: CanvasElement, x: number, y: number, width: number, height: number): CanvasElement {
  const sx = width / el.width, sy = height / el.height;
  return { ...el, x, y, width, height, ...(el.elements ? { elements: el.elements.map(child =>
    resizeWithChildren(child, child.x * sx, child.y * sy, child.width * sx, child.height * sy)) } : {}) };
}
