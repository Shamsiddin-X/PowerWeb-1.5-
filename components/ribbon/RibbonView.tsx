import React from 'react';
import { Focus, RotateCcw, Scan, Sun, Moon, Monitor } from 'lucide-react';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSelect } from '../ui/EditorSelect';
import { EditorNumber } from '../ui/EditorNumber';
import { LanguagePicker } from '../ui/LanguagePicker';
import { fitCanvasToViewport } from '../../services/viewCommands';
import { ThemeMode } from '../../types';
import './view.css';
export const RibbonView=React.memo(()=>{
  const state=useEditorStore(),{language}=state;
  const toggle=(label:string,checked:boolean,onChange:()=>void)=><button type="button" className="view-toggle" role="switch" aria-checked={checked} onClick={onChange}><span aria-hidden="true" className="view-toggle-track"><span/></span><span>{t(label,language)}</span></button>;
  return <>
    <RibbonGroup label={t('Panels',language)}><div className="view-controls view-panel-toggles">
      {toggle('Pages',state.showPages,()=>state.toggleViewOption('showPages'))}
      {toggle('Show Layers',state.showLayers,state.toggleLayers)}
      {toggle('Show Properties',state.showRightPanel,state.toggleRightPanel)}
      {toggle('Status bar',state.showStatusBar,()=>state.toggleViewOption('showStatusBar'))}
      {toggle('Ribbon',state.ribbonExpanded,()=>state.setRibbonExpanded(!state.ribbonExpanded))}
    </div></RibbonGroup>
    <RibbonGroup label={t('Canvas',language)}><div className="view-controls view-canvas-options"><div>
      {toggle('Show Grid',state.showGrid,state.toggleGrid)}
      {toggle('Snap to objects',state.snapEnabled,()=>state.toggleViewOption('snapEnabled'))}
      {toggle('Alignment guides',state.showGuides,()=>state.toggleViewOption('showGuides'))}
    </div><label className="view-field"><span>{t('Grid spacing',language)}</span><EditorSelect label={t('Grid spacing',language)} value={String(state.gridSize)} onChange={value=>state.setGridSize(Number(value))} options={[5,10,20,25,50,100].map(value=>({value:String(value),label:value+' px'}))}/></label></div></RibbonGroup>
    <RibbonGroup label={t('Zoom',language)}><div className="view-controls view-scale-options">
      <label className="view-scale-field"><span>{t('Canvas',language)}</span><EditorNumber label={t('Canvas zoom',language)} min={10} max={500} step={10} value={Math.round(state.scale*100)} suffix="%" onChange={value=>state.setScale(value/100)}/><button type="button" className="view-icon-button" aria-label={t('Fit page',language)} title={t('Fit page',language)} onClick={fitCanvasToViewport}><Scan size={15}/></button><button type="button" className="view-text-button" title={t('Actual size',language)} onClick={()=>state.setScale(1)}>100%</button></label>
      <label className="view-scale-field"><span>{t('Interface',language)}</span><EditorNumber label={t('Interface scale',language)} min={50} max={200} step={5} value={Math.round(state.uiScale*100)} suffix="%" onChange={value=>state.setUiScale(value/100)}/><button type="button" className="view-text-button" title={t('Reset interface scale',language)} onClick={()=>state.setUiScale(1)}>100%</button></label>
    </div></RibbonGroup>
    <RibbonGroup label={t('Appearance',language)}><div className="view-controls view-appearance"><div className="view-theme-options" role="group" aria-label={t('Theme',language)}>{([{value:'light',label:'Light theme',icon:Sun},{value:'dark',label:'Dark theme',icon:Moon},{value:'system',label:'System theme',icon:Monitor}] as const).map(item=><button type="button" key={item.value} title={t(item.label,language)} aria-label={t(item.label,language)} aria-pressed={state.themeMode===item.value} onClick={()=>state.setThemeMode(item.value as ThemeMode)}><item.icon size={17}/></button>)}</div><LanguagePicker value={language} onChange={state.setLanguage}/></div></RibbonGroup>
    <RibbonGroup label={t('Workspace',language)}><BigButton icon={Focus} label={t('Focus mode',language)+' · F8'} active={state.focusMode} onClick={()=>state.toggleViewOption('focusMode')}/><BigButton icon={RotateCcw} label={t('Reset view',language)} onClick={state.resetViewSettings}/></RibbonGroup>
  </>;
});
