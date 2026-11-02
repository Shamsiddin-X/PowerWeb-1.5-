import { isShaderConfig, shaderCanApply } from '../types/shaders';
import { generateId } from './ids';
import { Project, CanvasElement, DEFAULT_STYLE, ANIMATION_PRESETS } from '../types';
export const PROJECT_VERSION = '1.5.1';
export interface PWBFile { signature: 'POWERWEB_PROJECT'; version: string; savedAt: number; project: Project; }
const types = new Set('rect roundedRect circle text image button video line triangle rightTriangle diamond parallelogram trapezoid pentagon hexagon octagon star star4 star6 arrowRight arrowLeft arrowUp arrowDown cross heart message group'.split(' '));
const transitions = new Set('none fade push_left push_right push_up push_down zoom_in zoom_out'.split(' '));
const actions = new Set('showModal hideElement navigateToPage playAnimation setVariable toggleClass navigateToUrl'.split(' '));
const fail = (message: string): never => { throw new Error(`Invalid PowerWeb project: ${message}`); };
function object(value: any, label: string) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label); }
function text(value: any, label: string) { if (typeof value !== 'string') fail(label); }
function finite(value: any, label: string, min = -Infinity) { if (typeof value !== 'number' || !Number.isFinite(value) || value < min) fail(label); }
/** Validate before replacing a live document. Defaults migrate optional fields from 0.4/0.9. */
export function validateProject(input: unknown): Project {
  object(input, 'project');
  const p: any = structuredClone(input);
  const ids = new Set<string>();
  function id(value: any) { text(value, 'id'); if (!value || ids.has(value)) fail('empty or duplicate id: ' + value); ids.add(value); }
  id(p.id); text(p.name, 'name');
  if (!Array.isArray(p.pages) || !p.pages.length || p.pages.length > 1000) fail('pages');
  let count = 0;
  function element(e: any, depth: number): CanvasElement {
    object(e, 'element');
    if (e.shader != null && !isShaderConfig(e.shader)) fail('shader'); if (++count > 100000 || depth > 32) fail('too many elements or nested groups');
    id(e.id); if (!types.has(e.type)) fail('element type');
    finite(e.x, 'x'); finite(e.y, 'y'); finite(e.width, 'width', 0.01); finite(e.height, 'height', 0.01);
    object(e.style, 'style'); e.style = { ...DEFAULT_STYLE, ...e.style };
    for (const key of ['fill', 'stroke', 'fontFamily', 'fontWeight', 'fontStyle', 'color', 'shadowColor']) text(e.style[key], key);
    for (const key of ['strokeWidth', 'opacity', 'borderRadius', 'fontSize', 'shadowBlur', 'backdropBlur']) finite(e.style[key], key, 0);
    if (e.style.objectFit !== undefined && !['fill','contain','cover'].includes(e.style.objectFit)) fail('media fit');
    if (e.style.opacity > 1) fail('opacity');
    if (e.content !== undefined) text(e.content, 'content');
    if(e.attributes!==undefined){object(e.attributes,'attributes');for(const value of Object.values(e.attributes))text(value,'attribute');}
    if (e.positionMode !== undefined && !['absolute', 'fixed'].includes(e.positionMode)) fail('position mode');
    if (e.tagName !== undefined && !/^[a-z][a-z0-9-]*$/i.test(e.tagName)) fail('tag name');
    if (e.videoProps) { object(e.videoProps, 'video'); for (const k of ['autoplay','loop','muted']) if (typeof e.videoProps[k] !== 'boolean') fail('video flags'); }
    if (e.elements !== undefined) {
      if (e.type !== 'group' || !Array.isArray(e.elements)) fail('group');
      e.elements = e.elements.map((child: any) => element(child, depth + 1));
    }
    if (e.animations !== undefined) {
      if (!Array.isArray(e.animations)) fail('animations');
      e.animations.forEach((a: any) => {
        object(a, 'animation'); if (!a.id) a.id = generateId();
        if (!ANIMATION_PRESETS.some(p => p.key === a.name) && !['scaleUp', 'slideUp'].includes(a.name)) fail('animation name');
        if (!['onLoad','onScroll','onHover','onClick'].includes(a.trigger)) fail('animation trigger');
        finite(a.duration, 'duration', 0); finite(a.delay, 'delay', 0);
        if (a.iterationCount !== undefined && a.iterationCount !== 'infinite') finite(a.iterationCount, 'iterations', 1);
      });
    }
    if (e.logic !== undefined) {
      if (!Array.isArray(e.logic)) fail('logic');
      e.logic.forEach((b: any) => {
        object(b, 'logic block');
        if (b.event && !['click','hover','submit','scroll','load'].includes(b.event.type)) fail('event');
        if (b.condition) {
          object(b.condition, 'condition');
          if (!['screenWidth','formValid','variableEquals','elementVisible','scrollPosition'].includes(b.condition.type)) fail('condition type');
        }
        for (const list of [b.actions, b.elseActions || []]) {
          if (!Array.isArray(list)) fail('actions');
          list.forEach((a: any) => { object(a, 'action'); if (!actions.has(a.type)) fail('action type');
            for (const k of ['targetId','url','className','variableName','animationClass']) if (a[k] !== undefined) text(a[k], k);
          });
        }
      });
    }
    return e;
  }
  if(p.language!==undefined){text(p.language,'language');if(!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(p.language))fail('language');}
  if(p.description!==undefined)text(p.description,'description');
  if(p.fonts!==undefined){
    if(!Array.isArray(p.fonts)||p.fonts.length>500)fail('fonts');
    const fontIds=new Set<string>();
    for(const font of p.fonts){object(font,'font');text(font.id,'font id');text(font.family,'font family');text(font.source,'font source');if(!font.id||fontIds.has(font.id)||!font.family||!font.source)fail('font');fontIds.add(font.id);if(font.weight!==undefined&&(typeof font.weight!=='string'||!/^normal$|^bold$|^[0-9 ]+$/.test(font.weight)))fail('font weight');if(font.style!==undefined&&!['normal','italic'].includes(font.style))fail('font style');}
  }
  p.pages.forEach((page: any) => {
    object(page, 'page'); id(page.id); text(page.name, 'page name');
    finite(page.width, 'page width', 1); finite(page.height, 'page height', 1); text(page.backgroundColor, 'page background');
    if(page.responsive!==undefined&&typeof page.responsive!=='boolean')fail('responsive');
    if(page.mobileBreakpoint!==undefined){finite(page.mobileBreakpoint,'mobile breakpoint',320);if(page.mobileBreakpoint>1600)fail('mobile breakpoint');}
    if(page.description!==undefined)text(page.description,'page description');
    if (!Array.isArray(page.layers) || !page.layers.length) fail('layers');
    page.transition = ({ slide: 'push_left', zoom: 'zoom_in' } as any)[page.transition] || page.transition || 'none';
    if (!transitions.has(page.transition)) fail('transition');
    page.transitionDuration ??= 0.5; finite(page.transitionDuration, 'transition duration', 0);
    page.layers.forEach((layer: any) => {
      object(layer, 'layer');
      if (layer.shader != null && (!isShaderConfig(layer.shader)||!shaderCanApply(layer.shader))) fail('layer shader');
      id(layer.id); text(layer.name, 'layer name');
      if (typeof layer.visible !== 'boolean' || typeof layer.locked !== 'boolean' || !Array.isArray(layer.elements)) fail('layer fields');
      layer.elements = layer.elements.map((e: any) => element(e, 0));
    });
  });
  if (!p.pages.some((page: any) => page.id === p.activePageId)) p.activePageId = p.pages[0].id;
  return p as Project;
}
export function parseProjectSnapshot(content: string): Project | null {
  try {
    const data = JSON.parse(content);
    if (data?.signature !== 'POWERWEB_PROJECT' || (data.version && Number(String(data.version).split('.')[0]) > 1)) return null;
    return validateProject(data.project);
  } catch { return null; }
}
export function serializeProjectSnapshot(project: Project): string {
  return JSON.stringify({ signature: 'POWERWEB_PROJECT', version: PROJECT_VERSION, savedAt: Date.now(), project: validateProject(project) }, null, 2);
}

/** Legacy JSON snapshots remain readable. File I/O uses the ZIP container service. */
export const parsePWB=parseProjectSnapshot;
export const serializePWB=serializeProjectSnapshot;
