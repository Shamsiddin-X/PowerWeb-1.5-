// services/platform.ts — Single source of truth for platform detection

/**
 * Returns true when running inside a Tauri desktop app.
 * Both V1 and V2 Tauri internals are checked.
 */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    (
      (window as any).__TAURI_INTERNALS__ !== undefined ||
      (window as any).__TAURI__ !== undefined
    )
  );
}

/** Returns the current platform label for debug purposes. */
export function getPlatformLabel(): 'tauri' | 'web' {
  return isTauri() ? 'tauri' : 'web';
}
