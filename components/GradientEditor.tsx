import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface GradientStop {
  id: string;
  offset: number; // 0-100
  color: string;
  opacity: number; // 0-1
}

interface GradientEditorProps {
  initialValue?: string;
  onClose: () => void;
  onApply: (css: string) => void;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({ initialValue, onClose, onApply }) => {
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<GradientStop[]>([
    { id: '1', offset: 0, color: '#ffffff', opacity: 1 },
    { id: '2', offset: 100, color: '#000000', opacity: 1 }
  ]);
  const [activeStopId, setActiveStopId] = useState<string>('1');

  const sliderRef = useRef<HTMLDivElement>(null);

  // Helper to generate CSS string
  const generateCSS = () => {
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
    const stopStr = sortedStops.map(s => {
        // Convert hex to rgba if needed, but for simplicity we rely on native color inputs which are hex.
        // To support opacity, we need to convert hex + opacity to rgba.
        const r = parseInt(s.color.slice(1, 3), 16);
        const g = parseInt(s.color.slice(3, 5), 16);
        const b = parseInt(s.color.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${s.opacity}) ${s.offset}%`;
    }).join(', ');

    if (type === 'linear') {
        return `linear-gradient(${angle}deg, ${stopStr})`;
    } else {
        return `radial-gradient(circle, ${stopStr})`;
    }
  };

  const activeStop = stops.find(s => s.id === activeStopId) || stops[0];

  const updateStop = (id: string, updates: Partial<GradientStop>) => {
      setStops(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleAddStop = () => {
      const newId = Math.random().toString(36).substring(7);
      // Add in the middle or based on active
      const newOffset = 50;
      setStops([...stops, { id: newId, offset: newOffset, color: '#888888', opacity: 1 }]);
      setActiveStopId(newId);
  };

  const handleDeleteStop = () => {
      if (stops.length <= 2) return;
      const newStops = stops.filter(s => s.id !== activeStopId);
      setStops(newStops);
      setActiveStopId(newStops[0].id);
  };

  // Drag Logic for Stops
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveStopId(id);
      
      const slider = sliderRef.current;
      if (!slider) return;

      const startX = e.clientX;
      const startOffset = stops.find(s => s.id === id)?.offset || 0;
      const width = slider.getBoundingClientRect().width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaPercent = (deltaX / width) * 100;
          let newOffset = Math.max(0, Math.min(100, startOffset + deltaPercent));
          
          setStops(prev => prev.map(s => s.id === id ? { ...s, offset: newOffset } : s));
      };

      const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-[400px] border border-gray-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Gradient Editor</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={16}/></button>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Preview</div>
                    <div 
                        className="w-full h-24 rounded border border-gray-300 dark:border-slate-600 checkerboard-bg"
                        style={{ backgroundImage: generateCSS() }}
                    />
                </div>
            </div>

            <div className="mb-6">
                <div className="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>Gradient Stops</span>
                    <div className="flex gap-2">
                        <button onClick={handleAddStop} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-brand-600"><Plus size={12}/></button>
                        <button onClick={handleDeleteStop} disabled={stops.length <= 2} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-red-500 disabled:opacity-30"><Trash2 size={12}/></button>
                    </div>
                </div>
                {/* Slider Track */}
                <div 
                    ref={sliderRef}
                    className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded relative cursor-pointer"
                    onClick={(e) => {
                         // Click to add logic could go here
                    }}
                >
                     {stops.map(stop => (
                         <div
                            key={stop.id}
                            onMouseDown={(e) => handleMouseDown(e, stop.id)}
                            style={{ 
                                left: `${stop.offset}%`, 
                                backgroundColor: stop.color,
                                border: stop.id === activeStopId ? '2px solid white' : '2px solid white',
                                boxShadow: stop.id === activeStopId ? '0 0 0 2px #3b82f6, 0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            className="absolute top-0 -ml-2 w-4 h-6 rounded-sm cursor-ew-resize z-10"
                         />
                     ))}
                </div>
            </div>

            {/* Controls for Active Stop */}
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 dark:bg-slate-800 p-3 rounded">
                <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1">Color</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={activeStop.color}
                            onChange={(e) => updateStop(activeStop.id, { color: e.target.value })}
                            className="h-8 w-10 p-0 border-0 rounded cursor-pointer"
                        />
                        <input 
                            type="text" 
                            value={activeStop.color}
                            onChange={(e) => updateStop(activeStop.id, { color: e.target.value })}
                            className="flex-1 text-xs border border-gray-300 dark:border-slate-600 rounded px-1 bg-white dark:bg-slate-900"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1">Position: {Math.round(activeStop.offset)}%</label>
                    <input 
                        type="range" min="0" max="100" 
                        value={activeStop.offset}
                        onChange={(e) => updateStop(activeStop.id, { offset: parseInt(e.target.value) })}
                        className="w-full accent-brand-600 h-1.5 bg-gray-200 rounded-lg appearance-none"
                    />
                </div>
                 <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1">Opacity: {Math.round(activeStop.opacity * 100)}%</label>
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={activeStop.opacity}
                        onChange={(e) => updateStop(activeStop.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full accent-brand-600 h-1.5 bg-gray-200 rounded-lg appearance-none"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1">Type</label>
                    <select 
                        value={type} onChange={(e) => setType(e.target.value as any)}
                        className="w-full text-xs border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                    >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                    </select>
                </div>
                {type === 'linear' && (
                    <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1">Angle: {angle}°</label>
                        <input 
                            type="range" min="0" max="360"
                            value={angle}
                            onChange={(e) => setAngle(parseInt(e.target.value))}
                            className="w-full accent-brand-600 h-1.5 bg-gray-200 rounded-lg appearance-none"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">Cancel</button>
                <button onClick={() => { onApply(generateCSS()); onClose(); }} className="px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded shadow-sm">Apply Gradient</button>
            </div>
        </div>
    </div>
  );
};