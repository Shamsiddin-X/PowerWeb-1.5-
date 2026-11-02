import { isTauri } from './platform';
export interface Plugin { name: string; code: string; }
export async function loadPlugins(): Promise<Plugin[]> {
  if (!isTauri()) return [];
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<Plugin[]>('load_plugins');
}
/** Local plugins are trusted code, not a security sandbox. Only explicit user activation runs them. */
export async function executePlugin(plugin: Plugin, api: Record<string, unknown>): Promise<void> {
  const fn = new Function('PowerWeb', plugin.code);
  await fn(api);
}
