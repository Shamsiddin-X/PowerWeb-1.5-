export type ShaderInteraction = 'none' | 'pointer' | 'hover' | 'click';
export type ShaderTarget = 'surface' | 'object' | 'media' | 'text';
export interface ShaderConfig {
  /** Missing in older files: a procedural surface/background. */
  target?: ShaderTarget;
  name: string;
  fragment: string;
  colorA: string;
  colorB: string;
  speed: number;
  scale: number;
  /** Visual size in percent; independent of the surface size and editor zoom. */
  size?: number;
  intensity: number;
  opacity: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
  /** Optional to keep previously saved PWB/PWS files compatible. */
  interaction?: ShaderInteraction;
  /** Preserve the preset trigger while independently disabling pointer reactions. */
  interactive?: boolean;
  animated?: boolean;
  response?: number;
  radius?: number;
  strength?: number;
}
export function isShaderConfig(value: unknown): value is ShaderConfig {
  const s = value as ShaderConfig;
  return !!s && typeof s.name === 'string' && s.name.length <= 100
    && (s.target === undefined || ['surface','object','media','text'].includes(s.target))
    && typeof s.fragment === 'string' && s.fragment.length > 0 && s.fragment.length <= 30000
    && /^#[0-9a-f]{6}$/i.test(s.colorA) && /^#[0-9a-f]{6}$/i.test(s.colorB)
    && (s.size === undefined || (Number.isFinite(s.size) && s.size >= 10 && s.size <= 400))
    && (s.backgroundColor === undefined || /^#[0-9a-f]{6}$/i.test(s.backgroundColor))
    && (s.backgroundOpacity === undefined || (Number.isFinite(s.backgroundOpacity) && s.backgroundOpacity >= 0 && s.backgroundOpacity <= 1))
    && (s.interaction === undefined || ['none','pointer','hover','click'].includes(s.interaction))
    && (s.interactive === undefined || typeof s.interactive === 'boolean')
    && (s.animated === undefined || typeof s.animated === 'boolean')
    && ([['response',0,1],['radius',0.05,1],['strength',0,3]] as const).every(([key,min,max]) =>
      s[key] === undefined || (typeof s[key] === 'number' && Number.isFinite(s[key]) && s[key]! >= min && s[key]! <= max))
    && ([['speed',0,5],['scale',0.2,10],['intensity',0,3],['opacity',0,1]] as const).every(([key,min,max]) =>
      typeof s[key] === 'number' && Number.isFinite(s[key]) && s[key] >= min && s[key] <= max);
}
const SHADER_SHAPES = ['rect','roundedRect','circle','button','triangle','rightTriangle','diamond','parallelogram','trapezoid','pentagon','hexagon','octagon','star','star4','star6','arrowRight','arrowLeft','arrowUp','arrowDown','cross','heart','message'];
export const shaderSupports = (type: string) => SHADER_SHAPES.includes(type)||['image','video','text'].includes(type);
export const shaderUsesSource = (shader: ShaderConfig) => shader.target === 'media' || shader.target === 'text';
export function shaderCanApply(shader: ShaderConfig, type?: string): boolean {
  if (!type) return !shader.target || shader.target === 'surface';
  if (shader.target === 'text') return type === 'text';
  if (shader.target === 'media') return type === 'image' || type === 'video';
  return SHADER_SHAPES.includes(type);
}
export const SHADER_TARGET_LABELS = {surface:'Фон',object:'Объект',media:'Фото / видео',text:'Текст'};
