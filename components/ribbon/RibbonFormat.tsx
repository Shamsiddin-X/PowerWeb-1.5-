import React, { useState } from 'react';
import {
  MoveRight, MoveDown, Maximize, Bold, Italic, Sparkles
} from 'lucide-react';
import { RibbonGroup, CompactInput } from './RibbonShared';
import { ColorPicker } from '../ColorPicker';
import { GradientEditor } from '../GradientEditor';
import { FontPicker } from '../FontPicker';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';

export const RibbonFormat = React.memo(() => {
  const { language, updateElementProp, updateElementStyle, updateElementStyleBulk } = useEditorStore();
  const selectedElement = useSelectedElement();

  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!selectedElement) return null;

  const togglePicker = (e: React.MouseEvent, type: 'fill' | 'stroke' | 'text') => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPickerPos({ x: rect.left, y: rect.bottom + 5 });
    if (type === 'fill') {
      setShowFillPicker(s => !s); setShowStrokePicker(false); setShowTextColorPicker(false);
    } else if (type === 'stroke') {
      setShowStrokePicker(s => !s); setShowFillPicker(false); setShowTextColorPicker(false);
    } else {
      setShowTextColorPicker(s => !s); setShowFillPicker(false); setShowStrokePicker(false);
    }
  };

  const toggleGlassMode = (enabled: boolean) => {
    if (enabled) {
      updateElementStyleBulk({
          fill: 'rgba(0, 0, 0, 0.7)',
          stroke: 'rgba(255, 255, 255, 0.1)',
          strokeWidth: 1,
          backdropBlur: 20,
          opacity: 1,
          shadowBlur: 30,
          shadowColor: 'rgba(0,0,0,0.3)'
      });
    } else {
      updateElementStyleBulk({ fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 1, backdropBlur: 0, opacity: 1, shadowBlur: 0 });
    }
  };

  const isGlassActive = selectedElement?.style.backdropBlur === 20 && 
                        selectedElement?.style.fill === 'rgba(0, 0, 0, 0.7)';


  return (
    <>
      {/* GEOMETRY */}
      <RibbonGroup label={t('Geometry', language)}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <CompactInput value={Math.round(selectedElement.x)} onChange={(e: any) => updateElementProp('x', parseInt(e.target.value))} icon={MoveRight} width="w-16" />
          <CompactInput value={Math.round(selectedElement.y)} onChange={(e: any) => updateElementProp('y', parseInt(e.target.value))} icon={MoveDown} width="w-16" />
          <CompactInput value={Math.round(selectedElement.width)} onChange={(e: any) => updateElementProp('width', parseInt(e.target.value))} icon={Maximize} width="w-16" />
          <CompactInput value={Math.round(selectedElement.height)} onChange={(e: any) => updateElementProp('height', parseInt(e.target.value))} icon={Maximize} width="w-16" />
        </div>
      </RibbonGroup>

      {/* STYLE */}
      <RibbonGroup label={t('Style', language)}>
        <div className="flex gap-2 h-full items-center">
          <div className="relative h-full flex flex-col justify-center">
            <button onClick={(e) => togglePicker(e, 'fill')}
              className="flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 w-12 group" title="Fill Color">
              <div className="w-6 h-6 border border-gray-300 dark:border-slate-600 shadow-sm mb-1" style={{ background: selectedElement.style.fill }} />
              <span className="text-[9px] text-gray-600 dark:text-slate-400 group-hover:text-brand-600">{t('Fill', language)}</span>
            </button>
          </div>
          <div className="relative h-full flex flex-col justify-center">
            <button onClick={(e) => togglePicker(e, 'stroke')}
              className="flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 w-12 group" title="Border Color">
              <div className="w-6 h-6 border-2 border-gray-400 mb-1 bg-transparent" style={{ borderColor: selectedElement.style.stroke }} />
              <span className="text-[9px] text-gray-600 dark:text-slate-400 group-hover:text-brand-600">{t('Border', language)}</span>
            </button>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[9px] text-gray-400 mb-1">{t('Thickness', language)}</span>
            <CompactInput value={selectedElement.style.strokeWidth} onChange={(e: any) => updateElementStyle('strokeWidth', parseInt(e.target.value))} width="w-12" />
          </div>
        </div>
      </RibbonGroup>

      {/* EFFECTS */}
      <RibbonGroup label={t('Effects', language)}>
        <div className="flex gap-2 items-center h-full">
          <div className="flex flex-col gap-1 w-20">
            <div className="flex justify-between text-[9px] text-gray-500">
              <span>{t('Opacity', language)}</span>
              <span>{Math.round(selectedElement.style.opacity * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={selectedElement.style.opacity}
              onChange={(e) => updateElementStyle('opacity', parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500" />
            <div className="flex justify-between text-[9px] text-gray-500 mt-1">
              <span>{t('Radius', language)}</span>
              <span>{selectedElement.style.borderRadius}</span>
            </div>
            <input type="range" min="0" max="50" value={selectedElement.style.borderRadius}
              onChange={(e) => updateElementStyle('borderRadius', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500" />
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
          <button
            onClick={() => toggleGlassMode(!isGlassActive)}
            className={`flex flex-col items-center justify-center p-1 w-14 rounded transition-colors ${isGlassActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Sparkles size={18} className="mb-1" />
            <span className="text-[9px]">{t('Glass', language)}</span>
          </button>
        </div>
      </RibbonGroup>

      {/* TYPOGRAPHY (conditional) */}
      {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
        <RibbonGroup label={t('Typography', language)}>
          <div className="flex items-center gap-2 h-full">
            <div className="flex flex-col justify-center w-36">
              <span className="text-[9px] text-gray-400 mb-0.5">Font</span>
              <FontPicker
                value={selectedElement.style.fontFamily || 'Inter'}
                onChange={(font) => updateElementStyle('fontFamily', font)}
              />
            </div>
            <div className="h-12 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => updateElementStyle('fontWeight', selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`p-1 rounded ${selectedElement.style.fontWeight === 'bold' ? 'bg-gray-200 dark:bg-slate-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                <Bold size={12} />
              </button>
              <button onClick={() => updateElementStyle('fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`p-1 rounded ${selectedElement.style.fontStyle === 'italic' ? 'bg-gray-200 dark:bg-slate-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                <Italic size={12} />
              </button>
              <div className="col-span-2">
                <CompactInput value={selectedElement.style.fontSize} onChange={(e: any) => updateElementStyle('fontSize', parseInt(e.target.value))} width="w-full" />
              </div>
            </div>
            <div className="relative h-full flex flex-col justify-center">
              <button onClick={(e) => togglePicker(e, 'text')}
                className="flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 w-10 group" title="Text Color">
                <div className="font-serif font-bold text-lg leading-none" style={{ color: selectedElement.style.color }}>A</div>
                <div className="h-1 w-4 mt-1 bg-current" style={{ color: selectedElement.style.color }} />
              </button>
            </div>
          </div>
        </RibbonGroup>
      )}

      {/* PICKERS (portaled via fixed positioning) */}
      {showFillPicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={selectedElement.style.fill}
            onChange={(c) => { updateElementStyle('fill', c); setShowFillPicker(false); }}
            onOpenGradient={() => { setShowFillPicker(false); setShowGradientModal(true); }}
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowFillPicker(false)} />
        </div>
      )}
      {showStrokePicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={selectedElement.style.stroke}
            onChange={(c) => { updateElementStyle('stroke', c); setShowStrokePicker(false); }}
            allowGradient={false}
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowStrokePicker(false)} />
        </div>
      )}
      {showTextColorPicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={selectedElement.style.color || '#000'}
            onChange={(c) => { updateElementStyle('color', c); setShowTextColorPicker(false); }}
            allowGradient={false}
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowTextColorPicker(false)} />
        </div>
      )}
      {showGradientModal && (
        <GradientEditor
          initialValue={selectedElement.style.fill || ''}
          onApply={(val) => updateElementStyle('fill', val)}
          onClose={() => setShowGradientModal(false)}
        />
      )}
    </>
  );
});
