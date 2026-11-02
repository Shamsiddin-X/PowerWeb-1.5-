import { CanvasMetrics, canvasPoint, gestureDelta } from './canvasCoordinates';
export interface DragPosition { x: number; y: number; w: number; h: number; }
export interface DragSnapshot {
  pageId: string; layerId: string; primaryId: string; positions: Record<string, DragPosition>;
  metrics: CanvasMetrics; clientX: number; clientY: number;
}
interface DragDependencies {
  metrics: () => CanvasMetrics | null;
  valid: (snapshot: DragSnapshot) => boolean;
  snap: (snapshot: DragSnapshot, dx: number, dy: number) => { dx: number; dy: number; lines: any[] };
  preview: (snapshot: DragSnapshot, dx: number, dy: number) => void;
  finishPreview: (snapshot: DragSnapshot, dx: number, dy: number, cancel: boolean) => void;
  commit: (ids: string[], dx: number, dy: number) => void;
  active: (active: boolean) => void;
  guides: (lines: any[]) => void;
  frame: (callback: () => void) => number;
  cancelFrame: (id: number) => void;
}
/** Mutable session owns the gesture immediately; rendering and duplicate mouseup cannot replay it. */
export class CanvasDragSession {
  private session: DragSnapshot | null = null;
  private delta = { x: 0, y: 0 };
  private moved = false;
  private frameId = 0;
  constructor(private deps: DragDependencies) {}
  get active() { return this.session !== null; }
  begin(snapshot: DragSnapshot) {
    this.end(true);
    if (!Object.keys(snapshot.positions).length) return;
    this.session = snapshot; this.delta = { x: 0, y: 0 }; this.moved = false;
    this.deps.active(true);
  }
  move(clientX: number, clientY: number): boolean {
    const snapshot = this.session;
    if (!snapshot) return false;
    const metrics = this.deps.metrics();
    if (!metrics || !this.deps.valid(snapshot) || Math.abs(metrics.scaleX - snapshot.metrics.scaleX) > .001 || Math.abs(metrics.scaleY - snapshot.metrics.scaleY) > .001) {
      this.end(true); return false;
    }
    if (!this.moved && Math.hypot(clientX - snapshot.clientX, clientY - snapshot.clientY) < 3) return true;
    this.moved = true;
    const start = canvasPoint(snapshot.clientX, snapshot.clientY, snapshot.metrics);
    const raw = gestureDelta(start, clientX, clientY, metrics);
    const result = this.deps.snap(snapshot, raw.x, raw.y);
    this.delta = { x: result.dx, y: result.dy }; this.deps.guides(result.lines);
    this.deps.cancelFrame(this.frameId);
    this.frameId = this.deps.frame(() => {
      if (this.session === snapshot) this.deps.preview(snapshot, this.delta.x, this.delta.y);
    });
    return true;
  }
  validate() { if (this.session && !this.deps.valid(this.session)) this.end(true); }
  end(cancel = false) {
    const snapshot = this.session;
    if (!snapshot) return;
    // Clear before any store write or DOM callbacks can re-enter this handler.
    this.session = null; this.deps.cancelFrame(this.frameId); this.frameId = 0;
    const aborted = cancel || !this.deps.valid(snapshot);
    const delta = aborted || !this.moved ? { x: 0, y: 0 } : this.delta;
    this.deps.finishPreview(snapshot, delta.x, delta.y, aborted);
    if (!aborted && (delta.x || delta.y)) this.deps.commit(Object.keys(snapshot.positions), delta.x, delta.y);
    this.deps.guides([]); this.deps.active(false);
  }
}
