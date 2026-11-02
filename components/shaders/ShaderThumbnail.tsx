import React, { useId } from 'react';
import { ShaderConfig, shaderUsesSource } from '../../types/shaders';
import { ShaderCanvas } from './ShaderCanvas';
import { SHADER_DEMO_IMAGE } from '../../utils/shaderDemo';
/** Vector miniatures remain cheap; only the hovered/focused tile starts a live shader. */
export function ShaderThumbnail({shader,id,live}: {shader:ShaderConfig;id:string;live:boolean}) {
  const uid=useId().replace(/:/g,''),g='shg'+uid,r='shr'+uid;
  const target=shader.target||'surface';
  const rings=/rings|ripple|orbital|burst/.test(id),grid=/grid|pixels|halftone/.test(id);
  const metal=/liquid|chrome|brushed|pearl/.test(id),text=target==='text',media=target==='media';
  const node=<svg viewBox="0 0 100 64" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop stopColor={shader.colorA}/><stop offset="1" stopColor={shader.colorB}/></linearGradient><radialGradient id={r}><stop stopColor={shader.colorA}/><stop offset="1" stopColor={shader.colorB}/></radialGradient></defs>
    <rect width="100" height="64" fill={text?'#151222':`url(#${rings?r:g})`}/>
    {text?<text x="50" y="48" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="49" letterSpacing="-4" fill={`url(#${g})`}>Aa</text>:media?<>
      <circle cx="74" cy="17" r="9" fill="#fff" opacity=".75"/>
      <path d="M0 55 25 18 57 51 73 34 100 59v5H0Z" fill={shader.colorB}/><path d="m25 18-9 14 9-4 9 7Z" fill="#fff" opacity=".85"/>
      <path d="M0 54h100v10H0Z" fill={shader.colorA} opacity=".65"/>
      {/ripple/.test(id)&&[10,20,30,40].map(radius=><circle key={radius} cx="50" cy="34" r={radius} fill="none" stroke="#e5ffff" strokeWidth="2" opacity=".6"/>)}
      {/prism|vhs/.test(id)&&<path d="M0 25h100M0 39h100M0 50h100" stroke="#fff" strokeWidth="3" opacity=".35"/>}
      {/halftone/.test(id)&&Array.from({length:30},(_,i)=><circle key={i} cx={6+(i%10)*10} cy={7+Math.floor(i/10)*21} r="2.5" fill="#111" opacity=".55"/>)}
      {/pixels/.test(id)&&Array.from({length:20},(_,i)=><rect key={i} x={(i%5)*20} y={Math.floor(i/5)*16} width="19" height="15" fill={i%3?shader.colorA:shader.colorB} opacity=".3"/>)}
    </>:rings?<>{[8,17,26,35,44].map((radius,i)=><circle key={radius} cx="50" cy="32" r={radius} fill="none" stroke={i%2?'#fff':shader.colorA} strokeWidth="2" opacity={1-i*.14}/>)}</>:grid?<>{Array.from({length:7},(_,i)=><path key={i} d={`M${i*18} 0v64M0 ${i*14}h100`} stroke={shader.colorA} strokeWidth="1.5" opacity=".7"/>)}</>:<>
      {[0,1,2,3].map((i)=><path key={i} d={`M-10 ${18+i*12} Q 18 ${-8+i*11} 48 ${22+i*11} T 110 ${12+i*10}`} fill="none" stroke={i%2?'#fff':shader.colorA} strokeWidth={metal?8:5} opacity={metal?0.4:0.3}/>)}</>}
  </svg>;
  return <>{node}{live&&<span className="shader-mini-live" data-shader-surface>
    {shaderUsesSource(shader)&&(text?<span data-pwb-shader-source="text" className="shader-mini-text">Aa</span>:<img data-pwb-shader-source="media" crossOrigin="anonymous" src={SHADER_DEMO_IMAGE} alt=""/>)}
    <ShaderCanvas pageInput={target==='surface'} shader={{...shader,interactive:false,opacity:1}} surfaceSize={text?{width:100,height:64}:{width:600,height:360}}/>
  </span>}</>;
}
