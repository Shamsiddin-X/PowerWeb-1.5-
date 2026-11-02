import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, ZoomIn, ZoomOut, MoveVertical, MoveHorizontal, Sparkles, Activity, Waves, FlipHorizontal, FlipVertical, Sun, CircleDashed, Star, Play, MousePointer2, Clock3, Repeat2 } from 'lucide-react';
import { Animation, AnimationPreset, Language, ANIMATION_PRESETS } from '../../types';
import { t } from '../../utils/localization';

export const CATEGORIES = ['Entrance', 'Attention', 'Continuous', 'Exit'] as const;
export function AnimationIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = /Down/.test(name) ? ArrowDown : /Up/.test(name) ? ArrowUp : /Left/.test(name) ? ArrowLeft
    : /Right|lightSpeed/.test(name) ? ArrowRight : /zoomOut/.test(name) ? ZoomOut : /zoom/.test(name) ? ZoomIn
    : /spin|rotate|roll/.test(name) ? RotateCw : name === 'flipInX' ? FlipVertical : name === 'flipInY' ? FlipHorizontal
    : /bounce|float/.test(name) ? MoveVertical : /shake|wobble/.test(name) ? MoveHorizontal
    : /pulse|heart/.test(name) ? Activity : /jello|rubber|swing/.test(name) ? Waves : name === 'glow' ? Sun
    : /fade/.test(name) ? CircleDashed : name === 'tada' ? Star : Sparkles;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
export const AnimationTile = React.memo(function AnimationTile({ preset, language, onSelect, applied = false }: {
  preset: AnimationPreset; language: Language; onSelect: (key: string) => void; applied?: boolean;
}) {
  return <button type="button" className="animation-tile" data-applied={applied || undefined}
    style={{ '--effect-name': preset.key } as React.CSSProperties}
    onClick={() => onSelect(preset.key)} title={`${t('Add', language)}: ${t(preset.name, language)}`}>
    <span className="animation-tile-icon"><span className="animation-glyph"><AnimationIcon name={preset.key} /></span>
      {applied && <span className="animation-applied-dot" />}</span>
    <span className="text-[10px] leading-tight line-clamp-2">{t(preset.name, language)}</span>
  </button>;
});
export function AnimationGallery({ language, onSelect, applied = [], categoryTabs = false }: {
  language: Language; onSelect: (name: string) => void; applied?: Animation[]; categoryTabs?: boolean;
}) {
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Entrance');
  const visible = categoryTabs ? [category] : CATEGORIES;
  return <div className="space-y-3">
    {categoryTabs && <div className="animation-category-tabs flex flex-wrap gap-1 pb-2 border-b border-gray-100 dark:border-slate-700" role="group" aria-label={t('Animation categories', language)}>
      {CATEGORIES.map(value => <button type="button" key={value} onClick={() => setCategory(value)} aria-pressed={category === value}
        className={`gallery-category ${category === value ? 'is-active' : ''}`}>{t(value, language)}</button>)}
    </div>}
    {visible.map(value => <section key={value}>
      <h4 className="gallery-section-label">{t(value, language)}<span className="font-normal normal-case tracking-normal ml-2 opacity-60">{ANIMATION_PRESETS.filter(p => p.category === value).length}</span></h4>
      <div className={`grid gap-1 ${categoryTabs ? 'animation-gallery-grid' : 'grid-cols-4 sm:grid-cols-5'}`}>
        {ANIMATION_PRESETS.filter(p => p.category === value).map(preset =>
          <AnimationTile key={preset.key} preset={preset} language={language} onSelect={onSelect} applied={applied.some(a => a.name === preset.key)} />)}
      </div>
    </section>)}
  </div>;
}

const activePreviews = new WeakMap<HTMLElement, () => void>();
export function useAnimationPreview(elementId: string) {
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), [elementId]);
  return (input: Animation | Animation[]) => {
    cleanup.current();
    const node = document.getElementById(`element-wrapper-${elementId}`);
    if (!node) return;
    activePreviews.get(node)?.();
    const animations = Array.isArray(input) ? input : [input];
    if (!animations.length) return;
    const restored = animations.map(animation => {
      const layer = Array.from(node.querySelectorAll<HTMLElement>('[data-pwb-animation-id]')).find(el => el.dataset.pwbAnimationId === animation.id) || node;
      return { layer, original: layer.style.animation, animation };
    });
    const stop = () => {
      if (activePreviews.get(node) !== stop) return;
      clearTimeout(timer);
      restored.forEach(({ layer, original }) => { layer.style.animation = original; });
      activePreviews.delete(node);
    };
    activePreviews.set(node, stop);
    restored.forEach(({ layer, animation }) => {
      layer.style.animation = 'none'; void layer.offsetWidth;
      layer.style.animation = `${animation.name} ${animation.duration}s ${animation.easing || 'ease'} ${animation.delay}s ${animation.iterationCount || 1} both`;
    });
    const length = Math.max(...animations.map(a => a.delay + a.duration * (a.iterationCount === 'infinite' ? 2 : a.iterationCount || 1)));
    const timer = setTimeout(stop, length * 1000 + 150);
    cleanup.current = stop;
  };
}

export function AnimationSettings({ animation, language, onChange, compact = false }: {
  animation: Animation; language: Language; onChange: (patch: Partial<Animation>) => void; compact?: boolean;
}) {
  const number = (key: 'duration' | 'delay', value: string) => {
    const parsed = Number(value);
    if (value !== '' && Number.isFinite(parsed) && parsed >= 0) onChange({ [key]: parsed });
  };
  const field = 'animation-field';
  return <div className={compact ? 'animation-settings compact' : 'animation-settings'}>
    <label className={compact ? field : `${field} col-span-2`}>
      <span><MousePointer2 size={10} />{t('Start', language)}</span>
      <select value={animation.trigger} onChange={e => onChange({ trigger: e.target.value as Animation['trigger'] })}>
        {(['onClick','onLoad','onScroll','onHover'] as const).map((value, i) => <option key={value} value={value}>{t(['On Click','On Load','On Scroll','On Hover'][i], language)}</option>)}
      </select>
    </label>
    <label className={field}><span><Clock3 size={10} />{t(compact ? 'Duration Short' : 'Duration', language)} · {t('Seconds', language)}</span>
      <input aria-label={t('Duration', language)} type="number" min="0" step="0.1" value={animation.duration} onChange={e => number('duration', e.target.value)} />
    </label>
    <label className={field}><span><Clock3 size={10} />{t('Delay', language)} · {t('Seconds', language)}</span>
      <input aria-label={t('Delay', language)} type="number" min="0" step="0.1" value={animation.delay} onChange={e => number('delay', e.target.value)} />
    </label>
    <label className={field}><span>{t('Easing', language)}</span>
      <select value={animation.easing || 'ease'} onChange={e => onChange({ easing: e.target.value as Animation['easing'] })}>
        {['ease','ease-in','ease-out','ease-in-out','linear','cubic-bezier(0.34,1.56,0.64,1)'].map((value, i) => <option key={value} value={value}>{t(['Smooth','Accelerate','Decelerate','Soft start and end','Linear','Spring'][i], language)}</option>)}
      </select>
    </label>
    <label className={field}><span><Repeat2 size={10} />{t('Repeat', language)}</span>
      <select value={String(animation.iterationCount ?? 1)} onChange={e => onChange({ iterationCount: e.target.value === 'infinite' ? 'infinite' : Number(e.target.value) })}>
        {typeof animation.iterationCount === 'number' && ![1,2,3,5].includes(animation.iterationCount) && <option value={animation.iterationCount}>{animation.iterationCount}×</option>}
        {[1,2,3,5].map(n => <option key={n} value={n}>{n}×</option>)}<option value="infinite">∞ {t('Continuously', language)}</option>
      </select>
    </label>
  </div>;
}
