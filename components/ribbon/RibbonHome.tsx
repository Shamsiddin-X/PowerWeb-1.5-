import React from 'react';
import { FolderOpen, Save, Play, Download, Copy, Grid, Trash2 } from 'lucide-react';
import { RibbonGroup, BigButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';
import { saveProject, openProject, previewProject, exportProject } from '../../services/fileService';

export const RibbonHome = React.memo(() => {
  const { project, language, selectedElementIds, clipboard, deleteSelected, loadProject, copySelected, pasteElements } = useEditorStore();
  const selectedCount = selectedElementIds.length;

  const handleOpen = async () => {
    const loaded = await openProject();
    if (loaded) loadProject(loaded);
  };

  return (
    <>
      <RibbonGroup label={t('File', language)}>
        <BigButton icon={FolderOpen} label={t('Open', language)} onClick={handleOpen} />
        <BigButton icon={Save} label={t('Save', language)} onClick={() => saveProject(project)} />
        <BigButton icon={Play} label={t('Preview', language)} onClick={() => previewProject(project)} />
        <BigButton icon={Download} label={t('Export', language)} onClick={() => exportProject(project)} />
      </RibbonGroup>
      <RibbonGroup label={t('Clipboard', language)}>
        <BigButton icon={Copy} label={t('Copy', language)} onClick={copySelected} disabled={selectedCount === 0} />
        <BigButton icon={Grid} label={t('Paste', language)} onClick={pasteElements} disabled={clipboard.length === 0} />
        <BigButton icon={Trash2} label={t('Delete', language)} onClick={deleteSelected} disabled={selectedCount === 0} />
      </RibbonGroup>
    </>
  );
});
