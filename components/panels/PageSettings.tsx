import { DEFAULT_PAGE_SIZE } from '../../utils/pageDefaults';
// components/panels/PageSettings.tsx — Page dimensions & background panel

import React from 'react';
import { FileText, X } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { ExportPageSettings } from './ExportPageSettings';
import { ColorPicker } from '../ColorPicker';

type ActivePicker = 'pageBackground' | null;

interface Props {
  onClose: () => void;
}

export const PageSettings: React.FC<Props> = ({ onClose }) => {
  const { project, language, updatePageProperty, setShowRightPanel } = useEditorStore();
  const [activePicker, setActivePicker] = React.useState<ActivePicker>(null);
  const [pickerPos, setPickerPos] = React.useState({ x: 0, y: 0 });

  const selectedPage = project.pages.find(p => p.id === project.activePageId);

  const inputClass = 'w-full text-xs px-2 py-1 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:border-brand-500 outline-none';
  const labelClass = 'text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-0.5 block tracking-wider';

  return (
    <>
      <div className="p-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
        <h3 className="font-semibold text-xs text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <FileText size={12} /> {t('Page Settings', language)}
        </h3>
        <button onClick={() => setShowRightPanel(false)} className="text-gray-400 hover:text-gray-600" aria-label={t('Close', language)}><X size={13} /></button>
      </div>

      <div className="p-3 space-y-4 overflow-y-auto flex-1">
        <section>
          <h4 className="text-[10px] font-bold text-gray-900 dark:text-slate-100 mb-2">{t('Dimensions', language)}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>W (px)</label>
              <input type="number" value={selectedPage?.width || DEFAULT_PAGE_SIZE.width}
                onChange={e => updatePageProperty('width', parseInt(e.target.value))}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>H (px)</label>
              <input type="number" value={selectedPage?.height || DEFAULT_PAGE_SIZE.height}
                onChange={e => updatePageProperty('height', parseInt(e.target.value))}
                className={inputClass} />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-gray-900 dark:text-slate-100 mb-2">{t('Background', language)}</h4>
          <div className="relative">
            <label className={labelClass}>{t('Fill', language)}</label>
            <button onClick={e => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setPickerPos({ x: r.left - 200, y: r.bottom + 5 });
              setActivePicker(activePicker ? null : 'pageBackground');
            }} className="flex items-center gap-2 w-full bg-gray-50 dark:bg-slate-800 p-1.5 rounded border border-gray-200 dark:border-slate-700">
              <div className="w-5 h-5 rounded border border-gray-300" style={{ background: selectedPage?.backgroundColor || '#fff' }} />
              <span className="text-[10px] font-mono truncate">{selectedPage?.backgroundColor || '#ffffff'}</span>
            </button>
          </div>
        </section>

        <ExportPageSettings inputClass={inputClass} labelClass={labelClass}/>
        <section>
          <h4 className="text-[10px] font-bold text-gray-900 dark:text-slate-100 mb-2">{t('Transition', language)}</h4>
          <select value={selectedPage?.transition || 'none'}
            onChange={e => updatePageProperty('transition', e.target.value)}
            className={inputClass}>
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="push_left">Push left</option><option value="push_right">Push right</option>
            <option value="push_up">Push up</option><option value="push_down">Push down</option>
            <option value="zoom_in">Zoom in</option><option value="zoom_out">Zoom out</option>
          </select>
          <label className={`${labelClass} mt-2`}>{t('Duration', language)} (s)</label>
          <input type="number" min="0" step="0.1" value={selectedPage?.transitionDuration ?? 0.5} className={inputClass} onChange={e => updatePageProperty('transitionDuration', Number(e.target.value))} />
        </section>
      </div>

      {activePicker && (
        <div className="fixed z-[100]" style={{ top: pickerPos.y, left: pickerPos.x }}>
          <ColorPicker
            currentColor={selectedPage?.backgroundColor || '#fff'}
            onChange={color => { updatePageProperty('backgroundColor', color); setActivePicker(null); }}
            allowGradient
          />
          <div className="fixed inset-0 z-[-1]" onClick={() => setActivePicker(null)} />
        </div>
      )}
    </>
  );
};
