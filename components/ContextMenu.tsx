import React, { useState } from 'react';
import { 
  Scissors, Copy, Clipboard, Trash2, 
  ArrowUp, ArrowDown, CopyPlus,
  Palette, PaintBucket, Pen, Link, X, Droplets
} from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

const PRESET_COLORS = [
  'transparent', '#ffffff', '#000000', '#334155',
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#d946ef', '#f43f5e', '#881337'
];

export const ContextMenu: React.FC = () => {
  const { 
    contextMenu, closeContextMenu, 
    cutSelected, copySelected, pasteElements, duplicateSelected,
    bringToFront, sendToBack, deleteSelected, 
    updateElementStyle, updateElementStyleBulk,
    renamePage, duplicatePage, deletePage
  } = useEditorStore();

  const [activeTool, setActiveTool] = useState<'none' | 'fill' | 'stroke'>('none');

  if (!contextMenu.visible) return null;

  const handleAction = (e: React.MouseEvent, action: string, value?: any) => {
    e.stopPropagation();
    
    // Element actions
    if (action === 'cut') cutSelected();
    if (action === 'copy') copySelected();
    if (action === 'paste') pasteElements();
    if (action === 'duplicate') duplicateSelected();
    if (action === 'bringToFront') bringToFront();
    if (action === 'sendToBack') sendToBack();
    if (action === 'delete') deleteSelected();

    // Style actions
    if (action === 'set_fill' && value) updateElementStyle('fill', value);
    if (action === 'set_stroke' && value) updateElementStyle('stroke', value);
    
    if (action === 'quick_style') {
      updateElementStyleBulk({ shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' });
    }
    
    if (action === 'glassify') {
      updateElementStyleBulk({ 
        fill: 'rgba(0, 0, 0, 0.7)',
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1,
        backdropBlur: 20,
        opacity: 1,
        shadowBlur: 30,
        shadowColor: 'rgba(0,0,0,0.3)'
      });
    }

    // Page actions
    if (action === 'rename_page' && contextMenu.elementId) {
      const newName = prompt('Enter new page name:');
      if (newName) renamePage(contextMenu.elementId, newName);
    }
    if (action === 'duplicate_page' && contextMenu.elementId) {
      duplicatePage(contextMenu.elementId);
    }
    if (action === 'delete_page' && contextMenu.elementId) {
      if (confirm('Are you sure you want to delete this page?')) {
        deletePage(contextMenu.elementId);
      }
    }

    closeContextMenu();
  };

  const toggleTool = (e: React.MouseEvent, tool: 'fill' | 'stroke') => {
    e.stopPropagation();
    setActiveTool(activeTool === tool ? 'none' : tool);
  };

  // === PAGE CONTEXT MENU ===
  if (contextMenu.type === 'page') {
      return (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 w-56 select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
            <div className="flex flex-col text-sm text-gray-700 dark:text-slate-200 py-1">
                <button onClick={(e) => handleAction(e, 'rename_page', contextMenu.elementId)} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
                    <Pen size={16} className="text-gray-500 dark:text-slate-400" />
                    <span>Переименовать</span>
                </button>
                <button onClick={(e) => handleAction(e, 'duplicate_page', contextMenu.elementId)} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
                    <CopyPlus size={16} className="text-gray-500 dark:text-slate-400" />
                    <span>Дублировать</span>
                </button>
                <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                <button onClick={(e) => handleAction(e, 'delete_page', contextMenu.elementId)} className="flex items-center px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 gap-3 text-left">
                    <Trash2 size={16} />
                    <span>Удалить страницу</span>
                </button>
            </div>
        </div>
      );
  }

  // === ELEMENT CONTEXT MENU (DEFAULT) ===
  return (
    <div 
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 w-64 select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Visual Quick Actions Header */}
      <div className="flex items-center justify-around px-2 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
           
           {/* Quick Style */}
           <button onClick={(e) => handleAction(e, 'quick_style')} className="flex flex-col items-center p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all group w-14" title="Стиль (Тень)">
                <Palette size={18} className="text-gray-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-1" />
                <span className="text-[9px] text-gray-500 dark:text-slate-500">Стиль</span>
           </button>

           {/* Glassify (New) */}
           <button onClick={(e) => handleAction(e, 'glassify')} className="flex flex-col items-center p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all group w-14" title="Glassify">
                <Droplets size={18} className="text-gray-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-1" />
                <span className="text-[9px] text-gray-500 dark:text-slate-500">Стекло</span>
           </button>

           {/* Fill Tool Toggle */}
           <button 
                onClick={(e) => toggleTool(e, 'fill')} 
                className={`flex flex-col items-center p-1.5 rounded transition-all group w-14 ${activeTool === 'fill' ? 'bg-white dark:bg-slate-700 shadow-sm ring-1 ring-brand-200 dark:ring-slate-600' : 'hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`} 
                title="Заливка"
           >
                <PaintBucket size={18} className={`${activeTool === 'fill' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-slate-400'} mb-1`} />
                <div className="h-1 w-8 bg-gradient-to-r from-red-400 to-blue-400 rounded-full opacity-50"></div>
           </button>

           {/* Stroke Tool Toggle */}
           <button 
                onClick={(e) => toggleTool(e, 'stroke')} 
                className={`flex flex-col items-center p-1.5 rounded transition-all group w-14 ${activeTool === 'stroke' ? 'bg-white dark:bg-slate-700 shadow-sm ring-1 ring-brand-200 dark:ring-slate-600' : 'hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`} 
                title="Контур"
           >
                <Pen size={18} className={`${activeTool === 'stroke' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-slate-400'} mb-1`} />
                <div className="h-1 w-8 border-t-2 border-dashed border-gray-400 mt-1"></div>
           </button>
      </div>

      {/* --- COLOR PALETTE (Conditional) --- */}
      {activeTool !== 'none' && (
          <div className="bg-gray-100 dark:bg-slate-900 p-3 border-b border-gray-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-150">
              <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 flex justify-between items-center">
                  <span>Выберите цвет {activeTool === 'fill' ? 'заливки' : 'контура'}</span>
                  <button onClick={() => setActiveTool('none')} className="hover:text-red-500"><X size={10}/></button>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                  {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={(e) => handleAction(e, activeTool === 'fill' ? 'set_fill' : 'set_stroke', color)}
                        className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 shadow-sm hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500 relative"
                        style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                        title={color}
                      >
                          {color === 'transparent' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-px bg-red-500 rotate-45"></div>
                              </div>
                          )}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Standard Actions List */}
      <div className="flex flex-col text-sm text-gray-700 dark:text-slate-200 py-1">
        
        <button onClick={(e) => handleAction(e, 'hyperlink')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
          <Link size={16} className="text-gray-500 dark:text-slate-400" />
          <span>Гиперссылка...</span>
        </button>
        
        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

        <button onClick={(e) => handleAction(e, 'cut')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
          <Scissors size={16} className="text-gray-500 dark:text-slate-400" />
          <span>Вырезать</span>
        </button>
        
        <button onClick={(e) => handleAction(e, 'copy')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
          <Copy size={16} className="text-gray-500 dark:text-slate-400" />
          <span>Копировать</span>
        </button>

        <button onClick={(e) => handleAction(e, 'paste')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left border-b border-gray-100 dark:border-slate-700">
          <Clipboard size={16} className="text-gray-500 dark:text-slate-400" />
          <span>Вставить</span>
        </button>
        
        <button onClick={(e) => handleAction(e, 'duplicate')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left">
          <CopyPlus size={16} className="text-gray-500 dark:text-slate-400" />
          <span>Дублировать</span>
        </button>

        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

        <button onClick={(e) => handleAction(e, 'bringToFront')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left group">
          <ArrowUp size={16} className="text-gray-500 dark:text-slate-400" />
          <div className="flex flex-col">
            <span>На передний план</span>
          </div>
        </button>

        <button onClick={(e) => handleAction(e, 'sendToBack')} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 text-left border-b border-gray-100 dark:border-slate-700">
          <ArrowDown size={16} className="text-gray-500 dark:text-slate-400" />
          <span>На задний план</span>
        </button>

        <button onClick={(e) => handleAction(e, 'delete')} className="flex items-center px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 gap-3 text-left">
          <Trash2 size={16} />
          <span>Удалить</span>
        </button>

      </div>
    </div>
  );
};