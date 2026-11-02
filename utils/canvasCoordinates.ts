export interface CanvasMetrics { left: number; top: number; scaleX: number; scaleY: number; }
/** Read the actual rendered transform, including CSS zoom of the editor UI. */
export function canvasMetrics(node: HTMLElement | null, fallbackScale = 1): CanvasMetrics | null {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  const scaleX = node.offsetWidth > 0 ? rect.width / node.offsetWidth : fallbackScale;
  const scaleY = node.offsetHeight > 0 ? rect.height / node.offsetHeight : fallbackScale;
  return { left: rect.left, top: rect.top,
    scaleX: Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1 };
}
export function canvasPoint(clientX: number, clientY: number, metrics: CanvasMetrics) {
  return { x: (clientX - metrics.left) / metrics.scaleX, y: (clientY - metrics.top) / metrics.scaleY };
}
export function gestureDelta(start: { x: number; y: number }, clientX: number, clientY: number, metrics: CanvasMetrics) {
  const current = canvasPoint(clientX, clientY, metrics);
  return { x: current.x - start.x, y: current.y - start.y };
}

export function canvasMouseIntent(button: number, spacePressed: boolean, overElement: boolean): 'pan' | 'select' | 'context' | 'none' {
  if (button === 2 && overElement) return 'context';
  if (button === 1 || button === 2 || (button === 0 && spacePressed)) return 'pan';
  return button === 0 ? 'select' : 'none';
}
