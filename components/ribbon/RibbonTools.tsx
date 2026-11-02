import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/localization';
import { visibleRibbonGroupCount } from '../../utils/ribbonLayout';
import { Popover } from '../ui/Popover';

function OverflowGroups({ indices, children }: { indices: number[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    (Array.from(ref.current?.children || []) as HTMLElement[]).filter(child => child.classList.contains('ribbon-group')).forEach((child, index) => {
      (child as HTMLElement).style.display = indices.includes(index) ? '' : 'none';
    });
  }, [indices, children]);
  return <div ref={ref} className="ribbon-overflow-menu">{children}</div>;
}

/** Measure without removing groups: the overflowed copies retain their natural widths. */
export const RibbonTools: React.FC<{ children: React.ReactNode; layoutKey: string; language: Language }> = ({ children, layoutKey, language }) => {
  const row = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLButtonElement>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useLayoutEffect(() => {
    const node = row.current;
    if (!node) return;
    let alive = true, frame = 0;
    const measure = () => {
      if (!alive) return;
      const groups = (Array.from(node.children) as HTMLElement[]).filter(child => child.classList.contains('ribbon-group'));
      const visible = visibleRibbonGroupCount(groups.map(group => group.getBoundingClientRect().width), node.getBoundingClientRect().width);
      groups.forEach((group, i) => {
        group.style.visibility = i < visible ? '' : 'hidden';
        group.inert = i >= visible;
      });
      const indices = groups.map((_, i) => i).filter(i => i >= visible);
      setHidden(current => current.length === indices.length && current.every((value, i) => value === indices[i]) ? current : indices);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const resize = new ResizeObserver(schedule);
    resize.observe(node);
    const changes = new MutationObserver(schedule);
    changes.observe(node, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(() => { if (alive) schedule(); });
    return () => { alive = false; cancelAnimationFrame(frame); resize.disconnect(); changes.disconnect(); };
  }, [layoutKey]);
  useEffect(() => { close(); }, [layoutKey, close]);
  useEffect(() => { if (!hidden.length) close(); }, [hidden, close]);
  return <>
    <div ref={row} className="ribbon-tools-row">{children}</div>
    <button ref={anchor} type="button" className="ribbon-overflow-button" disabled={!hidden.length}
      style={{ visibility: hidden.length ? 'visible' : 'hidden' }}
      onClick={() => setOpen(current => !current)} aria-expanded={open} aria-haspopup="dialog"
      aria-label={t('More Tools', language)} title={t('More Tools', language)}>
      <MoreHorizontal size={21} /><span>{t('More', language)}</span>
    </button>
    <Popover anchor={anchor} open={open && !!hidden.length} onClose={close} title={t('More Tools', language)} width={560}>
      <OverflowGroups indices={hidden}>{children}</OverflowGroups>
    </Popover>
  </>;
};
