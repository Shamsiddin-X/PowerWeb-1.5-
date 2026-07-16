import React from 'react';
import { ChevronDown } from 'lucide-react';

// Shared ribbon UI primitives used by all tab components

export const RibbonGroup = React.memo(({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex flex-col h-full px-2 border-r border-gray-200 dark:border-slate-700 items-center justify-between py-1 relative group/ribbon">
    <div className="flex flex-row items-center justify-center space-x-1 h-full">
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
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-1 min-w-[3.5rem] w-auto px-2 h-full rounded transition-all disabled:opacity-40 disabled:hover:bg-transparent group relative
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

export const ShapeButton = React.memo(({ type, label, icon: Icon, onClick }: any) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(type); }}
    className="flex flex-col items-center justify-center p-2 hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg border border-transparent hover:border-brand-100 dark:hover:border-slate-600 transition-all group"
    title={label}
  >
    <div className="w-8 h-8 flex items-center justify-center mb-1 bg-white dark:bg-slate-800 rounded border border-gray-100 dark:border-slate-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
      {Icon ? <Icon size={18} className="dark:text-slate-300" /> : <div className={`w-4 h-4 bg-gray-400 dark:bg-slate-500 group-hover:bg-brand-500 ${type === 'circle' ? 'rounded-full' : ''}`} />}
    </div>
    <span className="text-[10px] text-center w-full truncate text-gray-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400">{label}</span>
  </button>
));

export const CompactInput = React.memo(({ value, onChange, type = "number", width = "w-12", icon: Icon }: any) => (
  <div className={`flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded px-1 h-6 ${width}`}>
    {Icon && <Icon size={10} className="text-gray-400 mr-1" />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full bg-transparent text-xs outline-none text-gray-700 dark:text-slate-200 font-mono text-center"
    />
  </div>
));

// --- FLAG ICONS (SVG) ---
export const FlagTJ = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" className={`${className || 'w-6 h-6'} shadow-sm object-cover`}>
    <rect width="500" height="250" fill="#fff"/>
    <rect width="500" height="71.4" fill="#CC0000"/>
    <rect y="178.6" width="500" height="71.4" fill="#006600"/>
    <circle cx="250" cy="125" r="45" fill="#F8C400" />
  </svg>
);

export const FlagRU = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className={`${className || 'w-6 h-6'} shadow-sm object-cover`}>
    <rect fill="#fff" width="9" height="3"/>
    <rect fill="#d52b1e" y="3" width="9" height="3"/>
    <rect fill="#0039a6" y="2" width="9" height="2"/>
  </svg>
);

export const FlagUK = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={`${className || 'w-6 h-6'} shadow-sm object-cover`}>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#00247d"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#cf142b" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6"/>
  </svg>
);
