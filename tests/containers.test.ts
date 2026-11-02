import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installCanvasDocument } from './support/canvas';
import { DEFAULT_STYLE, Project } from '../types';
import { validateProject } from '../utils/fileFormat';
import { archivePath, createZip, readZip, textOf, utf8 } from '../utils/zipArchive';
import {
  createPwbContainer,
  readPwbContainer,
  readPwbEntries,
} from '../services/projectContainer/container';
import { createExportPackage } from '../services/exportService';
import { SHADER_PRESETS } from '../utils/shaderPresets';

const picture = 'data:image/png;base64,AA==';
const project = (): Project => ({
  id: 'project',
  name: 'Portable project',
  activePageId: 'page',
  fonts: [{ id: 'font', family: 'Fixture Font', source: 'data:font/woff2;base64,AQID' }],
  pages: [
    {
      id: 'page',
      name: 'Главная',
      width: 1200,
      height: 800,
      backgroundColor: '#fff',
      layers: [
        {
          id: 'visible',
          name: 'Content',
          visible: true,
          locked: false,
          elements: [
            {
              id: 'text',
              type: 'text',
              x: 20,
              y: 20,
              width: 200,
              height: 50,
              style: { ...DEFAULT_STYLE, fontFamily: 'Fixture Font' },
              content: 'assets/images/plain-text.png',
            },
          ],
        },
        {
          id: 'hidden',
          name: 'Hidden assets',
          visible: false,
          locked: false,
          shader: structuredClone(SHADER_PRESETS[0].config),
          elements: ['one', 'two'].map((id) => ({
            id,
            type: 'image',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            style: { ...DEFAULT_STYLE },
            content: picture,
          })),
        },
      ],
    },
  ],
});

async function packed() {
  const restore = installCanvasDocument();
  try {
    return await createPwbContainer(project());
  } finally {
    restore();
  }
}

test('PWB round-trip preserves hidden media, fonts, shaders and ordinary resource-looking text', async () => {
  const input = project(),
    before = structuredClone(input),
    restore = installCanvasDocument();
  try {
    const container = await createPwbContainer(input);
    const restored = await readPwbContainer(container.bytes);
    assert.deepEqual(input, before);
    assert.deepEqual(restored.project, validateProject(before));
    assert.match(restored.preview!, /^data:image\/png;base64,/);
    const files = await readZip(container.bytes);
    const manifest = JSON.parse(textOf(files.get('manifest.json')!));
    assert.equal(manifest.formatVersion, '2.0.0');
    assert.equal(
      manifest.assets.filter((asset: any) => asset.path.startsWith('assets/images/')).length,
      1,
    );
    assert.equal(manifest.shaders.length, 1);
    const model = JSON.parse(textOf(files.get('project.json')!));
    assert.match(model.pages[0].layers[1].elements[0].content, /^assets\/images\//);
    assert.equal(
      model.pages[0].layers[1].elements[0].content,
      model.pages[0].layers[1].elements[1].content,
    );
  } finally {
    restore();
  }
});

test('PWB loader also accepts the committed legacy JSON fixture', async () => {
  const loaded = await readPwbContainer(
    new Uint8Array(await readFile('tests/fixtures/legacy-0.4.pwb')),
  );
  assert.equal(loaded.project.pages[0].transition, 'push_left');
  assert.equal(loaded.project.pages[0].layers[0].elements[0].style.opacity, 1);
});

test('PWB rejects an asset with changed bytes even when the ZIP checksums are valid', async () => {
  const files = await readZip((await packed()).bytes);
  const manifest = JSON.parse(textOf(files.get('manifest.json')!));
  const path = manifest.assets[0].path;
  const changed = new Uint8Array(files.get(path)!);
  changed[0] ^= 1;
  files.set(path, changed);
  await assert.rejects(readPwbContainer(createZip(files)), /Повреждён ресурс/);
});

test('PWB rejects missing assets, unsupported versions and mismatched page IDs', async () => {
  const original = await readZip((await packed()).bytes);
  const manifest = JSON.parse(textOf(original.get('manifest.json')!));
  const missing = new Map(original);
  missing.delete(manifest.assets[0].path);
  await assert.rejects(readPwbEntries(missing), /Повреждён ресурс/);
  for (const patch of [{ formatVersion: '3.0.0' }, { pages: [{ id: 'other' }] }]) {
    const files = new Map(original);
    files.set('manifest.json', utf8(JSON.stringify({ ...manifest, ...patch })));
    await assert.rejects(readPwbEntries(files));
  }
});

test('ZIP preserves binary files and UTF-8 names and rejects corruption or truncation', async () => {
  const files = new Map([['ресурсы/файл.bin', new Uint8Array([0, 255, 12, 34])]]);
  const bytes = createZip(files);
  assert.deepEqual(await readZip(bytes), files);
  const changed = new Uint8Array(bytes);
  changed[30 + utf8('ресурсы/файл.bin').length] ^= 1;
  await assert.rejects(readZip(changed), /Повреждены данные/);
  await assert.rejects(readZip(bytes.subarray(0, bytes.length - 1)));
});

test('ZIP refuses traversal and absolute paths before writing entries', () => {
  for (const path of [
    '../secret',
    'assets/../../secret',
    '/absolute',
    'C:/file',
    'assets\\file',
    './file',
    'bad\0file',
  ]) {
    assert.throws(() => archivePath(path), /Недопустимый путь/);
    assert.throws(() => createZip(new Map([[path, utf8('data')]])));
  }
});

test('static HTML exports omit runtime and hidden media but retain referenced fonts', async () => {
  const input = project(),
    before = structuredClone(input);
  const result = await createExportPackage(input);
  assert.deepEqual(input, before);
  assert.deepEqual(await readZip(result.bytes), result.files);
  assert.ok(result.files.has('index.html'));
  assert.ok(result.files.has('styles.css'));
  assert.ok(!result.files.has('script.js'));
  assert.equal(
    [...result.files.keys()].filter(
      (path) => path.startsWith('assets/images/') && !path.endsWith('/'),
    ).length,
    0,
  );
  assert.equal(
    [...result.files.keys()].filter(
      (path) => path.startsWith('assets/fonts/') && !path.endsWith('/'),
    ).length,
    1,
  );
  assert.match(textOf(result.files.get('styles.css')!), /@font-face/);
});

test('React exports include a standalone project and clear unused font resources', async () => {
  const input = project();
  input.pages[0].layers[0].elements[0].style.fontFamily = 'Arial';
  const result = await createExportPackage(input, 'react');
  for (const name of [
    'App.jsx',
    'main.jsx',
    'styles.css',
    'index.html',
    'package.json',
    'vite.config.js',
  ])
    assert.ok(result.files.has(name), name);
  assert.equal(
    [...result.files.keys()].filter(
      (path) => path.startsWith('assets/fonts/') && !path.endsWith('/'),
    ).length,
    0,
  );
  assert.match(textOf(result.files.get('main.jsx')!), /hydrateRoot/);
});
