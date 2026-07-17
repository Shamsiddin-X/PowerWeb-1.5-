import React from 'react';
import { ANIMATION_PRESETS, Animation, AnimationEasing, CanvasElement, EditorState } from '../../types';
import { RibbonGroup } from './RibbonShared';
import { generateId } from '../../utils';

interface RibbonAnimationsProps {
  editorState: EditorState;
  selectedElement: CanvasElement;
  onUpdateElement: (key: string, value: any, isStyle?: boolean) => void;
}

export const RibbonAnimations = React.memo(({
  editorState,
  selectedElement,
  onUpdateElement,
}: RibbonAnimationsProps) => {
  const elementAnims = selectedElement.animations || [];
  const [aCategory, setACategory] = React.useState<string>('Entrance');

  const addAnimation = (key: string) => {
    const newAnim: Animation = {
      id: generateId(),
      name: key,
      trigger: 'onScroll',
      duration: 0.8,
      delay: 0,
      easing: 'ease-out',
      iterationCount: 1,
    };
    onUpdateElement('animations', [...elementAnims, newAnim]);
  };

  const removeAnimation = (id: string) => {
    onUpdateElement('animations', elementAnims.filter(a => a.id !== id));
  };

  const updateAnimField = (id: string, field: keyof Animation, value: any) => {
    onUpdateElement('animations', elementAnims.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const previewAnimation = (anim: Animation) => {
    const el = document.getElementById(selectedElement.id);
    if (!el) return;
    el.style.animationName = 'none';
    void el.offsetWidth;
    el.style.animationName = `anim_${anim.name}`;
    el.style.animationDuration = anim.duration + 's';
    el.style.animationDelay = '0s';
    el.style.animationTimingFunction = anim.easing || 'ease';
    el.style.animationFillMode = 'both';
    el.classList.add(`anim-${anim.name}`, 'pwb-animated');
    setTimeout(() => {
      el.classList.remove(`anim-${anim.name}`, 'pwb-animated');
      el.style.animationName = '';
      el.style.animationDuration = '';
    }, (anim.duration + anim.delay + 0.1) * 1000);
  };

  const categories = ['Entrance', 'Attention', 'Continuous', 'Exit'] as const;

  return (
    <>
      <RibbonGroup label="Library">
        <div className="flex flex-col h-full justify-start pt-0.5" style={{ width: 260 }}>
          <div className="flex gap-1 mb-1">
            {categories.map(cat => (
              <button key={cat}
                onClick={() => setACategory(cat)}
                className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                  aCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200'
                }`}
              >{cat}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 overflow-y-auto" style={{ maxHeight: 64 }}>
            {ANIMATION_PRESETS.filter(p => p.category === aCategory).map(preset => (
              <button
                key={preset.key}
                onClick={() => addAnimation(preset.key)}
                title={`Add "${preset.name}" animation`}
                className="flex items-center gap-1 text-[10px] bg-gray-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand-600 border border-gray-200 dark:border-slate-600 rounded px-1.5 py-0.5 transition-colors whitespace-nowrap"
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Applied">
        <div className="flex flex-col h-full justify-start pt-0.5 gap-1 overflow-y-auto" style={{ width: 420, maxHeight: 80 }}>
          {elementAnims.length === 0 && (
            <div className="text-[10px] text-gray-400 dark:text-slate-500 italic pt-2">
              No animations. Pick one from the library →
            </div>
          )}
          {elementAnims.map(anim => {
            const preset = ANIMATION_PRESETS.find(p => p.key === anim.name);
            return (
              <div key={anim.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1">
                <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 w-20 truncate" title={preset?.name || anim.name}>
                  {preset?.icon} {preset?.name || anim.name}
                </span>

                <select value={anim.trigger} onChange={e => updateAnimField(anim.id, 'trigger', e.target.value)}
                  className="text-[9px] border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-1 py-0.5 h-5">
                  <option value="onScroll">On Scroll</option>
                  <option value="onLoad">On Load</option>
                  <option value="onClick">On Click</option>
                  <option value="onHover">On Hover</option>
                </select>

                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-400">⏱</span>
                  <input type="number" min="0.1" max="5" step="0.1" value={anim.duration}
                    onChange={e => updateAnimField(anim.id, 'duration', parseFloat(e.target.value))}
                    className="w-10 text-[9px] border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-1 py-0.5 h-5 text-center" />
                  <span className="text-[9px] text-gray-400">s</span>
                </div>

                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-400">+</span>
                  <input type="number" min="0" max="5" step="0.1" value={anim.delay}
                    onChange={e => updateAnimField(anim.id, 'delay', parseFloat(e.target.value))}
                    className="w-10 text-[9px] border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-1 py-0.5 h-5 text-center" />
                  <span className="text-[9px] text-gray-400">s</span>
                </div>

                <select value={String(anim.iterationCount ?? 1)}
                  onChange={e => updateAnimField(anim.id, 'iterationCount', e.target.value === 'infinite' ? 'infinite' : parseInt(e.target.value))}
                  className="text-[9px] border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-1 py-0.5 h-5">
                  <option value="1">× 1</option>
                  <option value="2">× 2</option>
                  <option value="3">× 3</option>
                  <option value="infinite">∞</option>
                </select>

                <select value={anim.easing || 'ease'}
                  onChange={e => updateAnimField(anim.id, 'easing', e.target.value as AnimationEasing)}
                  className="text-[9px] border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-1 py-0.5 h-5">
                  <option value="ease">Ease</option>
                  <option value="ease-in">Ease In</option>
                  <option value="ease-out">Ease Out</option>
                  <option value="ease-in-out">Ease In Out</option>
                  <option value="linear">Linear</option>
                  <option value="cubic-bezier(0.34,1.56,0.64,1)">Spring</option>
                </select>

                <button onClick={() => previewAnimation(anim)} title="Preview"
                  className="text-[9px] px-1.5 py-0.5 bg-brand-50 dark:bg-slate-700 text-brand-600 dark:text-brand-400 hover:bg-brand-100 border border-brand-200 dark:border-slate-600 rounded h-5">▶</button>

                <button onClick={() => removeAnimation(anim.id)}
                  className="text-[9px] px-1 py-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 rounded h-5">✕</button>
              </div>
            );
          })}
        </div>
      </RibbonGroup>
    </>
  );
});
