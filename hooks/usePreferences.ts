import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { PREFERENCE_FIELDS, savePreferences } from '../services/editorPreferences';
import { languageInfo } from '../utils/languages';
export function usePreferences(){
  const uiScale=useEditorStore(s=>s.uiScale),language=useEditorStore(s=>s.language);
  useEffect(()=>{
    // Preferences are independent of project recovery, media size and undo history.
    savePreferences(useEditorStore.getState());
    return useEditorStore.subscribe((state,old)=>{
      if(PREFERENCE_FIELDS.some(key=>state[key]!==old[key]))savePreferences(state);
    });
  },[]);
  useEffect(()=>{document.body.style.zoom=String(uiScale);document.documentElement.style.setProperty('--editor-ui-scale',String(uiScale));},[uiScale]);
  useEffect(()=>{document.documentElement.lang=languageInfo(language).locale;},[language]);
}
