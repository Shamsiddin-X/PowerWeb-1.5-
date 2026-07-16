// services/pluginService.ts — Plugin loading and safe execution

export interface Plugin {
  name: string;
  code: string;
}

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined);

export async function loadPlugins(): Promise<Plugin[]> {
  if (!isTauri()) return [];
  try {
    const { readDir, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const entries = await readDir('plugins', { baseDir: BaseDirectory.Resource });
    const plugins: Plugin[] = [];
    for (const entry of entries) {
      if (entry.isFile && entry.name?.endsWith('.js')) {
        const code = await readTextFile(`plugins/${entry.name}`, { baseDir: BaseDirectory.Resource });
        plugins.push({ name: entry.name, code });
      }
    }
    return plugins;
  } catch (e) {
    console.error('Failed to load plugins:', e);
    return [];
  }
}

export function executePlugin(plugin: Plugin, api: Record<string, unknown>): void {
  try {
    const fn = new Function('PowerWeb', plugin.code);
    fn(api);
    console.log(`[Plugin: ${plugin.name}] Executed successfully.`);
  } catch (e) {
    console.error(`[Plugin: ${plugin.name}] Error:`, e);
  }
}
