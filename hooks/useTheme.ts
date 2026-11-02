import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
export const useTheme=()=>{
  const theme=useEditorStore(s=>s.theme),mode=useEditorStore(s=>s.themeMode);
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');},[theme]);
  useEffect(()=>{
    if(mode!=='system')return;
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const sync=()=>useEditorStore.setState({theme:media.matches?'dark':'light'});
    sync();media.addEventListener('change',sync);
    return ()=>media.removeEventListener('change',sync);
  },[mode]);
};
