import React from 'react';
import { ElementType } from '../../types';
import { getSvgPath } from '../../utils/shapeData';

export const SHAPE_GROUPS: { label: string; types: ElementType[] }[] = [
  { label: 'Basic Shapes', types: ['rect', 'roundedRect', 'circle', 'line'] },
  { label: 'Polygons', types: ['triangle', 'rightTriangle', 'diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon'] },
  { label: 'Arrows', types: ['arrowRight', 'arrowLeft', 'arrowUp', 'arrowDown'] },
  { label: 'Stars and Symbols', types: ['star', 'star4', 'star6', 'cross', 'heart', 'message'] },
];
export const SHAPE_LABELS: Record<string, string> = {
  rect: 'Rectangle', roundedRect: 'Rounded Rectangle', circle: 'Ellipse', line: 'Line',
  triangle: 'Triangle', rightTriangle: 'Right Triangle', diamond: 'Diamond', parallelogram: 'Parallelogram',
  trapezoid: 'Trapezoid', pentagon: 'Pentagon', hexagon: 'Hexagon', octagon: 'Octagon',
  arrowRight: 'Right Arrow', arrowLeft: 'Left Arrow', arrowUp: 'Up Arrow', arrowDown: 'Down Arrow',
  star: 'Five-point Star', star4: 'Four-point Star', star6: 'Six-point Star', cross: 'Cross', heart: 'Heart', message: 'Callout',
};
export const ShapeIcon = React.memo(({ type, className = '' }: { type: ElementType; className?: string }) => (
  <svg viewBox="-8 -8 116 116" className={className} fill="currentColor" fillOpacity=".10" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
    {type === 'rect' || type === 'roundedRect' ? <rect x="5" y="10" width="90" height="80" rx={type === 'roundedRect' ? 18 : 2} />
      : type === 'circle' ? <ellipse cx="50" cy="50" rx="46" ry="38" />
      : type === 'line' ? <path d="M8 76 92 24" fill="none" />
      : type === 'heart' ? <path d={getSvgPath(type)} /> : <polygon points={getSvgPath(type)} />}
  </svg>
));
