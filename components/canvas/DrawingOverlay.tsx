// components/canvas/DrawingOverlay.tsx — Preview of element being drawn

import React from 'react';
import { CanvasElement } from '../../types';
import { CanvasElementRenderer } from './CanvasElement';

interface Props {
  element: CanvasElement | null;
  scale: number;
}

export const DrawingOverlay: React.FC<Props> = ({ element, scale }) => {
  if (!element) return null;
  return (
    <div style={{
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      zIndex: 9999,
      opacity: 0.7,
      pointerEvents: 'none',
    }}>
      <CanvasElementRenderer element={element} isSelected scale={scale} />
    </div>
  );
};
