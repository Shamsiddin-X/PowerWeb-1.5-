import React from 'react';
import { RibbonGroup } from './RibbonShared';
import { FlagTJ, FlagRU, FlagUK } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';

export const RibbonView = React.memo(() => {
  const { language, showGrid, showLayers, showRightPanel, toggleGrid, toggleLayers, toggleRightPanel, setLanguage } = useEditorStore();

  return (
    <>
      <RibbonGroup label={t('Interface', language)}>
        <div className="flex flex-col space-y-0.5 w-32 justify-center">
          <label className="flex items-center text-xs text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800">
            <input type="checkbox" className="mr-2 accent-brand-600 rounded" checked={showGrid} onChange={toggleGrid} />
            <span>{t('Show Grid', language)}</span>
          </label>
          <label className="flex items-center text-xs text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800">
            <input type="checkbox" className="mr-2 accent-brand-600 rounded" checked={showLayers} onChange={toggleLayers} />
            <span>{t('Show Layers', language)}</span>
          </label>
          <label className="flex items-center text-xs text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800">
            <input type="checkbox" className="mr-2 accent-brand-600 rounded" checked={showRightPanel} onChange={toggleRightPanel} />
            <span>{t('Show Properties', language)}</span>
          </label>
        </div>
      </RibbonGroup>

      <RibbonGroup label={t('Language', language)}>
        <div className="flex items-center gap-3 px-2">
          <button
            onClick={() => setLanguage('tj')}
            className={`transition-all ${language === 'tj' ? 'scale-110 opacity-100 ring-2 ring-brand-500 ring-offset-2 rounded-[2px]' : 'hover:scale-105 opacity-50 hover:opacity-100'}`}
            title="Тоҷикӣ"
          >
            <FlagTJ className="w-8 h-5 rounded-[1px]" />
          </button>
          <button
            onClick={() => setLanguage('ru')}
            className={`transition-all ${language === 'ru' ? 'scale-110 opacity-100 ring-2 ring-brand-500 ring-offset-2 rounded-[2px]' : 'hover:scale-105 opacity-50 hover:opacity-100'}`}
            title="Русский"
          >
            <FlagRU className="w-8 h-5 rounded-[1px]" />
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`transition-all ${language === 'en' ? 'scale-110 opacity-100 ring-2 ring-brand-500 ring-offset-2 rounded-[2px]' : 'hover:scale-105 opacity-50 hover:opacity-100'}`}
            title="English"
          >
            <FlagUK className="w-8 h-5 rounded-[1px]" />
          </button>
        </div>
      </RibbonGroup>
    </>
  );
});
