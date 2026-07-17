// components/RightPanel.tsx — Element & Page properties panel

import React, { useState, useEffect } from 'react';
import { Palette, Zap, Film, FileText, X, AlignLeft, AlignCenter, AlignRight, Bold, Italic, LayoutTemplate, PlayCircle, Sparkles, Droplets, Plus, Trash2, ChevronDown, MousePointerClick } from 'lucide-react';
import { t } from '../utils/localization';
import { useEditorStore } from '../store/useEditorStore';
import { ColorPicker } from './ColorPicker';
import { GradientEditor } from './GradientEditor';
import { FontPicker } from './FontPicker';
import { Action, LogicBlock, ElementStyle } from '../types';
import { generateId } from '../store/helpers';

type PanelTab = 'properties' | 'interactions' | 'animations';
type ActivePicker = 'fill' | 'stroke' | 'color' | 'pageBackground' | null;

export const RightPanel = React.memo(() => {
  const {
    project, selectedElementIds, language,
    updateElementStyle, updateElementStyleBulk, updateElementProp,
    updatePageProperty, setShowRightPanel,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<PanelTab>('properties');
  const [activeColorPicker, setActiveColorPicker] = useState<ActivePicker>(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [gradientTarget, setGradientTarget] = useState<'fill' | 'pageBackground'>('fill');

  const selectedPage = project.pages.find(p => p.id === project.activePageId);
  let selectedElement = null as any;
  if (selectedPage && selectedElementIds.length > 0) {
    for (const layer of selectedPage.layers) {
      const found = layer.elements.find(el => el.id === selectedElementIds[0]);
      if (found) { selectedElement = found; break; }
    }
  }

  useEffect(() => { setActiveColorPicker(null); setShowGradientModal(false); }, [selectedElementIds, project.activePageId]);

  const inputClass = "w-full text-xs px-2 py-1 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:border-brand-500 outline-none";
  const labelClass = "text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-0.5 block tracking-wider";

  const toggleGlass = (on: boolean) => updateElementStyleBulk(on
    ? { fill: 'rgba(0,0,0,0.7)', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, backdropBlur: 20, opacity: 1, shadowBlur: 30, shadowColor: 'rgba(0,0,0,0.3)' }
    : { fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 1, backdropBlur: 0, opacity: 1, shadowBlur: 0 }
  );
  const isGlass = selectedElement?.style.backdropBlur === 20 && selectedElement?.style.fill === 'rgba(0,0,0,0.7)';

  const updateLogic = (block: LogicBlock) => updateElementProp('logic', [block]);
  const currentLogic = selectedElement?.logic?.[0] || { actions: [] };
  const currentActionType = currentLogic.actions?.[0]?.type || 'none';
  const currentTargetId = currentLogic.actions?.[0]?.targetId || '';

  const ColorBtn = ({ prop, value, label }: { prop: ActivePicker; value: string; label: string }) => {
    const open = activeColorPicker === prop;
    return (
      <div className="relative">
        <label className={labelClass}>{label}</label>
        <button data-picker-toggle onClick={(e) => {
          if (open) { setActiveColorPicker(null); return; }
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPickerPos({ x: r.left - 200, y: r.bottom + 5 });
          setActiveColorPicker(prop);
        }} className={`flex items-center justify-between w-full bg-gray-50 dark:bg-slate-800 p-1.5 rounded border ${open ? 'border-brand-500' : 'border-gray-200 dark:border-slate-700 hover:border-brand-500'}`}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ background: value }} />
            <span className="text-[10px] font-mono truncate w-24 text-left">{value?.startsWith('linear') || value?.startsWith('radial') ? 'Gradient' : value}</span>
          </div>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="w-56 bg-white dark:bg-slate-900 border-l border-gray-300 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-colors">
        {!selectedElement ? (
          <>
            <div className="p-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
              <h3 className="font-semibold text-xs text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"><FileText size={12} /> {t('Page Settings', language)}</h3>
              <button onClick={() => setShowRightPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
            <div className="p-3 space-y-4 overflow-y-auto">
              <section>
                <h4 className="text-[10px] font-bold text-gray-900 dark:text-slate-100 mb-2">{t('Dimensions', language)}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelClass}>W (px)</label><input type="number" value={selectedPage?.width || 1200} onChange={(e) => updatePageProperty('width', parseInt(e.target.value))} className={inputClass} /></div>
                  <div><label className={labelClass}>H (px)</label><input type="number" value={selectedPage?.height || 800} onChange={(e) => updatePageProperty('height', parseInt(e.target.value))} className={inputClass} /></div>
                </div>
              </section>
              <section>
                <h4 className="text-[10px] font-bold text-gray-900 dark:text-slate-100 mb-2">{t('Background', language)}</h4>
                <ColorBtn prop="pageBackground" label={t('Fill', language)} value={selectedPage?.backgroundColor || '#ffffff'} />
              </section>
            </div>
          </>
        ) : (
          <>
            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 items-center pr-1">
              {(['properties', 'interactions', 'animations'] as PanelTab[]).map((tab, i) => {
                const icons = [<Palette size={12}/>, <Zap size={12}/>, <Film size={12}/>];
                const labels = [t('Props', language), t('Logic', language), t('Anim', language)];
                return <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${activeTab === tab ? 'text-brand-600 bg-white dark:bg-slate-900 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}>{icons[i]} {labels[i]}</button>;
              })}
              <button onClick={() => setShowRightPanel(false)} className="p-1 text-gray-400 hover:text-gray-600 ml-1"><X size={14} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* PROPERTIES TAB */}
              {activeTab === 'properties' && (
                <div className="space-y-4">
                  {selectedElementIds.length > 1 && <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 p-2 rounded text-[10px] text-brand-700 font-medium">{t('Multiple items selected', language)} ({selectedElementIds.length})</div>}
                  
                  <section>
                    <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1 uppercase"><LayoutTemplate size={12} className="text-brand-500" /> {t('Position & Size', language)}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[['X','x'],['Y','y'],['W','width'],['H','height']].map(([l, k]) => (
                        <div key={k}><label className={labelClass}>{l}</label><input type="number" value={Math.round(selectedElement[k])} onChange={(e) => updateElementProp(k, parseInt(e.target.value))} className={inputClass} /></div>
                      ))}
                    </div>
                    <div><label className={labelClass}><LayoutTemplate size={10} className="inline mr-1"/>{t('Mode', language)}</label>
                      <select value={selectedElement.positionMode || 'absolute'} onChange={(e) => updateElementProp('positionMode', e.target.value)} className={inputClass}>
                        <option value="absolute">{t('Standard', language)}</option>
                        <option value="fixed">{t('Fixed', language)}</option>
                      </select>
                    </div>
                  </section>

                  {selectedElement.type === 'video' && (
                    <section>
                      <h4 className="text-[10px] font-bold mb-2 border-t pt-2 flex items-center gap-1 uppercase"><PlayCircle size={12} className="text-brand-500"/> {t('Video', language)}</h4>
                      <label className={labelClass}>{t('URL', language)}</label>
                      <input type="text" value={selectedElement.content || ''} onChange={(e) => updateElementProp('content', e.target.value)} className={`${inputClass} mb-2`} />
                      {(['autoplay','loop','muted'] as const).map(k => (
                        <label key={k} className="flex items-center text-xs text-gray-700 dark:text-slate-300 cursor-pointer mb-1">
                          <input type="checkbox" checked={selectedElement.videoProps?.[k] ?? true} onChange={(e) => updateElementProp('videoProps', { ...(selectedElement.videoProps || {}), [k]: e.target.checked })} className="mr-2 rounded accent-brand-600" /> {t(k.charAt(0).toUpperCase() + k.slice(1), language)}
                        </label>
                      ))}
                    </section>
                  )}

                  <section>
                    <h4 className="text-[10px] font-bold mb-2 border-t pt-2 uppercase flex items-center gap-1"><Palette size={12} className="text-brand-500"/> {t('Appearance', language)}</h4>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-800/50 p-2 rounded border border-gray-200 dark:border-slate-700">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center"><Sparkles size={12} className="text-blue-500 mr-2"/><span className="text-[10px] font-bold">{t('Glass', language)}</span></div>
                          <input type="checkbox" className="accent-blue-500" checked={!!isGlass} onChange={(e) => toggleGlass(e.target.checked)} />
                        </label>
                      </div>
                      <ColorBtn prop="fill" label={t('Fill', language)} value={selectedElement.style.fill} />
                      <div>
                        <ColorBtn prop="stroke" label={t('Border Color', language)} value={selectedElement.style.stroke} />
                        <div className="mt-2">
                          <div className="flex justify-between mb-0.5"><label className={labelClass}>{t('Thickness', language)}</label><span className="text-[9px] text-gray-500">{selectedElement.style.strokeWidth}px</span></div>
                          <input type="range" min="0" max="20" value={selectedElement.style.strokeWidth} onChange={(e) => updateElementStyle('strokeWidth', parseInt(e.target.value))} className="w-full accent-brand-500 h-1" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5"><label className={labelClass}>{t('Opacity', language)}</label><span className="text-[9px] text-gray-500">{Math.round(selectedElement.style.opacity * 100)}%</span></div>
                        <input type="range" min="0" max="1" step="0.05" value={selectedElement.style.opacity} onChange={(e) => updateElementStyle('opacity', parseFloat(e.target.value))} className="w-full accent-brand-500 h-1" />
                      </div>
                      {(selectedElement.type === 'rect' || selectedElement.type === 'button') && (
                        <div>
                          <div className="flex justify-between mb-0.5"><label className={labelClass}>{t('Radius', language)}</label><span className="text-[9px] text-gray-500">{selectedElement.style.borderRadius}px</span></div>
                          <input type="range" min="0" max="100" value={selectedElement.style.borderRadius} onChange={(e) => updateElementStyle('borderRadius', parseInt(e.target.value))} className="w-full accent-brand-500 h-1" />
                        </div>
                      )}
                      {['rect','roundedRect','circle'].includes(selectedElement.type) && (
                        <div className="border-t border-dashed pt-2">
                          <div className="flex justify-between mb-0.5"><label className={labelClass}><Droplets size={10} className="inline mr-1"/>{t('Backdrop Blur', language)}</label><span className="text-[9px] text-gray-500">{selectedElement.style.backdropBlur || 0}px</span></div>
                          <input type="range" min="0" max="50" value={selectedElement.style.backdropBlur || 0} onChange={(e) => updateElementStyle('backdropBlur', parseInt(e.target.value))} className="w-full accent-blue-500 h-1" />
                        </div>
                      )}
                    </div>
                  </section>

                  {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                    <section>
                      <h4 className="text-[10px] font-bold mb-2 border-t pt-2 uppercase flex items-center gap-1"><span className="text-brand-500 font-serif text-xs">T</span> {t('Typography', language)}</h4>
                      <div className="space-y-2">
                        <div><label className={labelClass}>{t('Content', language)}</label><textarea rows={4} value={selectedElement.content || ''} onChange={(e) => updateElementProp('content', e.target.value)} className={`${inputClass} resize-none`} /></div>
                        <div><label className={labelClass}>{t('Font Family', language)}</label><FontPicker value={selectedElement.style.fontFamily || 'Arial'} onChange={(f) => updateElementStyle('fontFamily', f)} /></div>
                        <div className="flex space-x-2">
                          <div className="flex-1"><label className={labelClass}>{t('Size', language)}</label><input type="number" value={selectedElement.style.fontSize} onChange={(e) => updateElementStyle('fontSize', parseInt(e.target.value))} className={inputClass} /></div>
                          <div className="flex-1"><ColorBtn prop="color" label={t('Text Color', language)} value={selectedElement.style.color || '#000000'} /></div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {[['fontWeight','bold','normal',<Bold size={12}/>],['fontStyle','italic','normal',<Italic size={12}/>]].map(([k, on, off, icon]: any) => (
                            <button key={k} onClick={() => updateElementStyle(k as keyof ElementStyle, selectedElement.style[k] === on ? off : on)} className={`p-1 rounded border ${selectedElement.style[k] === on ? 'bg-brand-100 border-brand-400 text-brand-700' : 'border-gray-200 dark:border-slate-700'}`}>{icon}</button>
                          ))}
                          <div className="w-px h-4 bg-gray-300 mx-1" />
                          {[['left',<AlignLeft size={12}/>],['center',<AlignCenter size={12}/>],['right',<AlignRight size={12}/>]].map(([align, icon]: any) => (
                            <button key={align} onClick={() => updateElementStyle('textAlign', align)} className={`p-1 rounded border ${selectedElement.style.textAlign === align ? 'bg-brand-100 border-brand-400 text-brand-700' : 'border-gray-200 dark:border-slate-700'}`}>{icon}</button>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* INTERACTIONS TAB */}
              {activeTab === 'interactions' && (
                <div className="space-y-4">
                  <section>
                    <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1 uppercase"><MousePointerClick size={12} className="text-brand-500"/> {t('On Click', language)}</h4>
                    <div className="space-y-3">
                      <div><label className={labelClass}>{t('Action', language)}</label>
                        <select value={currentActionType} onChange={(e) => {
                          const type = e.target.value as any;
                          const action: Action = { type };
                          if (type === 'navigateToPage') action.targetId = project.pages[0]?.id || '';
                          updateLogic({ event: { type: 'click' }, actions: type === 'none' ? [] : [action] });
                        }} className={inputClass}>
                          <option value="none">{t('No Action', language)}</option>
                          <option value="navigateToPage">{t('Go to Page', language)}</option>
                          <option value="showModal">{t('Show Modal', language)}</option>
                          <option value="navigateToUrl">{t('Open URL', language)}</option>
                        </select>
                      </div>
                      {currentActionType === 'navigateToPage' && (
                        <div><label className={labelClass}>{t('Target Page', language)}</label>
                          <select value={currentTargetId} onChange={(e) => updateLogic({ event: { type: 'click' }, actions: [{ type: 'navigateToPage', targetId: e.target.value }] })} className={inputClass}>
                            {project.pages.map((p, i) => <option key={p.id} value={p.id}>{i + 1}. {p.name}</option>)}
                          </select>
                        </div>
                      )}
                      {currentActionType === 'navigateToUrl' && (
                        <div><label className={labelClass}>{t('URL', language)}</label>
                          <input type="text" placeholder="https://example.com" value={currentLogic.actions?.[0]?.url || ''} onChange={(e) => updateLogic({ event: { type: 'click' }, actions: [{ type: 'navigateToUrl', url: e.target.value }] })} className={inputClass} />
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* ANIMATIONS TAB */}
              {activeTab === 'animations' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold flex items-center gap-1 uppercase"><Film size={12} className="text-brand-500"/> {t('Animations', language)}</h4>
                    <button onClick={() => updateElementProp('animations', [...(selectedElement.animations || []), { id: generateId(), name: 'fadeIn', trigger: 'onLoad', duration: 1, delay: 0 }])} className="p-1 px-2 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded text-[9px] font-bold uppercase">
                      <Plus size={10} strokeWidth={3}/> {t('Add', language)}
                    </button>
                  </div>
                  {(!selectedElement.animations || selectedElement.animations.length === 0) && (
                    <div className="text-center py-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                      <Film size={24} className="mx-auto text-gray-300 mb-2"/>
                      <p className="text-[10px] text-gray-500">{t('No animations added', language)}</p>
                    </div>
                  )}
                  {(selectedElement.animations || []).map((anim: any, index: number) => (
                    <div key={anim.id || index} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs relative">
                      <div className="flex justify-between items-center mb-1">
                        <select value={anim.trigger} onChange={(e) => { const a = [...(selectedElement.animations||[])]; a[index]={...a[index],trigger:e.target.value as any}; updateElementProp('animations',a); }} className="bg-transparent font-bold text-brand-600 dark:text-brand-400 outline-none text-[10px] uppercase">
                          {[['onLoad','⚡ On Load'],['onScroll','📜 On Scroll'],['onHover','👆 On Hover'],['onClick','🖱️ On Click']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                        <button onClick={() => updateElementProp('animations', (selectedElement.animations||[]).filter((_:any,i:number)=>i!==index))} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-400 text-[9px] uppercase font-bold w-10">{t('Effect', language)}</span>
                        <select value={anim.name} onChange={(e) => { const a=[...(selectedElement.animations||[])]; a[index]={...a[index],name:e.target.value}; updateElementProp('animations',a); }} className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-1 py-1 text-xs">
                          <optgroup label="Entrance"><option value="fadeIn">Fade In</option><option value="fadeInUp">Fade In Up</option><option value="fadeInDown">Fade In Down</option><option value="zoomIn">Zoom In</option><option value="bounceIn">Bounce In</option><option value="slideInUp">Slide In Up</option></optgroup>
                          <optgroup label="Attention"><option value="pulse">Pulse</option><option value="shake">Shake</option><option value="bounce">Bounce</option><option value="rubberBand">Rubber Band</option></optgroup>
                          <optgroup label="Continuous"><option value="spin">Spin</option><option value="float">Float</option><option value="glow">Glow</option></optgroup>
                          <optgroup label="Exit"><option value="fadeOut">Fade Out</option><option value="zoomOut">Zoom Out</option></optgroup>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        {[['Duration','duration'],['Delay','delay']].map(([label,key])=>(
                          <div key={key} className="flex items-center gap-1 flex-1">
                            <span className="text-[9px] text-gray-400">{label} (s)</span>
                            <input type="number" step="0.1" min="0" value={anim[key]} onChange={(e)=>{const a=[...(selectedElement.animations||[])];a[index]={...a[index],[key]:parseFloat(e.target.value)};updateElementProp('animations',a);}} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-1 py-0.5 text-center text-xs"/>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Color Picker Popup */}
      {activeColorPicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={activeColorPicker === 'fill' ? selectedElement?.style.fill || '#fff' : activeColorPicker === 'stroke' ? selectedElement?.style.stroke || '#000' : activeColorPicker === 'color' ? selectedElement?.style.color || '#000' : selectedPage?.backgroundColor || '#fff'}
            onChange={(color) => {
              if (activeColorPicker === 'pageBackground') updatePageProperty('backgroundColor', color);
              else if (selectedElement) updateElementStyle(activeColorPicker === 'color' ? 'color' : activeColorPicker === 'stroke' ? 'stroke' : 'fill', color);
              setActiveColorPicker(null);
            }}
            allowGradient={activeColorPicker === 'fill' || activeColorPicker === 'pageBackground'}
            onOpenGradient={() => { setGradientTarget(activeColorPicker === 'fill' ? 'fill' : 'pageBackground'); setActiveColorPicker(null); setShowGradientModal(true); }}
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setActiveColorPicker(null)} />
        </div>
      )}

      {/* Gradient Modal */}
      {showGradientModal && (
        <GradientEditor
          initialValue={gradientTarget === 'fill' ? (selectedElement?.style.fill || '#fff') : (selectedPage?.backgroundColor || '#fff')}
          onClose={() => setShowGradientModal(false)}
          onApply={(css) => { if (gradientTarget === 'fill') updateElementStyle('fill', css); else updatePageProperty('backgroundColor', css); }}
        />
      )}
    </>
  );
});
