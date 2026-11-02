import { Project } from '../types';
import { buildExportTree, ExportLayout } from './tree';
import { optimizeExport, OptimizationReport } from './optimizer';
import { printCss, printHtmlDocument, printNode } from './printers';
import { generateTreeRuntime } from './runtime';
export interface GeneratedCode {html:string;htmlBody:string;css:string;js:string;optimization:OptimizationReport;}
/** The HTML target only prints the common tree; layout/semantics/effects live in tree.ts. */
export class PowerWebCodeGenerator {
  constructor(private project:Project,private options:{layout?:ExportLayout}={}){}
  generate():GeneratedCode{
    const output=optimizeExport(buildExportTree(this.project,this.options)),css=printCss(output),js=generateTreeRuntime(output);
    const htmlBody=output.tree.pages.map(page=>printNode(page.node,'html',2)).join('\n');
    return {html:printHtmlDocument(output,htmlBody,{css,js,inline:true}),htmlBody,css,js,optimization:output.report};
  }
}
