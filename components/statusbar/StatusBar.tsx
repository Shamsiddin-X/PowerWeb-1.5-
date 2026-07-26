import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';

export const StatusBar: React.FC = () => {
  const { project, selectedElementIds, insertMode, scale } = useEditorStore();
  const pageIndex = project.pages.findIndex(p => p.id === project.activePageId);

  return (
    <div className="bg-brand-600 dark:bg-brand-700 text-white text-xs px-4 py-1 flex justify-between items-center select-none z-20">
      <div>Page {pageIndex + 1} of {project.pages.length}</div>
      <div className="flex items-center space-x-4">
        <span>{selectedElementIds.length > 0 ? `${selectedElementIds.length} Selected` : (insertMode ? 'Drawing...' : 'Ready')}</span>
        <span>|</span>
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
};
