import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';

import { RibbonHome } from './RibbonHome';
import { RibbonInsert } from './RibbonInsert';
import { RibbonFormat } from './RibbonFormat';
import { RibbonLogic } from './RibbonLogic';
import { RibbonAnimations } from './RibbonAnimations';
import { RibbonView } from './RibbonView';
import { RibbonPlugins } from './RibbonPlugins';

type Tab = 'Home' | 'Insert' | 'Format' | 'Logic' | 'Animations' | 'View' | 'Plugins';

export const Ribbon: React.FC = () => {
  const { theme, toggleTheme, language, selectedElementIds } = useEditorStore();
  const selectedCount = selectedElementIds.length;
  const selectedElement = useSelectedElement();

  const [activeTab, setActiveTab] = useState<Tab>('Home');

  // Auto-switch tabs on selection
  useEffect(() => {
    if (selectedCount > 0) {
      if (activeTab !== 'Format' && activeTab !== 'Logic' && activeTab !== 'Animations') {
        setActiveTab('Format');
      }
    } else {
      if (activeTab === 'Format' || activeTab === 'Logic') {
        setActiveTab('Home');
      }
    }
  }, [selectedCount, activeTab]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-40 relative select-none transition-colors">
      {/* Title Bar */}
      <div className="flex items-center px-4 h-8 bg-brand-600 dark:bg-slate-950 border-b border-brand-700 dark:border-slate-800 justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wider opacity-90">POWERWEB</span>
          <div className="h-3 w-px bg-white/20 mx-1" />
          <span className="text-[10px] opacity-70">Beta 1.5</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1 hover:bg-white/10 rounded">
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex px-2 pt-1 bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        {(['Home', 'Insert', 'Format', 'Logic', 'Animations', 'View', 'Plugins'] as Tab[]).map((tab) => {
          if ((tab === 'Format' || tab === 'Logic') && selectedCount === 0) return null;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium transition-all rounded-t-md mr-1 ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border-t-2 border-brand-500'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800'
              }`}
            >
              {t(tab, language)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="h-[90px] px-2 py-1 flex items-center bg-white dark:bg-slate-800 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {activeTab === 'Home' && <RibbonHome />}
        {activeTab === 'Insert' && <RibbonInsert />}
        {activeTab === 'Format' && selectedElement && <RibbonFormat />}
        {activeTab === 'Logic' && selectedElement && <RibbonLogic />}
        {activeTab === 'Animations' && selectedElement && <RibbonAnimations />}
        {activeTab === 'Animations' && !selectedElement && (
          <div className="flex items-center justify-center flex-1 text-xs text-gray-400 dark:text-slate-500 italic">
            Select an element to add animations
          </div>
        )}
        {activeTab === 'View' && <RibbonView />}
        {activeTab === 'Plugins' && <RibbonPlugins />}
      </div>
    </div>
  );
};
