import React from 'react';
import { MousePointerClick, Scan } from 'lucide-react';
import { EditorState, CanvasElement, Action } from '../../types';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';

interface RibbonLogicProps {
  editorState: EditorState;
  selectedElement: CanvasElement;
  activeEventType: 'click' | 'hover';
  setActiveEventType: (type: 'click' | 'hover') => void;
  onUpdateLogic: (actionType: string, targetIdOrUrl?: string) => void;
}

export const RibbonLogic = React.memo(({
  editorState,
  selectedElement,
  activeEventType,
  setActiveEventType,
  onUpdateLogic,
}: RibbonLogicProps) => {
  const { language } = editorState;

  const activeBlock = selectedElement.logic?.find(b => b.event?.type === activeEventType);
  const currentLogicAction = activeBlock?.actions?.[0];
  const currentActionType = currentLogicAction?.type || 'none';

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
            onChange={(e) => onUpdateLogic(e.target.value)}
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
              onChange={(e) => onUpdateLogic('navigateToPage', e.target.value)}
            >
              {editorState.project.pages.map((p, idx) => (
                <option key={p.id} value={p.id}>{idx + 1}. {p.name}</option>
              ))}
            </select>
          ) : currentActionType === 'navigateToUrl' ? (
            <input
              type="text"
              placeholder="https://example.com"
              className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
              value={currentLogicAction?.url || ''}
              onChange={(e) => onUpdateLogic('navigateToUrl', e.target.value)}
            />
          ) : currentActionType === 'showModal' ? (
            <input
              type="text"
              placeholder="Modal Element ID"
              className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded p-1"
              value={currentLogicAction?.targetId || ''}
              onChange={(e) => onUpdateLogic('showModal', e.target.value)}
            />
          ) : (
            <div className="h-6" />
          )}
        </div>
      </RibbonGroup>
    </>
  );
});
