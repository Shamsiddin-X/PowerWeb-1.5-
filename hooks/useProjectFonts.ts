import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
export function useProjectFonts(){
  const fonts=useEditorStore(state=>state.project.fonts);
  useEffect(()=>{
    let disposed=false;const loaded:FontFace[]=[];
    for(const font of fonts||[]){
      const face=new FontFace(font.family,`url(${JSON.stringify(font.source)})`,{weight:font.weight||'normal',style:font.style||'normal'});
      face.load().then(()=>{if(!disposed){document.fonts.add(face);loaded.push(face);}}).catch(error=>console.warn('Font unavailable',font.family,error));
    }
    return ()=>{disposed=true;loaded.forEach(face=>document.fonts.delete(face));};
  },[fonts]);
}
