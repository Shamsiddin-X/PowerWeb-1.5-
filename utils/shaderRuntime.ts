import { ShaderConfig } from '../types/shaders';
import { startShader as renderShader } from './shaderRenderer.js';
export function startShader(canvas:HTMLCanvasElement,shader:ShaderConfig,onError?:(message:string)=>void){
  return renderShader(canvas,shader,onError);
}
