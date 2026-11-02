import { Project } from '../types';
import { dataUrl } from './projectContainer/assets';

/** Blob URLs belong to the editor's origin and cannot survive a native file preview. */
export async function preparePreviewResources(project: Project): Promise<Project> {
  const resources = new Map<string, Promise<string>>();
  const embed = (source: string) => {
    let pending = resources.get(source);
    if (!pending) {
      pending = (async () => {
        const response = await fetch(source);
        if (!response.ok) throw new Error('Не удалось загрузить ресурс предпросмотра.');
        const blob = await response.blob();
        return dataUrl(new Uint8Array(await blob.arrayBuffer()), blob.type || 'application/octet-stream');
      })();
      resources.set(source, pending);
    }
    return pending;
  };
  const snapshot = structuredClone(project);
  const walk = async (value: unknown, resource = false): Promise<unknown> => {
    if (Array.isArray(value)) return Promise.all(value.map(item => walk(item)));
    if (value && typeof value === 'object') {
      return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await walk(item, key === 'source' || key === 'content' && ['image','video'].includes((value as {type?:string}).type || ''))])));
    }
    if (typeof value !== 'string') return value;
    if (resource && value.startsWith('blob:')) return embed(value);
    let result = value;
    for (const match of value.matchAll(/url\(\s*(['"]?)(blob:[^'"\s)]+)\1\s*\)/g)) {
      result = result.replace(match[0], `url("${await embed(match[2])}")`);
    }
    return result;
  };
  return await walk(snapshot) as Project;
}
