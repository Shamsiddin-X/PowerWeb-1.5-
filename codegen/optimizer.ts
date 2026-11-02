import { ANIMATION_LIBRARY } from './animationLibrary';
import { ExportNode, ExportTree, Styles } from './tree';
import { ShaderConfig } from '../types/shaders';
export interface CssRule {selector:string;styles:Styles;media?:number;}
export interface OptimizationReport {removedDefaults:number;removedEmptyLayers:number;sharedStyles:number;includedKeyframes:number;}
export interface OptimizedExport {tree:ExportTree;rules:CssRule[];keyframes:string;shaders:Record<string,ShaderConfig>;report:OptimizationReport;}
/** Export-only cleanup. Never removes visible artwork or mutates the editor document. */
export function optimizeExport(tree:ExportTree):OptimizedExport {
  const rules:CssRule[]=[],shaders:Record<string,ShaderConfig>={},shaderKeys=new Map<string,string>(),styleKeys=new Map<string,string>();
  const report:OptimizationReport={removedDefaults:0,removedEmptyLayers:0,sharedStyles:0,includedKeyframes:0};
  const families=new Set<string>();
  let sequence=0;
  const clean=(styles:Styles):Styles=>Object.fromEntries(Object.entries(styles).filter(([key,value])=>{
    const remove=value===undefined||key==='opacity'&&value===1||key==='borderRadius'&&value==='0px'||['margin','padding'].includes(key)&&value===0||key==='border'&&value==='none'||key==='background'&&value==='transparent';
    if(remove)report.removedDefaults++;return !remove;
  }));
  const visit=(item:ExportNode):ExportNode=>{
    if(item.styles.fontFamily)String(item.styles.fontFamily).split(',').forEach(family=>families.add(family.trim().replace(/^['"]|['"]$/g,'')));
    const children=item.children.flatMap(child=>{
      if(typeof child==='string')return child?[child]:[];
      if(child.attributes['data-layer']!==undefined&&!child.children.length){report.removedEmptyLayers++;return [];}
      return [visit(child)];
    });
    const attributes={...item.attributes};
    if(typeof attributes['data-pwb-shader']==='string'){
      const raw=attributes['data-pwb-shader'];let key=shaderKeys.get(raw);
      if(!key){key='shader-'+(shaderKeys.size+1);shaderKeys.set(raw,key);shaders[key]=JSON.parse(raw);}
      attributes['data-pwb-shader']=key;
    }
    const styles=clean(item.styles),mobile=item.mobile||{};
    const fingerprint=JSON.stringify([Object.entries(styles).sort(),Object.entries(mobile).sort(),item.breakpoint]);
    let className=styleKeys.get(fingerprint);
    if(!className){className='node-'+(++sequence);styleKeys.set(fingerprint,className);if(Object.keys(styles).length)rules.push({selector:'.'+className,styles});if(item.mobile&&item.breakpoint)rules.push({selector:'.'+className,styles:mobile,media:item.breakpoint});}
    else report.sharedStyles++;
    attributes.class=[attributes.class,className].filter(Boolean).join(' ');
    return {...item,attributes,styles:{},mobile:undefined,children};
  };
  const pages=tree.pages.map(page=>({...page,node:visit(page.node)}));
  // Dynamic class animations are dependencies too, even when the gallery is unused.
  for(const entry of tree.logic)for(const block of entry.logic)for(const action of [...block.actions,...block.elseActions||[]])if(action.animationClass)for(const name of action.animationClass.split(/\s+/))if(name.startsWith('anim-'))tree.animationNames.add(name.slice(5));
  let keyframes='';
  for(const name of tree.animationNames){
    if(!/^[a-z][a-z0-9]*$/i.test(name))continue;
    const start=ANIMATION_LIBRARY.indexOf('@keyframes '+name+' ');if(start<0)continue;
    const opening=ANIMATION_LIBRARY.indexOf('{',start);let end=opening+1,depth=1;
    for(;end<ANIMATION_LIBRARY.length&&depth;end++){if(ANIMATION_LIBRARY[end]==='{')depth++;if(ANIMATION_LIBRARY[end]==='}')depth--;}
    keyframes+=ANIMATION_LIBRARY.slice(start,end)+'\n';report.includedKeyframes++;
    const classRule=ANIMATION_LIBRARY.match(new RegExp('\\.anim-'+name+'\\s*\\{[^}]*\\}'))?.[0];if(classRule)keyframes+=classRule+'\n';
  }
  return {tree:{...tree,pages,fonts:tree.fonts.filter(font=>families.has(font.family))},rules,keyframes,shaders,report};
}
