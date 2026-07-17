import React from 'react';
import { EditorState } from '../../types';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { Grid, Zap, FolderOpen } from 'lucide-react';
import { Plugin } from '../../utils/pluginSystem';

interface RibbonPluginsProps {
  editorState: EditorState;
  plugins: Plugin[];
  onRunPlugin: (plugin: Plugin) => void;
  onOpenPluginsFolder: () => void;
}

export const RibbonPlugins = React.memo(({
  editorState,
  plugins,
  onRunPlugin,
  onOpenPluginsFolder,
}: RibbonPluginsProps) => {
  return (
    <>
      <RibbonGroup label="Active Plugins">
        <div className="flex items-center gap-2">
          {plugins.length === 0 && <span className="text-[10px] text-gray-400 px-4">No plugins found</span>}
          {plugins.map(plugin => (
            <BigButton
              key={plugin.name}
              icon={Zap}
              label={plugin.name.replace('.js', '')}
              onClick={() => onRunPlugin(plugin)}
            />
          ))}
        </div>
      </RibbonGroup>
      <RibbonGroup label="Manage">
        <BigButton icon={FolderOpen} label="Plugin Folder" onClick={onOpenPluginsFolder} />
      </RibbonGroup>
    </>
  );
});
