import { useEditorStore } from '../store/useEditorStore';
import { equal } from '../store/helpers';
import { openProject, saveProject } from './fileService';
import { rememberProject, loadRecentProject } from './projectLibrary';
import { createProjectFromTemplate, ProjectTemplateId } from '../utils/projectTemplates';
export const reportError = (error: unknown) => { console.error(error); alert(error instanceof Error ? error.message : String(error)); };
export async function saveCurrentProject() {
  const store = useEditorStore.getState();
  store.commitTransaction();
  const project = useEditorStore.getState().project;
  if (await saveProject(project)) {
    // Do not mark changes made while the native dialog was open as saved.
    if(useEditorStore.getState().project.id===project.id)useEditorStore.setState({ savedProject: project });
    await rememberProject(project);
  }
}
export async function openCurrentProject() {
  useEditorStore.getState().commitTransaction();
  const project = await openProject();
  if (!project) return;
  const s = useEditorStore.getState();
  if (!canReplaceProject()) return;
  s.loadProject(project);
  await rememberProject(project);
}

function canReplaceProject(): boolean {
  const s = useEditorStore.getState();
  return !s.hasOpenProject || equal(s.project, s.savedProject)
    || confirm('Заменить проект без сохранения? Несохранённые изменения текущего документа будут потеряны.');
}

export function createCurrentProject(template: ProjectTemplateId) {
  useEditorStore.getState().commitTransaction();
  if (!canReplaceProject()) return;
  const s = useEditorStore.getState();
  const project = createProjectFromTemplate(template, s.language);
  s.loadProject(project);
  useEditorStore.setState({ savedProject: null });
}

export async function openRecentProject(id:string){
  const project=await loadRecentProject(id);
  const state=useEditorStore.getState();if(!canReplaceProject())return;
  state.commitTransaction();state.loadProject(project);useEditorStore.setState({savedProject:null});await rememberProject(project);
}

export async function showStartMenu(): Promise<boolean> {
  const s = useEditorStore.getState();
  s.commitTransaction();
  const project=useEditorStore.getState().project;
  s.setInsertMode(null);
  s.closeContextMenu();
  s.setShowStartScreen(true);
  return rememberProject(project);
}
