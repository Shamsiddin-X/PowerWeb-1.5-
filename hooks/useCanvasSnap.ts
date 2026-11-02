// hooks/useCanvasSnap.ts — Snap-to-element algorithm

import { useCallback } from 'react';
import { Layer } from '../types';

export interface SnapLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
}

interface SnapResult {
  dx: number;
  dy: number;
  lines: SnapLine[];
}

/** Snaps (dx, dy) delta so that the primary element aligns to others in the layer. */
export const computeCanvasSnap = (
    primaryId: string,
    selectedIds: string[],
    initPositions: Record<string, { x: number; y: number; w: number; h: number }>,
    rawDX: number,
    rawDY: number,
    layer: Layer,
    scale: number,
  ): SnapResult => {
    const init = initPositions[primaryId];
    if (!init) return { dx: rawDX, dy: rawDY, lines: [] };

    const THRESHOLD = 5 / scale;
    const curX = init.x + rawDX;
    const curY = init.y + rawDY;
    const vP = [curX, curX + init.w / 2, curX + init.w];
    const hP = [curY, curY + init.h / 2, curY + init.h];
    let snapX: number | null = null;
    let snapY: number | null = null;

    layer.elements.forEach(other => {
      if (selectedIds.includes(other.id)) return;
      [other.x, other.x + other.width / 2, other.x + other.width].forEach(ox => {
        vP.forEach(vx => {
          if (Math.abs(vx - ox) < THRESHOLD) {
            if (snapX === null || Math.abs(vx - ox) < Math.abs(snapX)) snapX = vx - ox;
          }
        });
      });
      [other.y, other.y + other.height / 2, other.y + other.height].forEach(oy => {
        hP.forEach(hy => {
          if (Math.abs(hy - oy) < THRESHOLD) {
            if (snapY === null || Math.abs(hy - oy) < Math.abs(snapY)) snapY = hy - oy;
          }
        });
      });
    });

    const finalDX = snapX !== null ? rawDX - snapX : rawDX;
    const finalDY = snapY !== null ? rawDY - snapY : rawDY;

    // Build visible guide lines
    const finalX = init.x + finalDX;
    const finalY = init.y + finalDY;
    const lines: SnapLine[] = [];

    layer.elements.forEach(other => {
      if (selectedIds.includes(other.id)) return;
      [other.x, other.x + other.width / 2, other.x + other.width].forEach(ox => {
        [finalX, finalX + init.w / 2, finalX + init.w].forEach(mx => {
          if (Math.abs(mx - ox) < 1 && !lines.some(l => l.orientation === 'vertical' && Math.abs(l.position - ox) < 1))
            lines.push({ orientation: 'vertical', position: ox });
        });
      });
      [other.y, other.y + other.height / 2, other.y + other.height].forEach(oy => {
        [finalY, finalY + init.h / 2, finalY + init.h].forEach(my => {
          if (Math.abs(my - oy) < 1 && !lines.some(l => l.orientation === 'horizontal' && Math.abs(l.position - oy) < 1))
            lines.push({ orientation: 'horizontal', position: oy });
        });
      });
    });

    return { dx: finalDX, dy: finalDY, lines };
  };

export function useCanvasSnap() {
  const computeSnap = useCallback(computeCanvasSnap, []);
  return { computeSnap };
}
