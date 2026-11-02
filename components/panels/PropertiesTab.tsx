import { SemanticProperties } from './SemanticProperties';
import { MediaProperties } from '../media/MediaProperties';
import { shaderSupports } from '../../types/shaders';
import { Slider } from '../ui/Slider';
// components/panels/PropertiesTab.tsx — Position, size, style, typography

import React, { useState } from 'react';
import { LayoutTemplate, Palette, Sparkles, Droplets, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { ColorPicker } from '../ColorPicker';
import { GradientEditor } from '../GradientEditor';
import { FontPicker } from '../FontPicker';
import { CanvasElement, ElementStyle } from '../../types';
import { ChevronDown } from 'lucide-react';

type ActivePicker = 'fill' | 'stroke' | 'color' | null;

interface Props {
  element: CanvasElement;
  inputClass: string;
  labelClass: string;
}

export const PropertiesTab: React.FC<Props> = ({ element, inputClass, labelClass }) => {
  const { language, selectedElementIds, updateElementProp, updateElementStyle, updateElementStyleBulk } = useEditorStore();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showGradient, setShowGradient] = useState(false);

  const isGlass = element.style.backdropBlur === 20 && element.style.fill.replace(/\s/g, '') === 'rgba(0,0,0,0.7)';

  const toggleGlass = (on: boolean) => updateElementStyleBulk(on
    ? { fill: 'rgba(0,0,0,0.7)', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, backdropBlur: 20, opacity: 1, shadowBlur: 30, shadowColor: 'rgba(0,0,0,0.3)' }
    : { fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 1, backdropBlur: 0, opacity: 1, shadowBlur: 0 }
  );

  const ColorBtn = ({ prop, value, label }: { prop: ActivePicker; value: string; label: string }) => {
    const open = activePicker === prop;
    return (
      <div className="relative">
        <label className={labelClass}>{label}</label>
        <button data-picker-toggle onClick={e => {
          if (open) { setActivePicker(null); return; }
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPickerPos({ x: r.left - 200, y: r.bottom + 5 });
          setActivePicker(prop);
        }} className={`flex items-center justify-between w-full bg-gray-50 dark:bg-slate-800 p-1.5 rounded border ${open ? 'border-brand-500' : 'border-gray-200 dark:border-slate-700 hover:border-brand-500'}`}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ background: value }} />
            <span className="text-[10px] font-mono truncate w-24 text-left">
              {value?.startsWith('linear') || value?.startsWith('radial') ? 'Gradient' : value}
            </span>
          </div>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {selectedElementIds.length > 1 && (
          <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 p-2 rounded text-[10px] text-brand-700 font-medium">
            {t('Multiple items selected', language)} ({selectedElementIds.length})
          </div>
        )}

        {/* Position & Size */}
        <section>
          <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1 uppercase">
            <LayoutTemplate size={12} className="text-brand-500" /> {t('Position & Size', language)}
          </h4>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {([['X','x'],['Y','y'],['W','width'],['H','height']] as const).map(([l, k]) => (
              <div key={k}>
                <label className={labelClass}>{l}</label>
                <input type="number" value={Math.round((element as any)[k])}
                  onChange={e => updateElementProp(k, parseInt(e.target.value))}
                  className={inputClass} />
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass}><LayoutTemplate size={10} className="inline mr-1" />{t('Mode', language)}</label>
            <select value={element.positionMode || 'absolute'}
              onChange={e => updateElementProp('positionMode', e.target.value)}
              className={inputClass}>
              <option value="absolute">{t('Standard', language)}</option>
              <option value="fixed">{t('Fixed', language)}</option>
            </select>
          </div>
        </section>

        {(element.type==='image'||element.type==='video')&&<MediaProperties key={element.id} element={element} inputClass={inputClass} labelClass={labelClass}/>}

        {shaderSupports(element.type)&&<section className="border-t border-gray-200 dark:border-slate-700 pt-2">
          <div className="flex items-center justify-between gap-2"><h4 className="text-[10px] font-bold uppercase flex items-center gap-1"><Sparkles size={12} className="text-brand-500"/>{language==='ru'?'Шейдеры':'Shaders'}</h4><button type="button" className="text-[10px] px-2 py-1 rounded bg-brand-50 text-brand-600 dark:bg-slate-800" onClick={()=>useEditorStore.setState({showShaderEditor:true,shaderPresetId:null,shaderEditorScope:'object'})}>{element.shader?(language==='ru'?'Настроить':'Edit'):(language==='ru'?'Добавить':'Add')}</button></div>
          {element.shader&&<div className="flex items-center justify-between gap-2 mt-2 text-[11px]"><span className="truncate">{element.shader.name}</span><button type="button" aria-label="Убрать шейдер" className="text-gray-400 hover:text-brand-600" onClick={()=>{const state=useEditorStore.getState();state.commitTransaction();state.updateSpecificElement(element.id,{shader:null});}}>×</button></div>}
        </section>}
        <SemanticProperties element={element} inputClass={inputClass} labelClass={labelClass}/>
        {/* Appearance */}
        <section>
          <h4 className="text-[10px] font-bold mb-2 border-t pt-2 uppercase flex items-center gap-1">
            <Palette size={12} className="text-brand-500" /> {t('Appearance', language)}
          </h4>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-800/50 p-2 rounded border border-gray-200 dark:border-slate-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center"><Sparkles size={12} className="text-blue-500 mr-2" /><span className="text-[10px] font-bold">{t('Glass', language)}</span></div>
                <input type="checkbox" className="accent-blue-500" checked={!!isGlass} onChange={e => toggleGlass(e.target.checked)} />
              </label>
            </div>
            <ColorBtn prop="fill" label={t('Fill', language)} value={element.style.fill} />
            <div>
              <ColorBtn prop="stroke" label={t('Border Color', language)} value={element.style.stroke} />
              <div className="mt-2">
                <div className="flex justify-between mb-0.5">
                  <label className={labelClass}>{t('Thickness', language)}</label>
                  <span className="text-[9px] text-gray-500">{element.style.strokeWidth}px</span>
                </div>
                <Slider aria-label={t('Border thickness', language)} min={0} max={20} value={element.style.strokeWidth}
                  onChange={e => updateElementStyle('strokeWidth', parseInt(e.target.value))}
                  className="w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label className={labelClass}>{t('Opacity', language)}</label>
                <span className="text-[9px] text-gray-500">{Math.round(element.style.opacity * 100)}%</span>
              </div>
              <Slider aria-label={t('Opacity', language)} min={0} max={1} step={0.05} value={element.style.opacity}
                onChange={e => updateElementStyle('opacity', parseFloat(e.target.value))}
                className="w-full" />
            </div>
            {(element.type === 'rect' || element.type === 'button') && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className={labelClass}>{t('Radius', language)}</label>
                  <span className="text-[9px] text-gray-500">{element.style.borderRadius}px</span>
                </div>
                <Slider aria-label={t('Corner radius', language)} min={0} max={100} value={element.style.borderRadius}
                  onChange={e => updateElementStyle('borderRadius', parseInt(e.target.value))}
                  className="w-full" />
              </div>
            )}
            {['rect','roundedRect','circle'].includes(element.type) && (
              <div className="border-t border-dashed pt-2">
                <div className="flex justify-between mb-0.5">
                  <label className={labelClass}><Droplets size={10} className="inline mr-1" />{t('Backdrop Blur', language)}</label>
                  <span className="text-[9px] text-gray-500">{element.style.backdropBlur || 0}px</span>
                </div>
                <Slider aria-label={t('Backdrop Blur', language)} min={0} max={50} value={element.style.backdropBlur || 0}
                  onChange={e => updateElementStyle('backdropBlur', parseInt(e.target.value))}
                  className="w-full" />
              </div>
            )}
          </div>
        </section>

        {/* Typography */}
        {(element.type === 'text' || element.type === 'button') && (
          <section>
            <h4 className="text-[10px] font-bold mb-2 border-t pt-2 uppercase flex items-center gap-1">
              <span className="text-brand-500 font-serif text-xs">T</span> {t('Typography', language)}
            </h4>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>{t('Content', language)}</label>
                <textarea rows={4} value={element.content || ''}
                  onChange={e => updateElementProp('content', e.target.value)}
                  className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>{t('Font Family', language)}</label>
                <FontPicker value={element.style.fontFamily || 'Arial'} onChange={f => updateElementStyle('fontFamily', f)} />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className={labelClass}>{t('Size', language)}</label>
                  <input type="number" value={element.style.fontSize}
                    onChange={e => updateElementStyle('fontSize', parseInt(e.target.value))}
                    className={inputClass} />
                </div>
                <div className="flex-1">
                  <ColorBtn prop="color" label={t('Text Color', language)} value={element.style.color || '#000000'} />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {([['fontWeight','bold','normal',<Bold key="b" size={12}/>],['fontStyle','italic','normal',<Italic key="i" size={12}/>]] as [keyof ElementStyle, string, string, React.ReactNode][])
                  .map(([k, on, off, icon]) => (
                    <button key={String(k)} onClick={() => updateElementStyle(k, element.style[k] === on ? off : on)}
                      className={`p-1 rounded border ${element.style[k] === on ? 'bg-brand-100 border-brand-400 text-brand-700' : 'border-gray-200 dark:border-slate-700'}`}>
                      {icon}
                    </button>
                  ))}
                <div className="w-px h-4 bg-gray-300 mx-1" />
                {([['left',<AlignLeft key="l" size={12}/>],['center',<AlignCenter key="c" size={12}/>],['right',<AlignRight key="r" size={12}/>]] as [string, React.ReactNode][])
                  .map(([align, icon]) => (
                    <button key={align} onClick={() => updateElementStyle('textAlign', align)}
                      className={`p-1 rounded border ${element.style.textAlign === align ? 'bg-brand-100 border-brand-400 text-brand-700' : 'border-gray-200 dark:border-slate-700'}`}>
                      {icon}
                    </button>
                  ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Color Picker Popup */}
      {activePicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={
              activePicker === 'fill' ? element.style.fill :
              activePicker === 'stroke' ? element.style.stroke :
              element.style.color || '#000'
            }
            onChange={color => {
              updateElementStyle(activePicker === 'color' ? 'color' : activePicker === 'stroke' ? 'stroke' : 'fill', color);
              setActivePicker(null);
            }}
            allowGradient={activePicker === 'fill'}
            onOpenGradient={() => { setActivePicker(null); setShowGradient(true); }}
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setActivePicker(null)} />
        </div>
      )}

      {showGradient && (
        <GradientEditor
          initialValue={element.style.fill}
          onClose={() => setShowGradient(false)}
          onApply={css => updateElementStyle('fill', css)}
        />
      )}
    </>
  );
};
