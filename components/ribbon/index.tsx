// components/ribbon/index.tsx — Ribbon tab bar (uses TitleBar component)

import React, { useState, useEffect, useId } from 'react';
import { ChevronsUp, ChevronsDown } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import { RIBBON_PANEL_HEIGHT, resolveRibbonTab, RibbonTab } from '../../utils/ribbonLayout';
import { RibbonTools } from './RibbonTools';
import { TitleBar } from '../titlebar/TitleBar';
import { showStartMenu } from '../../services/editorCommands';

import { RibbonHome } from './RibbonHome';
import { RibbonInsert } from './RibbonInsert';
import { RibbonFormat } from './RibbonFormat';
import { RibbonLogic } from './RibbonLogic';
import { RibbonAnimations } from './RibbonAnimations';
import { RibbonView } from './RibbonView';
import { RibbonShaders } from './RibbonShaders';
import { RibbonPlugins } from './RibbonPlugins';

type Tab = RibbonTab;

const RibbonContents: React.FC<{ tab: Tab }> = ({ tab }) => {
  const selected = useSelectedElement();
  const language = useEditorStore(s => s.language);
  switch (tab) {
    case 'Home': return <RibbonHome />;
    case 'Insert': return <RibbonInsert />;
    case 'Format': return selected ? <RibbonFormat /> : null;
    case 'Logic': return selected ? <RibbonLogic /> : null;
    case 'Animations': return selected ? <RibbonAnimations /> : <div className="ribbon-empty">{t('Select an element to add animations', language)}</div>;
    case 'Shaders': return <RibbonShaders />;
    case 'View': return <RibbonView />;
    case 'Plugins': return <RibbonPlugins />;
  }
};

export const Ribbon: React.FC = () => {
  const language = useEditorStore(s => s.language);

  const selectedElement = useSelectedElement();
  const hasSelection = !!selectedElement;

  const tabId = useId();
  const [activeTab, setActiveTab] = useState<Tab>(hasSelection ? 'Format' : 'Home');
  const expanded=useEditorStore(s=>s.ribbonExpanded),setExpanded=useEditorStore(s=>s.setRibbonExpanded);
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'F1') {
        event.preventDefault(); setExpanded(!useEditorStore.getState().ribbonExpanded);
      }
    };
    window.addEventListener('keydown', toggle);
    return () => window.removeEventListener('keydown', toggle);
  }, []);

  const displayedTab = resolveRibbonTab(activeTab, hasSelection);
  // Only entering/leaving selection changes contextual tabs; user tab choices remain available.
  useEffect(() => {
    setActiveTab(current => hasSelection
      ? (['Logic', 'Animations', 'Shaders'].includes(current) ? current : 'Format')
      : (['Format', 'Logic'].includes(current) ? 'Home' : current));
  }, [hasSelection]);

  return (
    <div className="editor-ribbon flex flex-col bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-40 relative select-none transition-colors">
      <TitleBar />

      {/* Tab Bar */}
      <div className="ribbon-tabbar flex items-end gap-2 px-3 pt-1.5 bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
      <button type="button" onClick={showStartMenu} title={t('Start menu', language)}
        className="shrink-0 px-5 py-1.5 text-xs font-medium rounded-t-lg border-t-2 border-transparent bg-brand-600 text-white hover:bg-brand-700 transition-colors">
        {t('File', language)}
      </button>
      <div className="ribbon-tabs flex flex-wrap flex-1 min-w-0" role="tablist" aria-label={t('Tools', language)} onKeyDown={e => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault(); e.stopPropagation();
        const buttons = Array.from(e.currentTarget.querySelectorAll('button[role="tab"]:not(:disabled)')) as HTMLButtonElement[];
        const current = buttons.indexOf(e.target as HTMLButtonElement);
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1
          : (current + (e.key === 'ArrowRight' ? 1 : -1)*(language==='ar'?-1:1) + buttons.length) % buttons.length;
        buttons[next]?.click(); buttons[next]?.focus();
      }}>
        {(['Home', 'Insert', 'Format', 'Logic', 'Animations', 'Shaders', 'View', 'Plugins'] as Tab[]).map((tab) => {
          const disabled = (tab === 'Format' || tab === 'Logic') && !hasSelection;
          return (
            <button type="button" disabled={disabled} key={tab} onClick={() => { setActiveTab(tab); setExpanded(true); }} onDoubleClick={() => setExpanded(false)}
              id={`${tabId}-${tab}`} role="tab" tabIndex={displayedTab === tab ? 0 : -1} aria-selected={displayedTab === tab} aria-controls={`${tabId}-panel`}
              className={`px-4 py-1.5 text-xs font-medium transition-colors rounded-t-lg mr-1 border-t-2 disabled:opacity-40 disabled:cursor-default ${
                displayedTab === tab
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border-brand-500'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800'
              }`}
            >
              {t(tab, language)}
            </button>
          );
        })}
      </div>
      <button type="button" className="ribbon-toggle editor-icon-button mb-1" onClick={() => setExpanded(!useEditorStore.getState().ribbonExpanded)}
        aria-expanded={expanded} aria-controls={`${tabId}-panel`} aria-label={t(expanded ? 'Collapse Ribbon' : 'Expand Ribbon', language)}
        title={`${t(expanded ? 'Collapse Ribbon' : 'Expand Ribbon', language)} (Ctrl+F1)`}>
        {expanded ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
      </button>
      </div>

      {/* All tabs reserve the same geometry, including the render immediately after deletion. */}
      <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${displayedTab}`}
        hidden={!expanded} style={{ height: RIBBON_PANEL_HEIGHT, minHeight: RIBBON_PANEL_HEIGHT, maxHeight: RIBBON_PANEL_HEIGHT, ...(expanded ? {} : { display: 'none' }) }}
        className="ribbon-content px-2 py-1.5 bg-white dark:bg-slate-800">
        <RibbonTools layoutKey={`${displayedTab}:${language}:${selectedElement?.type || ''}:${expanded}`} language={language}>
          <RibbonContents tab={displayedTab} />
        </RibbonTools>
      </div>
    </div>
  );
};
