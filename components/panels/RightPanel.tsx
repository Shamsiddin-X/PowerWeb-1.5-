// components/panels/RightPanel.tsx — Tab router: Properties | Interactions | Animations | Page Settings

import React, { useState, useEffect } from 'react';
import { Palette, Zap, Film, X } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { PropertiesTab } from './PropertiesTab';
import { InteractionsTab } from './InteractionsTab';
import { AnimationsTab } from './AnimationsTab';
import { PageSettings } from './PageSettings';

type PanelTab = 'properties' | 'interactions' | 'animations';

const INPUT_CLASS = 'w-full text-xs px-2 py-1 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:border-brand-500 outline-none';
const LABEL_CLASS = 'text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-0.5 block tracking-wider';

export const RightPanel = React.memo(() => {
  const { project, selectedElementIds, language, setShowRightPanel } = useEditorStore();
  const [activeTab, setActiveTab] = useState<PanelTab>('properties');

  // Resolve selected element
  const selectedPage = project.pages.find(p => p.id === project.activePageId);
  let selectedElement = null as any;
  if (selectedPage && selectedElementIds.length > 0) {
    for (const layer of selectedPage.layers) {
      const found = layer.elements.find(el => el.id === selectedElementIds[0]);
      if (found) { selectedElement = found; break; }
    }
  }

  // Reset pickers when selection changes
  useEffect(() => { setActiveTab('properties'); }, [selectedElementIds, project.activePageId]);

  const TABS = [
    { id: 'properties' as PanelTab, label: t('Props', language), icon: <Palette size={12} /> },
    { id: 'interactions' as PanelTab, label: t('Logic', language), icon: <Zap size={12} /> },
    { id: 'animations' as PanelTab, label: t('Anim', language), icon: <Film size={12} /> },
  ];

  return (
    <div className="editor-properties w-64 bg-white dark:bg-slate-900 border-l border-gray-300 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-colors">
      {/* No element selected → Page Settings */}
      {!selectedElement ? (
        <PageSettings onClose={() => setShowRightPanel(false)} />
      ) : (
        <>
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 items-center pr-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? 'text-brand-600 bg-white dark:bg-slate-900 border-b-2 border-brand-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={() => setShowRightPanel(false)} className="p-1 text-gray-400 hover:text-gray-600 ml-1">
              <X size={14} />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {activeTab === 'properties' && (
              <PropertiesTab element={selectedElement} inputClass={INPUT_CLASS} labelClass={LABEL_CLASS} />
            )}
            {activeTab === 'interactions' && (
              <InteractionsTab element={selectedElement} inputClass={INPUT_CLASS} labelClass={LABEL_CLASS} />
            )}
            {activeTab === 'animations' && (
              <AnimationsTab element={selectedElement} />
            )}
          </div>
        </>
      )}
    </div>
  );
});
