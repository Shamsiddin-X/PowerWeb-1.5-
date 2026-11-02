import { isShaderConfig } from '../../types/shaders';
import { StateCreator } from 'zustand';
import { EditorState, CanvasElement, ElementStyle, ElementType } from '../../types';
import { withHistory, updateActiveElements, updateElementById, activeEditableLayer, resizeWithChildren } from '../helpers';
export interface ElementSlice {
  addElement: (element: CanvasElement) => void;
  deleteSelected: () => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, x: number, y: number, width: number, height: number) => void;
  updateElementPosition: (id: string, x: number, y: number) => void;
  updateSpecificElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementProp: (key: string, value: unknown) => void;
  updateElementStyle: (key: keyof ElementStyle, value: unknown) => void;
  updateElementStyleBulk: (style: Partial<ElementStyle>) => void;
  setPositionMode: (mode: 'absolute' | 'fixed') => void;
  setInsertMode: (type: ElementType | null) => void;
  setIsDragging: (val: boolean) => void;
  setIsResizing: (val: boolean) => void;
}
function validProp(key: string, value: unknown): boolean {
  if (key === 'shader') return value === null || isShaderConfig(value);
  if (['x', 'y', 'width', 'height'].includes(key)) return typeof value === 'number' && Number.isFinite(value) && (!['width', 'height'].includes(key) || value > 0);
  if (key === 'content') return typeof value === 'string';
  if (key === 'positionMode') return value === 'absolute' || value === 'fixed';
  if (key === 'tagName') return value===undefined||typeof value === 'string' && /^[a-z][a-z0-9-]*$/i.test(value);
  if (key === 'videoProps') return !!value && ['autoplay','loop','muted'].every(k => typeof value[k] === 'boolean');
  if (key === 'attributes') return !!value && typeof value === 'object' && Object.values(value).every(v => typeof v === 'string');
  if (key === 'animations') return Array.isArray(value) && value.every(a => a && typeof a.name === 'string'
    && ['onLoad','onScroll','onHover','onClick'].includes(a.trigger) && [a.duration,a.delay].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    && (a.iterationCount === undefined || a.iterationCount === 'infinite' || (Number.isFinite(a.iterationCount) && a.iterationCount >= 1)));
  if (key === 'logic') return Array.isArray(value) && value.every(b => b && Array.isArray(b.actions) && (!b.event || ['click','hover','submit','scroll','load'].includes(b.event.type)));
  return false;
}
function validStyle(key: string, value: unknown) {
  if (['strokeWidth','opacity','borderRadius','fontSize','shadowBlur','backdropBlur'].includes(key))
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && (key !== 'opacity' || value <= 1) && (key !== 'fontSize' || value > 0);
  if (key === 'objectFit') return ['fill','contain','cover'].includes(String(value));
  if (key === 'textAlign') return ['left','center','right'].includes(String(value));
  return ['fill','stroke','fontFamily','fontWeight','fontStyle','shadowColor','color'].includes(key) && typeof value === 'string';
}
function patchElement(el: CanvasElement, patch: Partial<CanvasElement>): CanvasElement {
  const { x = el.x, y = el.y, width = el.width, height = el.height } = patch;
  return { ...resizeWithChildren(el, x, y, width, height), ...patch, ...(el.elements ? {
    elements: resizeWithChildren(el, x, y, width, height).elements,
  } : {}) };
}
export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set) => ({
  addElement: element => set(s => {
    const layer = activeEditableLayer(s);
    if (!layer || ![element.x, element.y, element.width, element.height].every(Number.isFinite) || element.width <= 0 || element.height <= 0) return {};
    const project = { ...s.project, pages: s.project.pages.map(p => p.id !== s.project.activePageId ? p : {
      ...p, layers: p.layers.map(l => l.id !== layer.id ? l : { ...l, elements: [...l.elements, structuredClone(element)] }) }) };
    return { ...withHistory(s, project), selectedElementIds: [element.id], insertMode: null };
  }),
  deleteSelected: () => set(s => {
    const ids = new Set(s.selectedElementIds);
    const project = { ...s.project, pages: s.project.pages.map(p => p.id !== s.project.activePageId ? p : {
      ...p, layers: p.layers.map(l => l.locked || !l.visible ? l : { ...l, elements: l.elements.filter(e => !ids.has(e.id)) }) }) };
    return { ...withHistory(s, project), selectedElementIds: [] };
  }),
  moveElements: (ids, dx, dy) => set(s => {
    if (![dx, dy].every(Number.isFinite) || (!dx && !dy)) return {};
    return withHistory(s, updateActiveElements({ ...s, selectedElementIds: ids }, e => ({ ...e, x: e.x + dx, y: e.y + dy })));
  }),
  resizeElement: (id, x, y, width, height) => set(s => {
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return {};
    return withHistory(s, updateElementById(s, id, e => resizeWithChildren(e, x, y, width, height)));
  }),
  updateElementPosition: (id, x, y) => set(s => ![x, y].every(Number.isFinite) ? {} :
    withHistory(s, updateElementById(s, id, e => ({ ...e, x, y })))),
  updateSpecificElement: (id, updates) => set(s => {
    const patch = Object.fromEntries(Object.entries(updates).filter(([k, v]) => validProp(k, v))) as Partial<CanvasElement>;
    return withHistory(s, updateElementById(s, id, e => patchElement(e, patch)), `inline:${id}`);
  }),
  updateElementProp: (key, value) => set(s => !validProp(key, value) ? {} : withHistory(s,
    updateActiveElements(s, e => patchElement(e, { [key]: value })), `prop:${s.selectedElementIds.join(',')}:${key}`)),
  updateElementStyle: (key, value) => set(s => !validStyle(key, value) ? {} : withHistory(s,
    updateActiveElements(s, e => ({ ...e, style: { ...e.style, [key]: value } })), `style:${s.selectedElementIds.join(',')}:${key}`)),
  updateElementStyleBulk: style => set(s => {
    const patch = Object.fromEntries(Object.entries(style).filter(([k, v]) => validStyle(k, v)));
    return withHistory(s, updateActiveElements(s, e => ({ ...e, style: { ...e.style, ...patch } })));
  }),
  setPositionMode: positionMode => set(s => withHistory(s, updateActiveElements(s, e => ({ ...e, positionMode })))),
  setInsertMode: insertMode => set({ insertMode, selectedElementIds: [] }),
  setIsDragging: isDragging => set({ isDragging }),
  setIsResizing: isResizing => set({ isResizing }),
});
