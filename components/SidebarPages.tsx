// components/SidebarPages.tsx — Page sidebar using atomic store actions

import React from 'react';
import { Plus, File, Trash2 } from 'lucide-react';
import { t } from '../utils/localization';
import { useEditorStore } from '../store/useEditorStore';

export const SidebarPages = React.memo(() => {
  const { project, language, addPage, deletePage, switchPage, openContextMenu } = useEditorStore();

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (project.pages.length <= 1) { alert('Cannot delete the last page.'); return; }
    if (!confirm('Are you sure you want to delete this page?')) return;
    deletePage(pageId);
  };

  const handlePageContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, pageId, 'page');
  };

  return (
    <div className="w-40 bg-gray-50 dark:bg-slate-900 border-r border-gray-300 dark:border-slate-800 flex flex-col h-full select-none transition-colors">
      <div className="p-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <h3 className="font-semibold text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('Pages', language)}</h3>
        <button onClick={addPage} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-brand-600 dark:text-brand-400 transition-colors" title="Add New Page">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {project.pages.map((page, index) => (
          <div key={page.id}
            onClick={() => switchPage(page.id)}
            onContextMenu={(e) => handlePageContextMenu(e, page.id)}
            className={`group flex items-center p-1.5 rounded-md cursor-pointer transition-all relative ${
              project.activePageId === page.id
                ? 'bg-brand-100 dark:bg-slate-800 text-brand-700 dark:text-brand-400 ring-1 ring-brand-300 dark:ring-slate-600'
                : 'hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center mr-2 w-4 text-gray-400 dark:text-slate-500">
              <span className="text-[9px] font-mono">{index + 1}</span>
            </div>

            <div className="w-6 h-5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-sm mr-2 flex items-center justify-center relative overflow-hidden">
              {page.transition && page.transition !== 'none' && (
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-brand-500 rounded-tl-sm" title="Has Transition" />
              )}
              <File size={8} className="text-gray-300 dark:text-slate-400" />
            </div>

            <div className="flex-1 min-w-0 z-0">
              <p className="text-xs font-medium truncate">{page.name}</p>
            </div>

            {project.pages.length > 1 && (
              <button
                onClick={(e) => handleDeletePage(e, page.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-opacity absolute right-1 bg-gray-200 dark:bg-slate-800 rounded z-10 hover:shadow-sm"
                title={t('Delete Page', language)}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
