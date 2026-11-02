// components/canvas/PanOverlay.tsx — Full-screen overlay during pan for grabbing events

import React from 'react';

interface Props {
  isPanning: boolean;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export const PanOverlay: React.FC<Props> = ({ isPanning, onMouseMove, onMouseUp }) => {
  if (!isPanning) return null;
  return (
    <div
      className="fixed inset-0 z-[99999]"
      style={{ cursor: 'grabbing' }}
    />
  );
};
