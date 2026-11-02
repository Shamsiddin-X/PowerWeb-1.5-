import React, { useState, useRef, useCallback } from 'react';
import { Play, Trash2, Sparkles, Plus, Layers } from 'lucide-react';
import { ANIMATION_PRESETS, Animation, Language } from '../../types';
import { RibbonGroup, BigButton } from './RibbonShared';
import { generateId } from '../../store/helpers';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import { t } from '../../utils/localization';
import { Popover } from '../ui/Popover';
import { AnimationGallery, AnimationSettings, useAnimationPreview } from '../animations/AnimationUI';

const AnimationEditor = React.memo(({ animation, index, language, onChange, onDelete, onPreview, onPreviewAll }: {
  animation: Animation; index: number; language: Language;
  onChange: (id: string, patch: Partial<Animation>) => void;
  onDelete: (id: string) => void; onPreview: (animation: Animation) => void; onPreviewAll?: () => void;
}) => (
  <RibbonGroup label={`${t('Animation', language)} ${index + 1}`}>
    <div className="ribbon-animation-settings flex flex-col justify-center gap-1.5" data-animation-editor={animation.id} role="group" aria-label={`${t('Animation', language)} ${index + 1}`}>
      <div className="animation-editor-toolbar flex items-center gap-1">
        <span className="animation-number">{index + 1}</span>
        <select aria-label={`${t('Effect', language)} ${index + 1}`} value={animation.name}
          onChange={e => onChange(animation.id, { name: e.target.value })} className="animation-applied-select min-w-0 flex-1">
          {['Entrance', 'Attention', 'Continuous', 'Exit'].map(category => <optgroup key={category} label={t(category, language)}>
            {ANIMATION_PRESETS.filter(p => p.category === category).map(p => <option key={p.key} value={p.key}>{t(p.name, language)}</option>)}
          </optgroup>)}
          {!ANIMATION_PRESETS.some(p => p.key === animation.name) && <option value={animation.name}>{animation.name}</option>}
        </select>
        {onPreviewAll && <button type="button" className="editor-icon-button" title={t('Preview All Animations', language)} aria-label={t('Preview All Animations', language)} onClick={onPreviewAll}><Layers size={14} /></button>}
        <button type="button" className="editor-icon-button" title={t('Preview', language)} aria-label={`${t('Preview', language)} ${index + 1}`} onClick={() => onPreview(animation)}><Play size={14} /></button>
        <button type="button" className="editor-icon-button" title={t('Delete', language)} aria-label={`${t('Delete', language)} ${index + 1}`} onClick={() => onDelete(animation.id)}><Trash2 size={14} /></button>
      </div>
      <AnimationSettings compact animation={animation} language={language} onChange={patch => onChange(animation.id, patch)} />
    </div>
  </RibbonGroup>
));

export const RibbonAnimations = React.memo(() => {
  const { updateElementProp, beginTransaction, commitTransaction, language } = useEditorStore();
  const element = useSelectedElement();
  const [expanded, setExpanded] = useState(false);
  const [gallerySource, setGallerySource] = useState<'main' | 'append'>('main');
  const appendAnchor = useRef<HTMLButtonElement>(null);
  const anchor = useRef<HTMLButtonElement>(null);
  const toggleGallery = (source: 'main' | 'append') => {
    setGallerySource(source); setExpanded(current => source === gallerySource ? !current : true);
  };
  const close = useCallback(() => setExpanded(false), []);
  const preview = useAnimationPreview(element?.id || '');
  if (!element) return null;
  const animations = element.animations || [];
  const commitList = (next: Animation[]) => {
    commitTransaction(); beginTransaction('Animation list');
    updateElementProp('animations', next); commitTransaction();
  };
  const add = (name: string) => {
    commitList([...animations, { id: generateId(), name, trigger: animations[animations.length - 1]?.trigger || 'onScroll', duration: 0.8, delay: 0, easing: 'ease-out', iterationCount: 1 }]); close();
  };
  const update = (id: string, patch: Partial<Animation>) => updateElementProp('animations', animations.map(a => a.id === id ? { ...a, ...patch } : a));
  return <>
    <RibbonGroup label={t('Animations', language)}>
      <BigButton refProp={anchor} icon={Sparkles} label={t('Add Effect', language)} dropdown active={expanded && gallerySource === 'main'} onClick={() => toggleGallery('main')} />
    </RibbonGroup>
    {animations.map((animation, index) => <AnimationEditor key={animation.id} animation={animation} index={index} language={language}
      onChange={update} onDelete={id => commitList(animations.filter(a => a.id !== id))} onPreview={preview} onPreviewAll={index === 0 && animations.length > 1 ? () => preview(animations) : undefined} />)}
    {!animations.length && <RibbonGroup label={t('Applied', language)}><div className="ribbon-animation-settings ribbon-empty">{t('Choose an effect from the gallery', language)}</div></RibbonGroup>}
    <RibbonGroup label={t('Add', language)}>
      <BigButton refProp={appendAnchor} icon={Plus} label={t(animations.length ? 'Add Another Animation' : 'Add Animation', language)} dropdown active={expanded && gallerySource === 'append'} onClick={() => toggleGallery('append')} />
    </RibbonGroup>
    <Popover anchor={gallerySource === 'append' ? appendAnchor : anchor} open={expanded} onClose={close} title={t('Animation Gallery', language)} width={560}>
      <AnimationGallery language={language} onSelect={add} applied={animations} categoryTabs />
    </Popover>
  </>;
});
