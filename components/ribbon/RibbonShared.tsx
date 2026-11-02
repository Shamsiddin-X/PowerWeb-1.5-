import React from 'react';
import { ShapeIcon } from '../ui/ShapeIcon';
import { ChevronDown } from 'lucide-react';

// Shared ribbon UI primitives used by all tab components

export const RibbonGroup = React.memo(({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex flex-col px-2 border-r border-gray-200 dark:border-slate-700 items-center justify-between py-1 relative group/ribbon ribbon-group">
    <div className="ribbon-group-tools flex flex-row flex-wrap items-center justify-center gap-1">
      {children}
    </div>
    <div className="text-[9px] text-gray-400 dark:text-slate-500 font-medium text-center w-full truncate px-1 uppercase tracking-wider">
      {label}
    </div>
  </div>
));

export const BigButton = React.memo(({ onClick, icon: Icon, label, active = false, disabled = false, dropdown = false, refProp }: any) => (
  <button
    ref={refProp}
    type="button" title={label} aria-pressed={active}
    aria-haspopup={dropdown ? 'dialog' : undefined} aria-expanded={dropdown ? active : undefined}
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-1 min-w-[3.5rem] w-auto px-2 h-full rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent group relative
      ${active
        ? 'bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-400'
        : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300'}
    `}
  >
    <div className={`mb-1 p-1.5 rounded-full ${active ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}>
      {Icon && <Icon size={20} strokeWidth={1.5} />}
    </div>
    <div className="flex items-center text-[10px] font-medium leading-tight text-center whitespace-nowrap">
      {label}
      {dropdown && <ChevronDown size={10} className="ml-1 opacity-50" />}
    </div>
  </button>
));

export const ShapeButton = React.memo(({ type, label, onClick }: any) => (
  <button type="button" onClick={() => onClick(type)} className="shape-tile shape-tile-icon" title={label} aria-label={label}>
    <ShapeIcon type={type} className="w-7 h-7" />

  </button>
));

export const CompactInput = React.memo(({ value, onChange, type = "number", width = "w-12", icon: Icon }: any) => (
  <div className={`flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-1.5 h-7 ${width}`}>
    {Icon && <Icon size={10} className="text-gray-400 mr-1" />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full bg-transparent text-xs outline-none text-gray-700 dark:text-slate-200 font-mono text-center"
    />
  </div>
));

export { FlagTJ, FlagRU, FlagUK } from '../ui/Flags';
