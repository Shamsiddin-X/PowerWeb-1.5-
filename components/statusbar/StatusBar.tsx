import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { t } from '../../utils/localization';
export const StatusBar:React.FC=()=>{
  const {project,selectedElementIds,insertMode,scale,language}=useEditorStore();
  const pageIndex=project.pages.findIndex(p=>p.id===project.activePageId);
  return <div className="bg-brand-600 dark:bg-brand-700 text-white text-xs px-4 py-1 flex justify-between items-center select-none z-20">
    <div>{t('Page',language)} {pageIndex+1} {t('of',language)} {project.pages.length}</div>
    <div className="flex items-center gap-4"><span>{selectedElementIds.length?`${selectedElementIds.length} ${t('Selected',language)}`:t(insertMode?'Drawing':'Ready',language)}</span><span>|</span><span>{t('Zoom',language)}: {Math.round(scale*100)}%</span></div>
  </div>;
};
