// components/LayersPanel.tsx — Layer management panel using atomic store actions

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, GripVertical } from 'lucide-react';
import { t } from '../utils/localization';
import { useEditorStore } from '../store/useEditorStore';

export const LayersPanel = React.memo(() => {
  const {
    project, activeLayerId, language,
    addLayer, deleteLayer, selectLayer,
    toggleLayerVisibility, toggleLayerLock,
    renameLayer, reorderLayers, setHoveredLayer,
    setShowLayers,
  } = useEditorStore();

  const activePage = project.pages.find(p => p.id === project.activePageId);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  if (!activePage) return null;

  // Display front-to-back (reversed from storage order)
  const displayLayers = [...activePage.layers].reverse();

  const startEditing = (id: string, name: string) => { setEditingLayerId(id); setTempName(name); };
  const saveName = () => { if (editingLayerId) { renameLayer(editingLayerId, tempName); setEditingLayerId(null); } };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('layerIndex', index.toString());
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('layerIndex'), 10);
    if (!isNaN(dragIndex)) reorderLayers(dragIndex, dropIndex);
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-300 border-l border-gray-300 dark:border-slate-800 flex flex-col h-full shadow-xl z-30 select-none transition-colors">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center text-xs font-medium">
        <span>{t('Layers', language)}</span>
        <button onClick={() => setShowLayers(false)} className="hover:text-black dark:hover:text-white">&times;</button>
      </div>

      {/* Toolbar */}
      <div className="px-2 py-1 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex space-x-1">
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded" title="New Layer" onClick={addLayer}>
          <Plus size={14} />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded" title="Delete Layer" onClick={deleteLayer}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {displayLayers.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div key={layer.id}
              onClick={() => selectLayer(layer.id)}
              onDoubleClick={() => startEditing(layer.id, layer.name)}
              onMouseEnter={() => setHoveredLayer(layer.id)}
              onMouseLeave={() => setHoveredLayer(null)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center px-2 py-1 border-b border-gray-100 dark:border-slate-800 cursor-pointer group transition-colors ${isActive ? 'bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
            >
              <div className="mr-1 text-gray-300 dark:text-slate-600 cursor-grab hover:text-gray-500">
                <GripVertical size={12} />
              </div>

              <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                className={`p-1 mr-1 ${layer.visible ? 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300' : 'text-gray-600 dark:text-slate-400'}`}>
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                className={`p-1 mr-1 ${layer.locked ? 'text-gray-600 dark:text-slate-300' : 'text-transparent group-hover:text-gray-400 dark:group-hover:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}>
                {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>

              <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 mr-2 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px' }} />
                {layer.elements.length > 0 && <div className="w-4 h-4 bg-gray-400 dark:bg-slate-500 rounded-sm" />}
              </div>

              <div className="flex-1 min-w-0">
                {editingLayerId === layer.id ? (
                  <input autoFocus value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs px-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-brand-300 rounded outline-none"
                  />
                ) : (
                  <div className="truncate text-xs font-medium text-gray-700 dark:text-slate-300">
                    {layer.name}
                    {layer.elements.length > 0 && <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-2">({layer.elements.length})</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2 text-[10px] text-gray-500 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        {activePage.layers.length} {t('Layers', language)}
      </div>
    </div>
  );
});
