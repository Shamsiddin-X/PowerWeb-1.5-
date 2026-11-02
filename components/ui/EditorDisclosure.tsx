import './editorControls.css';
import React, { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
export function EditorDisclosure({label,children}: {label:string;children:React.ReactNode}) {
  const [open,setOpen]=useState(false),id=useId();
  return <section className="editor-disclosure"><button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><ChevronRight size={13} style={{transform:open?'rotate(90deg)':undefined}}/>{label}</button><div id={id} hidden={!open}>{children}</div></section>;
}
