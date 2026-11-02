import { ExportNode } from './tree';
import { OptimizedExport } from './optimizer';
import { escapeHtml, scriptData } from './safety';
const voidTags=new Set(['img','input','br','hr','meta','link','source']);
const booleanAttributes=new Set(['controls','autoplay','loop','muted','playsinline','required']);
const reactNames:Record<string,string>={class:'className',for:'htmlFor',tabindex:'tabIndex',autoplay:'autoPlay',playsinline:'playsInline',crossorigin:'crossOrigin','stroke-width':'strokeWidth','vector-effect':'vectorEffect','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin'};
export const kebab=(value:string)=>value.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());
const cssValue=(value:unknown)=>String(value).replace(/</g,'\\3c ').replace(/>/g,'\\3e ');
export function printNode(node:ExportNode,format:'html'|'react',depth=0,assetImports?:Map<string,string>):string{
  const indent='  '.repeat(depth),jsx=format==='react';
  const attributes=Object.entries(node.attributes).filter(([,value])=>value!==undefined&&value!==false).map(([name,value])=>{
    if(!/^(?:id|class|href|src|alt|role|title|name|type|value|placeholder|target|rel|width|height|loading|decoding|controls|preload|autoplay|loop|muted|playsinline|crossorigin|tabindex|required|viewBox|preserveAspectRatio|clipPathUnits|d|points|transform|fill|stroke|stroke-width|vector-effect|aria-[a-z-]+|data-[a-z-]+)$/.test(name))return '';
    if(jsx){const key=reactNames[name]||name;if(name==='src'&&typeof value==='string'&&assetImports?.has(value))return `${key}={${assetImports.get(value)}}`;return typeof value==='boolean'?`${key}={true}`:`${key}={${scriptData(value)}}`;}
    return value===true&&booleanAttributes.has(name)?name:`${name}="${escapeHtml(value)}"`;
  }).filter(Boolean);
  const start=indent+'<'+node.tag+(attributes.length?' '+attributes.join(' '):'');
  if(voidTags.has(node.tag))return start+(jsx?' />':'>');
  if(!node.children.length)return start+'></'+node.tag+'>';
  if(node.children.every(child=>typeof child==='string'))return start+'>'+node.children.map(child=>jsx?`{${scriptData(child)}}`:escapeHtml(child)).join('')+'</'+node.tag+'>';
  return start+'>\n'+node.children.map(child=>typeof child==='string'?'  '.repeat(depth+1)+(jsx?`{${scriptData(child)}}`:escapeHtml(child)):printNode(child,format,depth+1,assetImports)).join('\n')+'\n'+indent+'</'+node.tag+'>';
}
export function printCss(output:OptimizedExport):string{
  const {tree,rules,keyframes}=output;
  let css=`/* ${tree.name.replace(/\*\//g,'')} — generated stylesheet */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-height: 100vh; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
:where(h1, h2, h3, h4, h5, h6, p, figure, ul, ol) { margin: 0; padding: 0; }
a { color: inherit; text-decoration: none; }
button, input, textarea { font: inherit; }
button { border: 0; padding: 0; background: transparent; cursor: pointer; }
img, video { display: block; max-width: 100%; }
:focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
`;
  if(tree.singleDocument&&tree.pages.length>1)css+=`.pwb-page { display: none; }
.pwb-page:first-child, .pwb-page:target { display: block; }
main:has(> .pwb-page:target) > .pwb-page:first-child:not(:target) { display: none; }
`;
  for(const font of tree.fonts)css+=`@font-face {\n  font-family: ${JSON.stringify(font.family)};\n  src: url(${JSON.stringify(font.source)});\n  font-weight: ${/^[\d\s]+$|^normal$|^bold$/.test(font.weight||'normal')?font.weight||'normal':'normal'};\n  font-style: ${font.style==='italic'?'italic':'normal'};\n  font-display: swap;\n}\n`;
  const printRule=(selector:string,styles:Record<string,unknown>,indent='')=>`${indent}${selector} {\n${Object.entries(styles).filter(([,value])=>value!==undefined).map(([key,value])=>`${indent}  ${kebab(key)}: ${cssValue(value)};`).join('\n')}\n${indent}}\n`;
  for(const rule of rules.filter(rule=>!rule.media))css+=printRule(rule.selector,rule.styles);
  for(const breakpoint of [...new Set(rules.flatMap(rule=>rule.media?[rule.media]:[]))].sort((a,b)=>b-a)){
    css+=`\n@media (max-width: ${breakpoint}px) {\n`;
    for(const rule of rules.filter(rule=>rule.media===breakpoint))css+=printRule(rule.selector,rule.styles,'  ');
    css+='}\n';
  }
  if(keyframes)css+='\n/* Animations used by this document */\n'+keyframes;
  if(tree.extraCss.length)css+='\n'+tree.extraCss.join('\n')+'\n';
  if(keyframes||tree.extraCss.length)css+='\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }\n}\n';
  return css;
}
export function printHtmlDocument(output:OptimizedExport,body:string,{css,js,inline=false,title=output.tree.name,description=output.tree.description}:{css:string;js:string;inline?:boolean;title?:string;description?:string}):string{
  return `<!DOCTYPE html>\n<html lang="${escapeHtml(output.tree.language)}"${/^(ar|he|fa|ur)(-|$)/i.test(output.tree.language)?' dir="rtl"':''}>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(title)}</title>\n${description?'  <meta name="description" content="'+escapeHtml(description)+'">\n':''}${inline?'  <style>\n'+css.replace(/</g,'\\3c ')+'  </style>':'  <link rel="stylesheet" href="styles.css">'}\n${!inline&&js?'  <script src="script.js" defer></script>\n':''}</head>\n<body>\n  <main id="app">\n${body}\n  </main>\n${inline&&js?'  <script>\n'+js.replace(/<\/script/gi,'<\\/script')+'  </script>\n':''}</body>\n</html>\n`;
}
