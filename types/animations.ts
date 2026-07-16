// types/animations.ts — Animation types and presets

export type AnimationEasing = 
  | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' 
  | 'linear' | 'cubic-bezier(0.34,1.56,0.64,1)';

export interface Animation {
  id: string;
  name: string;
  trigger: 'onScroll' | 'onLoad' | 'onClick' | 'onHover';
  duration: number;
  delay: number;
  easing?: AnimationEasing;
  iterationCount?: number | 'infinite';
}

export interface AnimationPreset {
  name: string;
  key: string;
  category: 'Entrance' | 'Exit' | 'Attention' | 'Continuous';
  icon: string;
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // --- Entrance ---
  { name: 'Fade In',       key: 'fadeIn',       category: 'Entrance', icon: '✨' },
  { name: 'Fade In Up',    key: 'fadeInUp',     category: 'Entrance', icon: '⬆️' },
  { name: 'Fade In Down',  key: 'fadeInDown',   category: 'Entrance', icon: '⬇️' },
  { name: 'Fade In Left',  key: 'fadeInLeft',   category: 'Entrance', icon: '◀️' },
  { name: 'Fade In Right', key: 'fadeInRight',  category: 'Entrance', icon: '▶️' },
  { name: 'Zoom In',       key: 'zoomIn',       category: 'Entrance', icon: '🔍' },
  { name: 'Zoom In Up',    key: 'zoomInUp',     category: 'Entrance', icon: '🔎' },
  { name: 'Bounce In',     key: 'bounceIn',     category: 'Entrance', icon: '🎾' },
  { name: 'Slide In Up',   key: 'slideInUp',    category: 'Entrance', icon: '🚀' },
  { name: 'Slide In Left', key: 'slideInLeft',  category: 'Entrance', icon: '⏩' },
  { name: 'Slide In Right',key: 'slideInRight', category: 'Entrance', icon: '⏪' },
  { name: 'Flip In X',     key: 'flipInX',      category: 'Entrance', icon: '🔄' },
  { name: 'Flip In Y',     key: 'flipInY',      category: 'Entrance', icon: '🔃' },
  { name: 'Roll In',       key: 'rollIn',       category: 'Entrance', icon: '🎲' },
  { name: 'Back In Down',  key: 'backInDown',   category: 'Entrance', icon: '📥' },
  { name: 'Back In Up',    key: 'backInUp',     category: 'Entrance', icon: '📤' },
  { name: 'Rotate In',     key: 'rotateIn',     category: 'Entrance', icon: '🌀' },
  { name: 'Light Speed In',key: 'lightSpeedIn', category: 'Entrance', icon: '⚡' },
  // --- Attention ---
  { name: 'Pulse',         key: 'pulse',        category: 'Attention', icon: '💓' },
  { name: 'Bounce',        key: 'bounce',       category: 'Attention', icon: '🏀' },
  { name: 'Shake',         key: 'shake',        category: 'Attention', icon: '📳' },
  { name: 'Swing',         key: 'swing',        category: 'Attention', icon: '🎸' },
  { name: 'Rubber Band',   key: 'rubberBand',   category: 'Attention', icon: '🪢' },
  { name: 'Jello',         key: 'jello',        category: 'Attention', icon: '🍮' },
  { name: 'Wobble',        key: 'wobble',       category: 'Attention', icon: '〰️' },
  { name: 'Tada',          key: 'tada',         category: 'Attention', icon: '🎉' },
  { name: 'Flash',         key: 'flash',        category: 'Attention', icon: '💥' },
  { name: 'Heart Beat',    key: 'heartBeat',    category: 'Attention', icon: '❤️' },
  // --- Continuous ---
  { name: 'Spin',          key: 'spin',         category: 'Continuous', icon: '⚙️' },
  { name: 'Float',         key: 'float',        category: 'Continuous', icon: '🎈' },
  { name: 'Glow',          key: 'glow',         category: 'Continuous', icon: '🌟' },
  // --- Exit ---
  { name: 'Fade Out',      key: 'fadeOut',      category: 'Exit', icon: '👻' },
  { name: 'Zoom Out',      key: 'zoomOut',      category: 'Exit', icon: '📉' },
  { name: 'Slide Out Down',key: 'slideOutDown', category: 'Exit', icon: '🌊' },
];
