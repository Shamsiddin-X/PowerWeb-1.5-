import React, { useState } from 'react';
import { MousePointerClick, Scan } from 'lucide-react';
import { Action } from '../../types';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedElement } from '../../store/selectors';
import { updateLogicAction } from '../../utils/logicEditing';

export const RibbonLogic = React.memo(() => {
  const { language, project, updateElementProp } = useEditorStore();
  const selectedElement = useSelectedElement();
  const [activeEventType, setActiveEventType] = useState<'click' | 'hover'>('click');

  if (!selectedElement) return null;

  const activeBlock = selectedElement.logic?.find(b => b.event?.type === activeEventType);
  const currentLogicAction = activeBlock?.actions?.[0];
  const currentActionType = currentLogicAction?.type || 'none';

  const handleUpdateLogic = (newActionType: string, targetIdOrUrl?: string) => {
    let action: Action | undefined;
    
    if (newActionType !== 'none') {
      action = { type: newActionType as Action['type'] };
      if (newActionType === 'navigateToPage') {
        if (targetIdOrUrl) {
          action.targetId = targetIdOrUrl;
        } else {
          const pages = project.pages;
          const idx = pages.findIndex(p => p.id === project.activePageId);
          action.targetId = pages[(idx + 1) % pages.length].id;
        }
      } else if (newActionType === 'navigateToUrl') {
        action.url = targetIdOrUrl || '';
      } else if (newActionType === 'showModal') {
        action.targetId = targetIdOrUrl || '';
      }
    }
    updateElementProp('logic', updateLogicAction(selectedElement.logic, activeEventType, action));
  };

  return (
    <>
      <RibbonGroup label={t('Events', language)}>
        <BigButton
          icon={MousePointerClick}
          label={t('On Click', language)}
          active={activeEventType === 'click'}
          onClick={() => setActiveEventType('click')}
        />
        <BigButton
          icon={Scan}
          label={t('On Hover', language)}
          active={activeEventType === 'hover'}
          onClick={() => setActiveEventType('hover')}
        />
      </RibbonGroup>

      <RibbonGroup label={t('Actions', language)}>
        <div className="flex flex-col justify-center h-full space-y-2 w-40">
          <select
            className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
            value={currentActionType}
            onChange={(e) => handleUpdateLogic(e.target.value)}
          >
            <option value="none">{t('No Action', language)}</option>
            <option value="navigateToPage">{t('Go to Page', language)}</option>
            <option value="navigateToUrl">{t('Open URL', language)}</option>
            <option value="showModal">{t('Show Modal', language)}</option>
          </select>

          {currentActionType === 'navigateToPage' ? (
            <select
              className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
              value={currentLogicAction?.targetId || ''}
              onChange={(e) => handleUpdateLogic('navigateToPage', e.target.value)}
            >
              {project.pages.map((p, idx) => (
                <option key={p.id} value={p.id}>{idx + 1}. {p.name}</option>
              ))}
            </select>
          ) : currentActionType === 'navigateToUrl' ? (
            <input
              type="text"
              placeholder="https://example.com"
              className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
              value={currentLogicAction?.url || ''}
              onChange={(e) => handleUpdateLogic('navigateToUrl', e.target.value)}
            />
          ) : currentActionType === 'showModal' ? (
            <input
              type="text"
              placeholder="Modal Element ID"
              className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
              value={currentLogicAction?.targetId || ''}
              onChange={(e) => handleUpdateLogic('showModal', e.target.value)}
            />
          ) : (
            <div className="h-6" />
          )}
        </div>
      </RibbonGroup>
    </>
  );
});
