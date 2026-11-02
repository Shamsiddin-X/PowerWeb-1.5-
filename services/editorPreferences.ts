import { EditorState, ThemeMode } from '../types';
import { isLanguage } from '../utils/languages';
export const PREFERENCES_KEY='powerweb.settings';
export const VIEW_DEFAULTS={showGrid:false,showLayers:false,showRightPanel:true,showPages:true,showStatusBar:true,focusMode:false,gridSize:20,snapEnabled:true,showGuides:true,uiScale:1,scale:1,ribbonExpanded:true};
export const PREFERENCE_FIELDS=[...Object.keys(VIEW_DEFAULTS),'themeMode','language'] as (keyof EditorPreferences)[];
export type EditorPreferences=Pick<EditorState,keyof typeof VIEW_DEFAULTS|'themeMode'|'language'>;
export function resolveTheme(mode:ThemeMode):'light'|'dark'{
  return mode==='system'?(typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;
}
export function readPreferences():EditorPreferences {
  const defaults:EditorPreferences={...VIEW_DEFAULTS,themeMode:'system',language:'en'};
  try{
    const stored=JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}');
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return defaults;
    const result={...defaults};
    for(const key of ['showGrid','showLayers','showRightPanel','showPages','showStatusBar','focusMode','snapEnabled','showGuides','ribbonExpanded'] as const)if(typeof stored[key]==='boolean')result[key]=stored[key];
    for(const [key,min,max] of [['scale',.1,5],['uiScale',.5,2],['gridSize',5,100]] as const)if(typeof stored[key]==='number'&&Number.isFinite(stored[key]))result[key]=Math.min(max,Math.max(min,stored[key]));
    if(typeof stored.ribbonExpanded!=='boolean')result.ribbonExpanded=localStorage.getItem('powerweb.ribbon.expanded')!=='false';
    if(isLanguage(stored.language))result.language=stored.language;
    const themeMode=stored.themeMode??stored.theme;
    if(['light','dark','system'].includes(themeMode))result.themeMode=themeMode;
    return result;
  }catch{return defaults;}
}
export function preferencesOf(state:EditorState):EditorPreferences {
  return Object.fromEntries(PREFERENCE_FIELDS.map(key=>[key,state[key]])) as EditorPreferences;
}
export function savePreferences(state:EditorState):void {
  try{localStorage.setItem(PREFERENCES_KEY,JSON.stringify({version:2,...preferencesOf(state)}));}
  catch(error){console.warn('Preferences could not be saved',error);}
}
