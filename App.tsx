import { ShaderCodeCreator } from './components/shaders/ShaderCodeDialog';
import { ShaderEditor } from './components/shaders/ShaderEditor';
import React from 'react';
import { useEditorStore } from './store/useEditorStore';
import { Ribbon } from './components/ribbon';
import { SidebarPages } from './components/SidebarPages';
import { Canvas } from './components/canvas/Canvas';
import { RightPanel } from './components/panels/RightPanel';
import { LayersPanel } from './components/LayersPanel';
import { ContextMenu } from './components/ContextMenu';
import { StatusBar } from './components/statusbar/StatusBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRecovery } from './hooks/useRecovery';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProjectFonts } from './hooks/useProjectFonts';
import { usePreferences } from './hooks/usePreferences';
import { useTheme } from './hooks/useTheme';
import { StartScreen } from './components/start/StartScreen';

const App: React.FC = () => {
  const language=useEditorStore(s=>s.language),focusMode=useEditorStore(s=>s.focusMode);
  const showPages=useEditorStore(s=>s.showPages),showStatusBar=useEditorStore(s=>s.showStatusBar);
  const showStartScreen = useEditorStore(s => s.showStartScreen);
  const showRightPanel = useEditorStore(s => s.showRightPanel);
  const isPluginRunning = useEditorStore(s => s.isPluginRunning);
  const showLayers = useEditorStore(s => s.showLayers);

  useKeyboardShortcuts();
  useTheme();
  usePreferences();
  useProjectFonts();
  useRecovery();
  if (showStartScreen) return <ErrorBoundary><StartScreen /></ErrorBoundary>;
  const beginEdit = (e: React.FocusEvent) => {
    if (!(e.target as HTMLElement).closest('.shader-dialog') && (e.target as HTMLElement).matches('input, textarea, select')) useEditorStore.getState().beginTransaction('Input');
  };
  const endEdit = (e: React.FocusEvent) => {
    if (!(e.target as HTMLElement).closest('.shader-dialog') && (e.target as HTMLElement).matches('input, textarea, select')) useEditorStore.getState().commitTransaction();
  };

  return (
    <ErrorBoundary><div dir={language==='ar'?'rtl':'ltr'} onPointerDownCapture={e => {
      if (!(e.target as HTMLElement).closest('.shader-dialog') && (e.target as HTMLElement).matches('input[type="range"]')) {
        useEditorStore.getState().commitTransaction(); useEditorStore.getState().beginTransaction('Slider');
      }
    }} onPointerUpCapture={e => {
      if (!(e.target as HTMLElement).closest('.shader-dialog') && (e.target as HTMLElement).matches('input[type="range"]')) useEditorStore.getState().commitTransaction();
    }} onFocusCapture={beginEdit} onBlurCapture={endEdit} className="editor-shell flex flex-col h-screen overflow-hidden text-sm bg-white dark:bg-slate-900 transition-colors">
      {isPluginRunning && <div role="status" className="fixed inset-0 z-[999999] bg-black/30 flex items-center justify-center"><span className="bg-white text-black p-4 rounded">Выполняется плагин…</span></div>}
      <ShaderEditor />
      <ShaderCodeCreator />
      <Ribbon />
      <div className="flex flex-1 overflow-hidden relative">
        {showPages&&!focusMode&&<SidebarPages />}
        <Canvas />
        {showRightPanel&&!focusMode && <RightPanel />}
        {showLayers&&!focusMode && <LayersPanel />}
        <ContextMenu />
      </div>
      {showStatusBar&&!focusMode&&<StatusBar />}
    </div></ErrorBoundary>
  );
};

export default App;
