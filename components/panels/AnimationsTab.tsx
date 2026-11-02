import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Plus, Play, Trash2, Layers } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { generateId } from '../../store/helpers';
import { ANIMATION_PRESETS, CanvasElement, Animation } from '../../types';
import { Popover } from '../ui/Popover';
import { AnimationGallery, AnimationIcon, AnimationSettings, useAnimationPreview } from '../animations/AnimationUI';

export const AnimationsTab: React.FC<{ element: CanvasElement }> = ({ element }) => {
  const { language, updateElementProp, beginTransaction, commitTransaction } = useEditorStore();
  const [expanded, setExpanded] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setExpanded(false), []);
  const preview = useAnimationPreview(element.id);
  const animations = element.animations || [];
  const commitList = (next: Animation[]) => {
    commitTransaction(); beginTransaction('Animation list');
    updateElementProp('animations', next); commitTransaction();
  };
  const add = (name: string) => {
    commitList([...animations, { id: generateId(), name, trigger: animations[animations.length - 1]?.trigger || 'onLoad', duration: 0.8, delay: 0, easing: 'ease-out', iterationCount: 1 }]); close();
  };
  const update = (id: string, patch: Partial<Animation>) => updateElementProp('animations', animations.map(a => a.id === id ? { ...a, ...patch } : a));
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-xs font-semibold">{t('Applied', language)} <span className="text-gray-400 font-normal">{animations.length ? `(${animations.length})` : ''}</span></h4>
      <button type="button" ref={anchor} className="editor-add-button" aria-haspopup="dialog" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}><Plus size={13} />{t('Add', language)}</button>
    </div>
    {animations.length > 1 && <button type="button" className="editor-add-button w-full justify-center" onClick={() => preview(animations)}><Layers size={13} />{t('Preview All Animations', language)}</button>}
    {!animations.length && <div className="animation-empty">
      <span className="animation-empty-icon"><Sparkles size={26} strokeWidth={1.4} /></span>
      <p className="text-xs font-medium">{t('No animations added', language)}</p>
      <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed mt-1">{t('Choose an effect from the gallery', language)}</p>
      <button type="button" className="gallery-more mx-auto mt-3" onClick={() => setExpanded(true)}>{t('Animation Gallery', language)}</button>
    </div>}
    {animations.map((animation, index) => <section key={animation.id} className="animation-card">
      <header className="flex items-center gap-2 mb-3">
        <span className="animation-number">{index + 1}</span>
        <span className="text-brand-600 dark:text-brand-400"><AnimationIcon name={animation.name} size={16} /></span>
        <h5 className="flex-1 min-w-0 text-[11px] font-semibold truncate" title={t(ANIMATION_PRESETS.find(p => p.key === animation.name)?.name || animation.name, language)}>{t(ANIMATION_PRESETS.find(p => p.key === animation.name)?.name || animation.name, language)}</h5>
        <button type="button" className="editor-icon-button" title={t('Preview', language)} aria-label={t('Preview', language)} onClick={() => preview(animation)}><Play size={13} /></button>
        <button type="button" className="editor-icon-button" title={t('Delete', language)} aria-label={t('Delete', language)} onClick={() => commitList(animations.filter(a => a.id !== animation.id))}><Trash2 size={13} /></button>
      </header>
      <label className="animation-field mb-3"><span>{t('Effect', language)}</span><select value={animation.name} onChange={e => update(animation.id, { name: e.target.value })}>
        {['Entrance','Attention','Continuous','Exit'].map(category => <optgroup key={category} label={t(category, language)}>{ANIMATION_PRESETS.filter(p => p.category === category).map(p => <option key={p.key} value={p.key}>{t(p.name, language)}</option>)}</optgroup>)}
        {!ANIMATION_PRESETS.some(p => p.key === animation.name) && <option value={animation.name}>{animation.name}</option>}
      </select></label>
      <AnimationSettings animation={animation} language={language} onChange={patch => update(animation.id, patch)} />
    </section>)}
    <Popover anchor={anchor} open={expanded} onClose={close} title={t('Animation Gallery', language)} width={440}><AnimationGallery language={language} onSelect={add} applied={animations} categoryTabs /></Popover>
  </div>;
};
