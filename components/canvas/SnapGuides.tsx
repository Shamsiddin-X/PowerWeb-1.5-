// components/canvas/SnapGuides.tsx — Red alignment guide lines

import React from 'react';
import { SnapLine } from '../../hooks/useCanvasSnap';

interface Props {
  lines: SnapLine[];
}

export const SnapGuides: React.FC<Props> = ({ lines }) => {
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}
          className="absolute bg-red-500 pointer-events-none"
          style={{
            zIndex: 9998,
            opacity: 0.8,
            left:   line.orientation === 'vertical'   ? line.position : 0,
            top:    line.orientation === 'horizontal' ? line.position : 0,
            width:  line.orientation === 'vertical'   ? 1 : '100%',
            height: line.orientation === 'horizontal' ? 1 : '100%',
          }}
        />
      ))}
    </>
  );
};
