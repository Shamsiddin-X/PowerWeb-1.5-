import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Sun, Moon } from 'lucide-react';
import { EditorState, CanvasElement, Action, ElementStyle, ElementType } from '../../types';
import { saveProjectToPWB, loadProjectFromPWB, generateId } from '../../utils';
import { t } from '../../utils/localization';
import { PowerWebCodeGenerator } from '../../codeGenerator';
import { Plugin } from '../../utils/pluginSystem';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { useEditorStore } from '../../store/useEditorStore';

import { RibbonHome } from './RibbonHome';
import { RibbonInsert } from './RibbonInsert';
import { RibbonFormat } from './RibbonFormat';
import { RibbonLogic } from './RibbonLogic';
import { RibbonAnimations } from './RibbonAnimations';
import { RibbonView } from './RibbonView';
import { RibbonPlugins } from './RibbonPlugins';

interface RibbonProps {
  onDeleteSelected: () => void;
  plugins: Plugin[];
  onRunPlugin: (plugin: Plugin) => void;
}

type Tab = 'Home' | 'Insert' | 'Format' | 'Logic' | 'Animations' | 'View' | 'Plugins';

export const Ribbon: React.FC<RibbonProps> = ({ onDeleteSelected, plugins, onRunPlugin }) => {
  const editorState = useEditorStore();
  const setEditorState = useEditorStore(state => state.setEditorState);
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [activeEventType, setActiveEventType] = useState<'click' | 'hover'>('click');
  const { language } = editorState;

  const selectedPage = editorState.project.pages.find(p => p.id === editorState.project.activePageId);
  const selectedElement = editorState.selectedElementIds.length > 0
    ? (() => {
        if (!selectedPage) return null;
        for (const layer of selectedPage.layers) {
          const found = layer.elements.find(el => el.id === editorState.selectedElementIds[0]);
          if (found) return found;
        }
        return null;
      })()
    : null;
  const selectedCount = editorState.selectedElementIds.length;

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
  }, [selectedCount]);

  // ── Memoized element updaters ──────────────────────────────────────────────

  const updateElement = useCallback((key: string, value: any, isStyle: boolean = false) => {
    if (!selectedElement) return;
    setEditorState(prev => {
      const newPages = prev.project.pages.map(page => {
        if (page.id !== prev.project.activePageId) return page;
        return {
          ...page,
          layers: page.layers.map(layer => ({
            ...layer,
            elements: layer.elements.map(el => {
              if (!prev.selectedElementIds.includes(el.id)) return el;
              return isStyle ? { ...el, style: { ...el.style, [key]: value } } : { ...el, [key]: value };
            }),
          })),
        };
      });
      const newProject = { ...prev.project, pages: newPages };
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newProject);
      if (newHistory.length > 20) newHistory.shift();
      return { ...prev, project: newProject, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  }, [selectedElement, setEditorState]);

  const updateElementStyleBulk = useCallback((newStyle: Partial<ElementStyle>) => {
    if (!selectedElement) return;
    setEditorState(prev => {
      const newPages = prev.project.pages.map(page => {
        if (page.id !== prev.project.activePageId) return page;
        return {
          ...page,
          layers: page.layers.map(layer => ({
            ...layer,
            elements: layer.elements.map(el =>
              prev.selectedElementIds.includes(el.id) ? { ...el, style: { ...el.style, ...newStyle } } : el
            ),
          })),
        };
      });
      const newProject = { ...prev.project, pages: newPages };
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newProject);
      if (newHistory.length > 20) newHistory.shift();
      return { ...prev, project: newProject, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  }, [selectedElement, setEditorState]);

  const updateElementLogic = useCallback((newActionType: string, targetIdOrUrl?: string) => {
    if (!selectedElement) return;
    setEditorState(prev => {
      const newPages = prev.project.pages.map(page => {
        if (page.id !== prev.project.activePageId) return page;
        return {
          ...page,
          layers: page.layers.map(layer => ({
            ...layer,
            elements: layer.elements.map(el => {
              if (!prev.selectedElementIds.includes(el.id)) return el;
              const other = (el.logic || []).filter(b => b.event?.type !== activeEventType);
              let finalLogic = other;
              if (newActionType !== 'none') {
                const action: Action = { type: newActionType as any };
                if (newActionType === 'navigateToPage') {
                  if (targetIdOrUrl) {
                    action.targetId = targetIdOrUrl;
                  } else {
                    const pages = prev.project.pages;
                    const idx = pages.findIndex(p => p.id === prev.project.activePageId);
                    action.targetId = pages[(idx + 1) % pages.length].id;
                  }
                } else if (newActionType === 'navigateToUrl') {
                  action.url = targetIdOrUrl || '';
                } else if (newActionType === 'showModal') {
                  action.targetId = targetIdOrUrl || '';
                }
                finalLogic = [...other, { event: { type: activeEventType }, actions: [action] }];
              }
              return { ...el, logic: finalLogic };
            }),
          })),
        };
      });
      const newProject = { ...prev.project, pages: newPages };
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newProject);
      if (newHistory.length > 20) newHistory.shift();
      return { ...prev, project: newProject, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  }, [selectedElement, activeEventType, setEditorState]);

  // ── File Handlers ──────────────────────────────────────────────────────────

  const isTauri = typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined);

  const handleExport = useCallback(async () => {
    try {
      const generator = new PowerWebCodeGenerator(editorState.project);
      const { html, css, js } = generator.generate();
      
      if (isTauri) {
        const savePath = await save({
          filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
          defaultPath: `${editorState.project.name.replace(/\s+/g, '_')}.zip`,
        });
        if (!savePath) return;
        await invoke('export_zip', { savePath, html, css: css || '', js: js || '', projectName: editorState.project.name });
      } else {
        const combinedHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<style>${css || ''}</style>\n</head>\n<body>\n${html}\n<script>${js || ''}</script>\n</body>\n</html>`;
        const blob = new Blob([combinedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editorState.project.name.replace(/\\s+/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { alert('Export error: ' + e); }
  }, [editorState.project]);

  const handlePreview = useCallback(async () => {
    try {
      const generator = new PowerWebCodeGenerator(editorState.project);
      const { html, css, js } = generator.generate();
      
      if (isTauri) {
        await invoke('preview_html', { html });
      } else {
        const combinedHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<style>${css || ''}</style>\n</head>\n<body>\n${html}\n<script>${js || ''}</script>\n</body>\n</html>`;
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(combinedHtml);
          newWindow.document.close();
        } else {
          alert('Popup blocked. Please allow popups for preview.');
        }
      }
    } catch (e) { alert('Preview error: ' + e); }
  }, [editorState.project]);

  const handleNativeSave = useCallback(async () => {
    try {
      const fileData = { signature: 'POWERWEB_PROJECT', version: '0.4.0', savedAt: Date.now(), project: editorState.project };
      
      if (isTauri) {
        const path = await save({ filters: [{ name: 'PowerWeb Project', extensions: ['pwb'] }], defaultPath: `${editorState.project.name}.pwb` });
        if (path) {
          await writeTextFile(path, JSON.stringify(fileData, null, 2));
        }
      } else {
        const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editorState.project.name}.pwb`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error('Save failed', e); }
  }, [editorState.project]);

  const handleNativeOpen = useCallback(async () => {
    try {
      if (isTauri) {
        const selected = await open({ multiple: false, filters: [{ name: 'PowerWeb Project', extensions: ['pwb'] }] });
        if (selected && typeof selected === 'string') {
          const content = await readTextFile(selected);
          const parsedData = JSON.parse(content);
          if (parsedData.signature === 'POWERWEB_PROJECT') {
            setEditorState(prev => ({
              ...prev,
              project: parsedData.project,
              history: [parsedData.project],
              historyIndex: 0,
              selectedElementIds: [],
              activeLayerId: parsedData.project.pages[0]?.layers[0]?.id || '',
            }));
          }
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pwb';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const content = event.target?.result as string;
              const parsedData = JSON.parse(content);
              if (parsedData.signature === 'POWERWEB_PROJECT') {
                setEditorState(prev => ({
                  ...prev,
                  project: parsedData.project,
                  history: [parsedData.project],
                  historyIndex: 0,
                  selectedElementIds: [],
                  activeLayerId: parsedData.project.pages[0]?.layers[0]?.id || '',
                }));
              }
            } catch (err) {
              console.error('Failed to parse project file', err);
              alert('Failed to parse project file. It might be corrupted or invalid.');
            }
          };
          reader.readAsText(file);
        };
        input.click();
      }
    } catch (e) { console.error('Open failed', e); }
  }, [setEditorState]);

  const handleSetInsertMode = useCallback((type: ElementType) => {
    setEditorState(prev => ({ ...prev, insertMode: type, selectedElementIds: [] }));
  }, [setEditorState]);

  const handleOpenPluginsFolder = useCallback(async () => {
    try {
      if (isTauri) {
        await invoke('open_plugins_folder');
      } else {
        alert('Plugins folder is only available in the desktop version.');
      }
    } catch (e) { console.error(e); }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-40 relative select-none transition-colors">

      {/* Title Bar */}
      <div className="flex items-center px-4 h-8 bg-brand-600 dark:bg-slate-950 border-b border-brand-700 dark:border-slate-800 justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wider opacity-90">POWERWEB</span>
          <div className="h-3 w-px bg-white/20 mx-1" />
          <span className="text-[10px] opacity-70">Alpha 0.9</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditorState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} className="p-1 hover:bg-white/10 rounded">
            {editorState.theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
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

        {activeTab === 'Home' && (
          <RibbonHome
            editorState={editorState}
            selectedCount={selectedCount}
            onDeleteSelected={onDeleteSelected}
            onNativeSave={handleNativeSave}
            onNativeOpen={handleNativeOpen}
            onPreview={handlePreview}
            onExport={handleExport}
          />
        )}

        {activeTab === 'Insert' && (
          <RibbonInsert editorState={editorState} onSetInsertMode={handleSetInsertMode} />
        )}

        {activeTab === 'Format' && selectedElement && (
          <RibbonFormat
            editorState={editorState}
            selectedElement={selectedElement}
            onUpdateElement={updateElement}
            onUpdateStyleBulk={updateElementStyleBulk}
          />
        )}

        {activeTab === 'Logic' && selectedElement && (
          <RibbonLogic
            editorState={editorState}
            selectedElement={selectedElement}
            activeEventType={activeEventType}
            setActiveEventType={setActiveEventType}
            onUpdateLogic={updateElementLogic}
          />
        )}

        {activeTab === 'Animations' && selectedElement && (
          <RibbonAnimations
            editorState={editorState}
            selectedElement={selectedElement}
            onUpdateElement={updateElement}
          />
        )}

        {activeTab === 'Animations' && !selectedElement && (
          <div className="flex items-center justify-center flex-1 text-xs text-gray-400 dark:text-slate-500 italic">
            Select an element to add animations
          </div>
        )}

        {activeTab === 'View' && (
          <RibbonView editorState={editorState} setEditorState={setEditorState} />
        )}

        {activeTab === 'Plugins' && (
          <RibbonPlugins
            editorState={editorState}
            plugins={plugins}
            onRunPlugin={onRunPlugin}
            onOpenPluginsFolder={handleOpenPluginsFolder}
          />
        )}
      </div>
    </div>
  );
};
