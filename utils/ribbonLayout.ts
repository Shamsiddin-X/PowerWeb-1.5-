/** Keep complete groups on the fixed-height ribbon; overflow stays available in a menu. */
export function visibleRibbonGroupCount(widths: number[], available: number): number {
  let used = 0, count = 0;
  for (const width of widths) {
    if (used + width > Math.max(0, available)) break;
    used += width; count++;
  }
  return count;
}
export const RIBBON_PANEL_HEIGHT = 100;
export type RibbonTab = 'Home' | 'Insert' | 'Format' | 'Logic' | 'Animations' | 'Shaders' | 'View' | 'Plugins';
export function resolveRibbonTab(tab: RibbonTab, hasSelection: boolean): RibbonTab {
  return !hasSelection && (tab === 'Format' || tab === 'Logic') ? 'Home' : tab;
}
