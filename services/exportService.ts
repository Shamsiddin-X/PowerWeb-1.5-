import { Project } from '../types';
import { validateProject } from '../utils/fileFormat';
import { ArchiveFiles, createZip, utf8 } from '../utils/zipArchive';
import { collectResources } from './projectContainer/assets';
import { buildExportTree } from '../codegen/tree';
import { optimizeExport, OptimizationReport } from '../codegen/optimizer';
import { printCss, printHtmlDocument, printNode } from '../codegen/printers';
import { generateTreeRuntime } from '../codegen/runtime';
import { printReactComponent } from '../codegen/reactTailwindGenerator';
export interface ExportPackage {bytes:Uint8Array;files:ArchiveFiles;report:OptimizationReport;}
/** A final, separate pass removes extracted files which generated content never references. */
export function removeUnusedAssets(files:ArchiveFiles):void{
  const source=[...files].filter(([name])=>/\.(html|css|js|jsx)$/.test(name)).map(([,bytes])=>new TextDecoder().decode(bytes)).join('\n');
  for(const name of [...files.keys()])if(name.startsWith('assets/')&&!name.endsWith('/')&&!source.includes(name)&&!source.includes(name.replace(/\//g,'\\/')))files.delete(name);
}
export async function createExportPackage(input:Project,target:'html'|'react'='html'):Promise<ExportPackage>{
  const source=validateProject(input),families=new Set<string>();
  const visit=(elements:import('../types').CanvasElement[])=>{for(const element of elements){if(['text','button'].includes(element.type))String(element.style.fontFamily||'').split(',').forEach(family=>families.add(family.trim().replace(/^['"]|['"]$/g,'')));visit(element.elements||[]);}};
  for(const page of source.pages){page.layers=page.layers.filter(layer=>layer.visible);page.layers.forEach(layer=>visit(layer.elements));}
  source.fonts=source.fonts?.filter(font=>families.has(font.family));
  // Invisible artwork and unused font files should not cause network requests.
  const collected=await collectResources(source,{shaders:false});
  const output=optimizeExport(buildExportTree(collected.project,{singleDocument:target==='react'})),files=collected.files;
  const css=printCss(output);files.set('styles.css',utf8(css));
  if(target==='html'){
    const js=generateTreeRuntime(output);if(js)files.set('script.js',utf8(js));
    for(const page of output.tree.pages){
      const original=collected.project.pages.find(item=>item.id===page.id)!;
      const html=printHtmlDocument(output,printNode(page.node,'html',2),{css,js,title:page.file==='index.html'?input.name:page.name+' · '+input.name,description:original.description||input.description||''});
      files.set(page.file,utf8(html));
    }
    files.set('README.md',utf8(`# ${input.name}\n\nOpen index.html or serve this folder with any static server.\nEach page is an ordinary HTML document; navigation works without JavaScript.\nEdit styles.css to change presentation.${js?' Optional interactions are in script.js.':' No JavaScript runtime is required.'}\n\nMedia and fonts are in assets/.\nThe mobile layout uses a CSS media query; groups are preserved and top-level content flows vertically on narrow screens.\n`));
  }else{
    const body=output.tree.pages.map(page=>printNode(page.node,'html',3)).join('\n');
    const html=printHtmlDocument(output,body,{css,js:''}).replace('  <main id="app">','  <div id="root">\n  <main id="app">').replace('\n  </main>\n','\n  </main>\n  </div>\n').replace('</body>','  <script type="module" src="/main.jsx"></script>\n</body>');
    files.set('index.html',utf8(html));files.set('App.jsx',utf8(printReactComponent(output)));
    files.set('main.jsx',utf8(`import React from 'react';\nimport { hydrateRoot } from 'react-dom/client';\nimport App from './App.jsx';\n\nhydrateRoot(document.getElementById('root'), <App />);\n`));
    files.set('package.json',utf8(JSON.stringify({name:'powerweb-site',private:true,version:'1.0.0',type:'module',scripts:{dev:'vite',build:'vite build',preview:'vite preview'},dependencies:{react:'^19.2.3','react-dom':'^19.2.3'},devDependencies:{vite:'^6.2.0'}},null,2)+'\n'));
    files.set('vite.config.js',utf8(`export default {\n  base: './',\n  assetsInclude: ['**/assets/**'],\n};\n`));
    files.set('README.md',utf8(`# ${input.name}\n\nnpm install\nnpm run dev\nnpm run build\n\nEdit App.jsx and styles.css. Built files are written to dist/.\nThe initial HTML also contains the page content; PowerWeb-specific code is only included for enabled effects/interactions.\nImages, video and fonts are in assets/. Tailwind is optional; no PowerWeb editor dependencies are needed.\n`));
  }
  removeUnusedAssets(files);
  for(const path of ['assets/','assets/images/','assets/video/','assets/fonts/'])files.set(path,new Uint8Array());
  return {bytes:createZip(files),files,report:output.report};
}
