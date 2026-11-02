// components/canvas/MarqueeOverlay.tsx — Rubber-band selection box

import React from 'react';
import { MarqueeBox } from '../../hooks/useCanvasMarquee';

interface Props {
  box: MarqueeBox | null;
}

export const MarqueeOverlay: React.FC<Props> = ({ box }) => {
  if (!box || (box.w < 2 && box.h < 2)) return null;
  return (
    <div style={{
      position: 'absolute',
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      backgroundColor: 'rgba(59,130,246,0.08)',
      border: '1.5px solid rgba(59,130,246,0.6)',
      borderRadius: 2,
      zIndex: 9999,
      pointerEvents: 'none',
    }} />
  );
};
