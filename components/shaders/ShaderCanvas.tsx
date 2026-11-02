import React, { useEffect, useRef } from 'react';
import { ShaderConfig, shaderUsesSource } from '../../types/shaders';
import { startShader } from '../../utils/shaderRuntime';
export function ShaderCanvas({shader, onError, paused = false, backgroundColor = '#111827', pageInput = false, surfaceSize, demo=false}: {shader: ShaderConfig; surfaceSize?: {width:number;height:number}; demo?:boolean; backgroundColor?: string; pageInput?: boolean; paused?: boolean; onError?: (message: string)=>void}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const runtime=useRef<ReturnType<typeof startShader>>(null);
  const report=useRef(onError);report.current=onError;
  useEffect(()=>{
    const canvas=ref.current!;
    runtime.current=startShader(canvas,shader,message=>report.current?.(message));
    return ()=>{runtime.current?.dispose();runtime.current=null;if(!canvas.isConnected)canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();};
  },[shader.fragment,shader.interaction]);
  useEffect(()=>{runtime.current?.update(shader);},[shader]);
  useEffect(()=>{runtime.current?.setPaused(paused);},[paused,shader.fragment,shader.interaction]);
  return <>
    {!shaderUsesSource(shader)&&<span aria-hidden="true" style={{position:'absolute',inset:0,borderRadius:'inherit',pointerEvents:'none',background:shader.backgroundColor||backgroundColor,opacity:shader.backgroundOpacity??1}} />}
    <canvas key={(shader.interaction||'none')+':'+shader.fragment} ref={ref} data-pwb-shader-demo={demo?'true':undefined} data-pwb-shader-width={surfaceSize?.width} data-pwb-shader-height={surfaceSize?.height} data-pwb-shader-input={pageInput ? 'page' : undefined} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',borderRadius:'inherit'}} />
  </>;
}
