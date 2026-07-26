import React from 'react';
import { useEditorStore } from './store/useEditorStore';
import { Ribbon } from './components/ribbon';
import { SidebarPages } from './components/SidebarPages';
import { Canvas } from './components/canvas/Canvas';
import { RightPanel } from './components/RightPanel';
import { LayersPanel } from './components/LayersPanel';
import { ContextMenu } from './components/ContextMenu';
import { StatusBar } from './components/statusbar/StatusBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const showRightPanel = useEditorStore(s => s.showRightPanel);
  const showLayers = useEditorStore(s => s.showLayers);

  useKeyboardShortcuts();
  useTheme();

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-white dark:bg-slate-900 transition-colors">
      <Ribbon />
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarPages />
        <Canvas />
        {showRightPanel && <RightPanel />}
        {showLayers && <LayersPanel />}
        <ContextMenu />
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
