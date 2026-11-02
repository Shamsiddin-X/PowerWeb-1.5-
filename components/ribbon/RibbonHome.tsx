import React from 'react';
import { FolderOpen, Save, Play, Download, Copy, Grid, Trash2, Undo2, Redo2, Scissors, Group, Ungroup, Code, CopyPlus } from 'lucide-react';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { previewProject, exportProject, exportReactProject } from '../../services/fileService';

import { saveCurrentProject, openCurrentProject, reportError } from '../../services/editorCommands';

export const RibbonHome = React.memo(() => {
  const { project, language, selectedElementIds, clipboard, deleteSelected, copySelected, pasteElements, cutSelected, duplicateSelected, groupSelected, ungroupSelected, undo, redo, historyIndex, history, historyTransaction } = useEditorStore();
  const selectedCount = selectedElementIds.length;

  const run = (fn: () => Promise<unknown>) => () => { void fn().catch(reportError); };
  return (
    <>
      <RibbonGroup label={t('File', language)}>
        <BigButton icon={FolderOpen} label={t('Open', language)} onClick={run(openCurrentProject)} />
        <BigButton icon={Save} label={t('Save', language)} onClick={run(saveCurrentProject)} />
        <BigButton icon={Play} label={t('Preview', language)} onClick={run(() => previewProject(project))} />
        <BigButton icon={Download} label={t('Export', language)} onClick={run(() => exportProject(project))} />
      </RibbonGroup>
      <RibbonGroup label={t('History', language)}>
        <BigButton icon={Undo2} label={t('Undo', language)} onClick={undo} disabled={historyIndex === 0 && !historyTransaction} />
        <BigButton icon={Redo2} label={t('Redo', language)} onClick={redo} disabled={historyIndex === history.length - 1} />
      </RibbonGroup>
      <RibbonGroup label={t('Clipboard', language)}>
        <BigButton icon={Scissors} label={t('Cut', language)} onClick={cutSelected} disabled={selectedCount === 0} />
        <BigButton icon={Copy} label={t('Copy', language)} onClick={copySelected} disabled={selectedCount === 0} />
        <BigButton icon={Grid} label={t('Paste', language)} onClick={pasteElements} disabled={clipboard.length === 0} />
        <BigButton icon={Trash2} label={t('Delete', language)} onClick={deleteSelected} disabled={selectedCount === 0} />
      </RibbonGroup>
      <RibbonGroup label={t('Arrange', language)}>
        <BigButton icon={CopyPlus} label={t('Duplicate', language)} onClick={duplicateSelected} disabled={!selectedCount} />
        <BigButton icon={Group} label={t('Group', language)} onClick={groupSelected} disabled={selectedCount < 2} />
        <BigButton icon={Ungroup} label={t('Ungroup', language)} onClick={ungroupSelected} disabled={selectedCount !== 1} />
      </RibbonGroup>
      <RibbonGroup label="React">
        <BigButton icon={Code} label={t('Export React', language)} onClick={run(() => exportReactProject(project))} />
      </RibbonGroup>
    </>
  );
});
