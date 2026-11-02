import React from 'react';
import { equal } from '../../store/helpers';
import { Sun, Moon, House, Focus } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { showStartMenu } from '../../services/editorCommands';
import { t } from '../../utils/localization';

export const TitleBar: React.FC = () => {
  const { theme, toggleTheme, project, renameProject, savedProject, language, focusMode, toggleViewOption } = useEditorStore();
  return (
    <div className="flex items-center px-4 h-8 bg-brand-600 dark:bg-slate-950 border-b border-brand-700 dark:border-slate-800 justify-between text-white select-none">
      <div className="flex items-center gap-2">
        <button type="button" onClick={showStartMenu} className="p-1 rounded hover:bg-white/15" title={t('Start menu', language)} aria-label={t('Start menu', language)}><House size={14} /></button>
        <span className="font-bold text-xs tracking-wider opacity-90">POWERWEB</span>
        <div className="h-3 w-px bg-white/20 mx-1" />
        <span className="text-[10px] opacity-70">Beta 1.5.1</span>
      </div>
      <span className="text-xs truncate mx-3" title={t('Project name',language)} onDoubleClick={() => {
        const name = prompt(t('Project name',language)+':', project.name);
        if (name?.trim()) renameProject(name.trim());
      }}>
        {project.name}{!equal(project, savedProject) ? ' *' : ''}
      </span>
      <div className="flex items-center gap-2">
      {focusMode&&<button type="button" onClick={()=>toggleViewOption('focusMode')} title={t('Exit focus mode',language)+' (F8)'} aria-label={t('Exit focus mode',language)} className="flex items-center gap-1 px-2 py-1 rounded bg-white/15 text-[10px]"><Focus size={13}/><span>F8</span></button>}
      <button type="button" onClick={toggleTheme} className="p-1 hover:bg-white/10 rounded transition-colors"
        aria-label={t(theme === 'light' ? 'Dark theme' : 'Light theme',language)}
        title={t(theme === 'light' ? 'Dark theme' : 'Light theme',language)}>
        {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
      </button></div>
    </div>
  );
};
