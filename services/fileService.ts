// services/fileService.ts — Platform-agnostic file I/O (Tauri vs Web)

import { Project } from '../types';
import { PowerWebCodeGenerator } from '../codegen/htmlCssJsGenerator';

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined);

// ─── Dynamic Tauri imports (only in desktop) ─────────────────────────────────

async function tauriDialog() {
  return import('@tauri-apps/plugin-dialog');
}
async function tauriFs() {
  return import('@tauri-apps/plugin-fs');
}
async function tauriCore() {
  return import('@tauri-apps/api/core');
}

// ─── Save Project ─────────────────────────────────────────────────────────────

export async function saveProject(project: Project): Promise<void> {
  const fileData = {
    signature: 'POWERWEB_PROJECT',
    version: '1.5.0',
    savedAt: Date.now(),
    project,
  };
  const json = JSON.stringify(fileData, null, 2);

  if (isTauri()) {
    const { save } = await tauriDialog();
    const { writeTextFile } = await tauriFs();
    const path = await save({
      filters: [{ name: 'PowerWeb Project', extensions: ['pwb'] }],
      defaultPath: `${project.name}.pwb`,
    });
    if (path) await writeTextFile(path, json);
  } else {
    downloadBlob(json, `${project.name}.pwb`, 'application/json');
  }
}

// ─── Open Project ─────────────────────────────────────────────────────────────

export async function openProject(): Promise<Project | null> {
  if (isTauri()) {
    const { open } = await tauriDialog();
    const { readTextFile } = await tauriFs();
    const selected = await open({
      multiple: false,
      filters: [{ name: 'PowerWeb Project', extensions: ['pwb'] }],
    });
    if (!selected || typeof selected !== 'string') return null;
    const content = await readTextFile(selected);
    return parsePWB(content);
  } else {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pwb';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (ev) => resolve(parsePWB(ev.target?.result as string));
        reader.readAsText(file);
      };
      input.click();
    });
  }
}

function parsePWB(content: string): Project | null {
  try {
    const data = JSON.parse(content);
    if (data.signature === 'POWERWEB_PROJECT' && data.project) {
      return data.project as Project;
    }
    return null;
  } catch {
    alert('Failed to parse project file. It may be corrupted.');
    return null;
  }
}

// ─── Export ZIP / HTML ────────────────────────────────────────────────────────

export async function exportProject(project: Project): Promise<void> {
  const generator = new PowerWebCodeGenerator(project);
  const { html, css, js } = generator.generate();

  if (isTauri()) {
    const { save } = await tauriDialog();
    const { invoke } = await tauriCore();
    const savePath = await save({
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      defaultPath: `${project.name.replace(/\s+/g, '_')}.zip`,
    });
    if (!savePath) return;
    await invoke('export_zip', { savePath, html, css: css || '', js: js || '', projectName: project.name });
  } else {
    const fullHtml = buildFullHtml(project.name, html, css || '', js || '');
    downloadBlob(fullHtml, `${project.name.replace(/\s+/g, '_')}.html`, 'text/html');
  }
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export async function previewProject(project: Project): Promise<void> {
  const generator = new PowerWebCodeGenerator(project);
  const { html, css, js } = generator.generate();

  if (isTauri()) {
    const { invoke } = await tauriCore();
    const fullHtml = buildFullHtml(project.name, html, css || '', js || '');
    await invoke('preview_html', { html: fullHtml });
  } else {
    const fullHtml = buildFullHtml(project.name, html, css || '', js || '');
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(fullHtml);
      newWindow.document.close();
    } else {
      alert('Popup blocked. Please allow popups for preview.');
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFullHtml(name: string, htmlBody: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>${css}</style>
</head>
<body>
${htmlBody}
<script>${js}</script>
</body>
</html>`;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Open Plugins Folder ──────────────────────────────────────────────────────

export async function openPluginsFolder(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await tauriCore();
    await invoke('open_plugins_folder');
  } else {
    alert('Plugin folder is only available in the desktop version.');
  }
}
