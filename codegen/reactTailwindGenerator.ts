import { Project } from '../types';
import { buildExportTree } from './tree';
import { optimizeExport, OptimizedExport } from './optimizer';
import { printNode, printCss } from './printers';
import { runtimeParts } from './runtime';
export function printReactComponent(output:OptimizedExport):string{
  const {definitions,mount}=runtimeParts(output,'element'),interactive=!!mount;
  const assets=new Map<string,string>();
  const collect=(item:import('./tree').ExportNode)=>{const source=item.attributes.src;if(typeof source==='string'&&source.startsWith('assets/')&&!assets.has(source))assets.set(source,'asset'+(assets.size+1));for(const child of item.children)if(typeof child!=='string')collect(child);};
  output.tree.pages.forEach(page=>collect(page.node));
  const imports=[...assets].map(([path,name])=>`import ${name} from ${JSON.stringify('./'+path)};`).join('\n');
  const body=output.tree.pages.map(page=>printNode(page.node,'react',3,assets)).join('\n');
  return `import React${interactive?', { useEffect, useRef }':''} from 'react';\nimport './styles.css';\n${imports}${imports?'\n':''}\nexport default function App() {\n${interactive?'  const root = useRef(null);\n  useEffect(() => {\n'+definitions.split('\n').map(line=>'    '+line).join('\n')+'\n    const element = root.current;\n'+mount.split('\n').map(line=>'    '+line).join('\n')+'\n  }, []);\n':''}  return (\n    <main${interactive?' ref={root}':''} id="app">\n${body}\n    </main>\n  );\n}\n`;
}
/** Compatibility name; exported React uses readable shared CSS and needs no Tailwind runtime. */
export class SmartCodeGenerator {
  constructor(public project:Project){}
  generateReactTailwind():string{return printReactComponent(optimizeExport(buildExportTree(this.project)));}
  generate(){const output=optimizeExport(buildExportTree(this.project));return {component:printReactComponent(output),css:printCss(output),optimization:output.report};}
}
