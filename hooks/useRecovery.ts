import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { equal } from '../store/helpers';
import { isTauri } from '../services/platform';
import { parseProjectSnapshot, validateProject } from '../utils/fileFormat';
import { getSnapshot, putSnapshot, deleteSnapshot } from '../services/projectSnapshots';
const LEGACY_KEY = 'powerweb.recovery.v1';
const SNAPSHOT_KEY = 'recovery';

export function useRecovery() {
  useEffect(() => {
    const initialProject=useEditorStore.getState().project;
    let disposed=false,ready=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    let queue=Promise.resolve(true);
    let unlisten:(()=>void)|undefined;
    const persist=()=>{
      if(!ready)return Promise.resolve(false);
      const state=useEditorStore.getState();
      const project=state.project,clean=!state.hasOpenProject||equal(project,state.savedProject);
      queue=queue.then(async()=>{
        if(clean)await deleteSnapshot(SNAPSHOT_KEY);
        else await putSnapshot(SNAPSHOT_KEY,project);
        try{localStorage.removeItem(LEGACY_KEY);}catch{}
        return true;
      }).catch(error=>{console.warn('Recovery could not be saved',error);return false;});
      return queue;
    };
    const unsubscribe=useEditorStore.subscribe((state,old)=>{
      if(state.project!==old.project||state.savedProject!==old.savedProject){
        clearTimeout(timer);timer=setTimeout(()=>void persist(),500);
      }
    });
    void (async()=>{
      let initialized=false;
      try{
        let snapshot=await getSnapshot(SNAPSHOT_KEY);
        if(!snapshot)snapshot=parseProjectSnapshot(localStorage.getItem(LEGACY_KEY)||'')||undefined;
        if(disposed)return;
        // Never replace a document opened or edited while the database was opening.
        if(snapshot&&useEditorStore.getState().project===initialProject){
          const project=validateProject(snapshot);
          if(confirm('Восстановить предыдущую несохранённую работу?')){
            useEditorStore.getState().loadProject(project);
            useEditorStore.setState({savedProject:null});
          }
        }
        initialized=true;
      }catch(error){console.warn('Recovery unavailable',error);}
      if(!disposed){ready=true;if(initialized||useEditorStore.getState().project!==initialProject)void persist();}
    })();
    const beforeUnload=(event:BeforeUnloadEvent)=>{
      void persist();const state=useEditorStore.getState();
      if(state.hasOpenProject&&!equal(state.project,state.savedProject)){event.preventDefault();event.returnValue='';}
    };
    void (async()=>{
      if(!isTauri())return;
      const {getCurrentWindow}=await import('@tauri-apps/api/window');
      const window=getCurrentWindow();
      const stop=await window.onCloseRequested(async event=>{
        const state=useEditorStore.getState();
        if(!state.hasOpenProject||equal(state.project,state.savedProject))return;
        event.preventDefault();
        if(!confirm('Закрыть PowerWeb без сохранения файла? Локальная копия будет предложена при следующем запуске.'))return;
        if(await persist())await window.destroy();
        else alert('Не удалось записать локальную копию. Сохраните проект в файл .pwb перед закрытием.');
      });
      if(disposed)stop();else unlisten=stop;
    })().catch(error=>console.warn('Close handler unavailable',error));
    window.addEventListener('beforeunload',beforeUnload);
    return ()=>{disposed=true;clearTimeout(timer);void persist();unsubscribe();unlisten?.();window.removeEventListener('beforeunload',beforeUnload);};
  },[]);
}
