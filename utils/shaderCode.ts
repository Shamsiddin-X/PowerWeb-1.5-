import { ShaderTarget } from '../types/shaders';
/** Accept a WebGL fragment or a Shadertoy mainImage body without running JavaScript. */
export function prepareShaderCode(raw:string,target:ShaderTarget):string {
  let code=raw.trim();
  if(!code)return '';
  // Shadertoy's standard uniforms are supplied by PowerWeb instead.
  code=code.replace(/uniform\s+(?:float|vec3|vec4|sampler2D)\s+(?:iTime|iResolution|iMouse|iChannel0)\s*;/g,'')
    .replace(/\biTime\b/g,'u_time').replace(/\biResolution\b/g,'vec3(u_resolution,1.0)')
    .replace(/\biMouse\b/g,'vec4(u_mouse*u_resolution,0.0,0.0)').replace(/\biChannel0\b/g,'u_source');
  if(!/void\s+main\s*\(/.test(code)&&/void\s+mainImage\s*\(/.test(code))code+='\nvoid main(){mainImage(gl_FragColor,gl_FragCoord.xy);}\n';
  const uniforms: [string,string][]=[['vec2','u_resolution'],['vec2','u_surfaceSize'],['vec2','u_sourceSize'],['vec2','u_mouse'],['vec2','u_trail'],['vec2','u_clickPosition'],['vec3','u_colorA'],['vec3','u_colorB'],['float','u_time'],['float','u_scale'],['float','u_size'],['float','u_intensity'],['float','u_hover'],['float','u_click'],['float','u_clickAge'],['float','u_radius'],['float','u_strength'],['float','u_clickCount'],['float','u_amount'],['sampler2D','u_source']];
  let declarations=uniforms.filter(([,name])=>!new RegExp('uniform\\s+[^;]*\\b'+name+'\\b').test(code)).map(([type,name])=>`uniform ${type} ${name};`).join('\n');
  if(!/uniform\s+vec3\s+u_clicks\s*\[/.test(code))declarations+='\nuniform vec3 u_clicks[12];';
  if(target==='text'||target==='media'){
    code=code.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/,'void pwbUserMain()');
    code+=`\nvoid main(){
      vec2 uv=gl_FragCoord.xy/u_resolution;
      vec2 cover=vec2(min(1.0,(u_resolution.x/u_resolution.y)/(u_sourceSize.x/u_sourceSize.y)),min(1.0,(u_sourceSize.x/u_sourceSize.y)/(u_resolution.x/u_resolution.y)));
      vec4 original=texture2D(u_source,(uv-0.5)*cover+0.5);
      pwbUserMain();
      ${target==='text'?'gl_FragColor.a*=original.a;':''}
      gl_FragColor=mix(original,gl_FragColor,u_amount);
    }`;
  }
  const precision=/precision\s+\w+\s+float\s*;/.test(code)?'':'precision mediump float;\n';
  const version=code.match(/^#version[^\n]*\n/);
  if(version)code=code.slice(version[0].length);
  return (version?.[0]||'')+precision+declarations+'\n'+code;
}
export const SHADER_CODE_EXAMPLE=`void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float wave = sin(uv.x * 8.0 + uv.y * 4.0 - u_time);
  vec3 color = mix(u_colorA, u_colorB, wave * 0.5 + 0.5);
  gl_FragColor = vec4(color, 1.0);
}`;
