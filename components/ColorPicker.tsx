import React from 'react';
import { Droplets, Minus, Pipette, Image as ImageIcon, BoxSelect } from 'lucide-react';

interface ColorPickerProps {
  onChange: (color: string) => void;
  onOpenGradient?: () => void;
  currentColor: string;
  allowGradient?: boolean;
}

const THEME_COLORS = [
  // White/Black/Grays
  ['#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#a6a6a6', '#7f7f7f'],
  ['#000000', '#262626', '#4d4d4d', '#737373', '#808080', '#999999'],
  // Blues
  ['#e7f3ff', '#cce6ff', '#99ccff', '#66b2ff', '#3399ff', '#007fff'],
  ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
  // Oranges
  ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316'],
  // Grays/BlueGrays
  ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569'],
  // Yellows
  ['#fefce8', '#fef9c3', '#fde047', '#facc15', '#eab308', '#ca8a04'],
  // Light Blues
  ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
  // Greens
  ['#f0fdf4', '#dcfce7', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
  // Purples
  ['#faf5ff', '#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea'],
];

const STANDARD_COLORS = [
  '#dc2626', // Red
  '#ef4444', 
  '#f59e0b', // Orange
  '#facc15', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#1e3a8a', // Navy
  '#7c3aed', // Violet
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ onChange, onOpenGradient, currentColor, allowGradient = true }) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 shadow-xl rounded-md p-2 w-64 select-none z-50">
      <h3 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-2">Theme Colors</h3>
      
      {/* Theme Grid */}
      <div className="grid grid-cols-10 gap-1 mb-4">
        {THEME_COLORS.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1">
            {column.map((color, rowIdx) => (
              <button
                key={rowIdx}
                className="w-5 h-5 border border-gray-200 dark:border-slate-600 hover:scale-110 hover:z-10 hover:shadow-sm transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500"
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-2">Standard Colors</h3>
      <div className="flex gap-1 mb-3 flex-wrap">
        {STANDARD_COLORS.map((color, idx) => (
          <button
            key={idx}
            className="w-5 h-5 border border-gray-200 dark:border-slate-600 hover:scale-110 hover:z-10 hover:shadow-sm transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex flex-col gap-1">
        <button 
            onClick={() => onChange('transparent')}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded w-full text-left"
        >
            <div className="w-5 h-5 border border-gray-300 dark:border-slate-500 bg-white relative flex items-center justify-center">
                <div className="w-full h-px bg-red-500 rotate-45 transform scale-125"></div>
            </div>
            <span>No Fill</span>
        </button>

         {/* Gradient Trigger - Only show if allowed */}
         {allowGradient && onOpenGradient && (
            <button 
                onClick={onOpenGradient}
                className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded w-full text-left group"
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border border-gray-300 dark:border-slate-500 bg-gradient-to-br from-white to-black"></div>
                    <span>Gradient</span>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">›</span>
            </button>
         )}

        <button 
            onClick={() => {}}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded w-full text-left opacity-50 cursor-not-allowed"
        >
            <Droplets size={14} />
            <span>More Colors...</span>
        </button>

        <button 
             onClick={() => {}}
             className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded w-full text-left opacity-50 cursor-not-allowed"
        >
            <Pipette size={14} />
            <span>Eyedropper</span>
        </button>
      </div>
    </div>
  );
};