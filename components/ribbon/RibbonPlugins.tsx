import React, { useEffect, useState } from 'react';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { Grid, Zap, FolderOpen, RefreshCw } from 'lucide-react';
import { Plugin, loadPlugins } from '../../services/pluginService';
import { reportError } from '../../services/editorCommands';
import { useEditorStore } from '../../store/useEditorStore';

export const RibbonPlugins = React.memo(() => {
  const { language, runPlugin } = useEditorStore();
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    let mounted = true;
    loadPlugins().then(loaded => {
      if (mounted) setPlugins(loaded);
    }).catch(reportError);
    return () => { mounted = false; };
  }, []);

  const handleOpenPluginsFolder = async () => {
    try {
      const isTauri = typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined);
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_plugins_folder');
      } else {
        alert('Plugins folder is only available in the desktop version.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <RibbonGroup label="Active Plugins">
        <div className="flex flex-wrap items-center gap-2">
          {plugins.length === 0 && <span className="text-[10px] text-gray-400 px-4">No plugins found</span>}
          {plugins.map(plugin => (
            <BigButton
              key={plugin.name}
              icon={Zap}
              label={plugin.name.replace('.js', '')}
              onClick={() => { void runPlugin(plugin).catch(reportError); }}
            />
          ))}
        </div>
      </RibbonGroup>
      <RibbonGroup label="Manage">
        <BigButton icon={RefreshCw} label="Reload" onClick={() => { void loadPlugins().then(setPlugins).catch(reportError); }} />
        <BigButton icon={FolderOpen} label="Plugin Folder" onClick={handleOpenPluginsFolder} />
      </RibbonGroup>
    </>
  );
});
