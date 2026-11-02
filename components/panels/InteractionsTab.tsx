// components/panels/InteractionsTab.tsx — click and hover logic for selected element

import React from 'react';
import { MousePointerClick, Scan } from 'lucide-react';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { Action, CanvasElement } from '../../types';
import { updateLogicAction } from '../../utils/logicEditing';

interface Props {
  element: CanvasElement;
  inputClass: string;
  labelClass: string;
}

export const InteractionsTab: React.FC<Props> = ({ element, inputClass, labelClass }) => {
  return <div className="space-y-4">
    <EventSettings element={element} inputClass={inputClass} labelClass={labelClass} eventType="click" />
    <EventSettings element={element} inputClass={inputClass} labelClass={labelClass} eventType="hover" />
  </div>;
};

const EventSettings: React.FC<Props & { eventType: 'click' | 'hover' }> = ({ element, inputClass, labelClass, eventType }) => {
  const { project, language, updateElementProp } = useEditorStore();

  const updateAction = (action?: Action) => updateElementProp('logic', updateLogicAction(element.logic, eventType, action));
  const currentLogic = element.logic?.find(b => b.event?.type === eventType) || { actions: [] };
  const currentActionType = currentLogic.actions?.[0]?.type || 'none';
  const currentTargetId = currentLogic.actions?.[0]?.targetId || '';

  return (
      <section data-logic-event={eventType}>
        <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1 uppercase">
          {eventType === 'hover' ? <Scan size={12} className="text-brand-500" /> : <MousePointerClick size={12} className="text-brand-500" />}
          {t(eventType === 'hover' ? 'On Hover' : 'On Click', language)}
        </h4>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{t('Action', language)}</label>
            <select value={currentActionType}
              onChange={e => {
                const type = e.target.value as Action['type'] | 'none';
                if (type === 'none') {
                  updateAction();
                  return;
                }
                const action: Action = { type };
                if (type === 'navigateToPage') action.targetId = project.pages[0]?.id || '';
                updateAction(action);
              }}
              className={inputClass}>
              <option value="none">{t('No Action', language)}</option>
              <option value="navigateToPage">{t('Go to Page', language)}</option>
              <option value="showModal">{t('Show Modal', language)}</option>
              <option value="navigateToUrl">{t('Open URL', language)}</option>
            </select>
          </div>

          {currentActionType === 'navigateToPage' && (
            <div>
              <label className={labelClass}>{t('Target Page', language)}</label>
              <select value={currentTargetId}
                onChange={e => updateAction({ type: 'navigateToPage', targetId: e.target.value })}
                className={inputClass}>
                {project.pages.map((p, i) => <option key={p.id} value={p.id}>{i + 1}. {p.name}</option>)}
              </select>
            </div>
          )}

          {currentActionType === 'showModal' && (
            <div><label className={labelClass}>{t('Target', language)}</label>
              <select className={inputClass} value={currentTargetId} onChange={e => updateAction({ type: 'showModal', targetId: e.target.value })}>
                <option value="">—</option>
                {project.pages.find(p => p.id === project.activePageId)?.layers.flatMap(l => l.elements).filter(e => e.id !== element.id).map(e => <option key={e.id} value={e.id}>{e.type}: {e.content?.slice(0,30) || e.id}</option>)}
              </select></div>
          )}
          {currentActionType === 'navigateToUrl'  && (
            <div>
              <label className={labelClass}>{t('URL', language)}</label>
              <input type="text" placeholder="https://example.com"
                value={currentLogic.actions?.[0]?.url || ''}
                onChange={e => updateAction({ type: 'navigateToUrl', url: e.target.value })}
                className={inputClass} />
            </div>
          )}
        </div>
      </section>
  );
};
