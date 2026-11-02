import React, { useLayoutEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  anchor: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}
/** Non-modal, viewport-bound gallery. Native Tab navigation stays available. */
export function Popover({ anchor, open, onClose, title, width = 440, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [position, setPosition] = useState({ left: 12, top: 12, width, maxHeight: 480 });
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const zoom = Number(getComputedStyle(document.body).zoom) || 1;
      const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom;
      const height = (panel.current?.getBoundingClientRect().height || 420) / zoom;
      const below = vh - rect.bottom / zoom - 12, above = rect.top / zoom - 12;
      const upwards = below < Math.min(height, 260) && above > below;
      const maxHeight = Math.max(80, upwards ? above - 8 : below - 8);
      setPosition({ left: Math.max(12, Math.min(rect.left / zoom, vw - Math.min(width, vw - 24) - 12)),
        top: upwards ? Math.max(12, rect.top / zoom - Math.min(height, maxHeight) - 8) : rect.bottom / zoom + 8,
        width: Math.min(width, vw - 24), maxHeight });
    };
    place();
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); anchor.current?.focus(); }
    };
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('button')?.focus());
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key, true); window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, width, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={panel} dir={anchor.current?.closest('[dir]')?.getAttribute('dir')||'ltr'} role="dialog" aria-labelledby={titleId} style={position}
      className="editor-shell editor-popover fixed z-[10000] flex flex-col bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
      onKeyDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0">
        <h3 id={titleId} className="text-xs font-semibold">{title}</h3>
        <button type="button" onClick={() => { onClose(); anchor.current?.focus(); }} aria-label="Close" className="editor-icon-button"><X size={15} /></button>
      </div>
      <div className="overflow-y-auto min-h-0 p-3">{children}</div>
    </div>, document.body,
  );
}
