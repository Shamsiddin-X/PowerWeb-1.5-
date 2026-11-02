import logicSource from './browserRuntime.js?raw';
import animationSource from './clickAnimations.js?raw';
import shaderSource from './shaders.js?raw';
import rendererSource from '../utils/shaderRenderer.js?raw';
import { OptimizedExport } from './optimizer';
import { ExportTree, buildExportTree } from './tree';
import { optimizeExport } from './optimizer';
import { Project } from '../types';
export { startLogic } from './browserRuntime.js';
const plain=(source:string)=>source.replace(/^export\s+/gm,'').trim();
const json=(value:unknown)=>JSON.stringify(value,null,2).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function runtimeParts(output:OptimizedExport,root='root'):{definitions:string;mount:string}{
  const {tree}=output,definitions:string[]=[],calls:string[]=[];
  if(tree.canvasLayout){
    definitions.push(`function fitDesignPages(root) {
  const surfaces = [...root.querySelectorAll('[data-pwb-design-width]')];
  const fit = () => surfaces.forEach(surface => {
    const width = Number(surface.dataset.pwbDesignWidth);
    surface.style.transform = 'scale(' + (surface.parentElement.clientWidth / width) + ')';
  });
  const observer = new ResizeObserver(fit);
  surfaces.forEach(surface => observer.observe(surface.parentElement));
  fit();
  return () => observer.disconnect();
}`);
    calls.push('dispose.push(fitDesignPages('+root+'));');
  }
  if(tree.logic.length){definitions.push(plain(logicSource));calls.push(`dispose.push(startLogic(${json(tree.logic)}, ${root}, ${json(tree.pageUrls)}));`);}
  if(tree.usesClickAnimations){definitions.push(plain(animationSource));calls.push(`dispose.push(startClickAnimations(${root}));`);}
  if(tree.usesShaders){definitions.push(plain(rendererSource),plain(shaderSource));calls.push(`dispose.push(startShaders(${json(output.shaders)}, ${root}, startShader));`);}
  return {definitions:definitions.join('\n\n'),mount:calls.length?'const dispose = [];\n'+calls.join('\n')+'\nreturn () => dispose.reverse().forEach(stop => stop());':''};
}
export function generateTreeRuntime(output:OptimizedExport):string{
  const {definitions,mount}=runtimeParts(output);if(!mount)return '';
  return definitions+'\n\nfunction mountPage(root = document) {\n'+mount.split('\n').map(line=>'  '+line).join('\n')+'\n}\n\nif (document.readyState === "loading") {\n  document.addEventListener("DOMContentLoaded", () => mountPage(), { once: true });\n} else {\n  mountPage();\n}\n';
}
/** Legacy facade retained for callers; new generators share the optimized tree. */
export function generateRuntime(project:Project):string{return generateTreeRuntime(optimizeExport(buildExportTree(project)));}

/** Backwards-compatible mounting entry for existing integrations, not used by static exports. */
export function startRuntime(entries:any[],root:ParentNode=document,renderShader?:any){
  const dispose:(()=>void)[]=[];
  dispose.push(startLogicLegacy(entries,root,{}));
  dispose.push(startClickAnimationsLegacy(root));
  if(renderShader){
    const configs:Record<string,unknown>={};
    root.querySelectorAll<HTMLCanvasElement>('canvas[data-pwb-shader]').forEach(canvas=>{try{configs[canvas.dataset.pwbShader!]=JSON.parse(canvas.dataset.pwbShader!);}catch{}});
    dispose.push(startShadersLegacy(configs,root,renderShader));
  }
  return ()=>dispose.forEach(stop=>stop());
}
import {startLogic as startLogicLegacy} from './browserRuntime.js';
import {startClickAnimations as startClickAnimationsLegacy} from './clickAnimations.js';
import {startShaders as startShadersLegacy} from './shaders.js';
