import 'fake-indexeddb/auto';
import { installCanvasDocument } from './support/canvas';
import { readPwbContainer } from '../services/projectContainer/container';
import { readZip, textOf } from '../utils/zipArchive';
import { startLogic } from '../codegen/browserRuntime.js';
import { startClickAnimations } from '../codegen/clickAnimations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transform } from 'esbuild';
import { rawTextPlugin } from './support/raw-text.mjs';
import { useEditorStore as store } from '../store/useEditorStore';
import { DEFAULT_STYLE, Project, CanvasElement } from '../types';
import { parsePWB, serializePWB } from '../utils/fileFormat';
import { PowerWebCodeGenerator as Generator } from '../codegen/htmlCssJsGenerator';
import { SmartCodeGenerator } from '../codegen/reactTailwindGenerator';
import { previewProject } from '../services/fileService';
const base = (): Project => ({
  id: 'project',
  name: 'Test',
  activePageId: 'p1',
  pages: [
    {
      id: 'p1',
      name: 'Home',
      width: 1200,
      height: 800,
      backgroundColor: '#fff',
      layers: [{ id: 'l1', name: 'Layer', visible: true, locked: false, elements: [] }],
    },
  ],
});
const el = (id: string, type: CanvasElement['type'] = 'rect'): CanvasElement => ({
  id,
  type,
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  style: { ...DEFAULT_STYLE },
  content: 'Text',
});
const s = () => store.getState();
const page = () => s().project.pages.find((p) => p.id === s().project.activePageId)!;
const elements = () => page().layers.flatMap((l) => l.elements);
const reset = () => {
  s().loadProject(base());
  store.setState({ clipboard: [], pasteCount: 0, clipboardMode: 'copy' });
};
test('load uses saved active page and does not retain stale selection', () => {
  reset();
  s().addPage();
  const p = structuredClone(s().project);
  s().loadProject(p);
  assert.equal(s().activeLayerId, page().layers[0].id);
  s().addElement(el('a'));
  assert.equal(elements().length, 1);
});
test('Undo and Redo restore layers and allow further editing', () => {
  reset();
  s().addLayer();
  s().undo();
  assert.equal(s().activeLayerId, 'l1');
  s().addElement(el('a'));
  assert.equal(elements().length, 1);
  s().undo();
  assert.equal(elements().length, 0);
  s().redo();
  assert.equal(elements().length, 1);
  assert.deepEqual(s().selectedElementIds, ['a']);
});
test('multi-element movement is one undo; a click/no-op consumes no history', () => {
  reset();
  s().addElement(el('a'));
  s().addElement(el('b'));
  s().selectAll();
  const before = s().historyIndex;
  s().moveElements(['a', 'b'], 0, 0);
  assert.equal(s().historyIndex, before);
  s().moveElements(['a', 'b'], 35, -10);
  assert.equal(s().historyIndex, before + 1);
  s().undo();
  assert.deepEqual(
    elements().map((e) => e.x),
    [10, 10],
  );
  s().redo();
  assert.deepEqual(
    elements().map((e) => e.x),
    [45, 45],
  );
});
test('inline text transactions undo and redo content, not element creation', () => {
  reset();
  s().addElement(el('t', 'text'));
  s().beginTransaction('Text');
  s().updateSpecificElement('t', { content: 'A' });
  s().updateSpecificElement('t', { content: 'AB' });
  s().commitTransaction();
  s().undo();
  assert.equal(elements()[0].content, 'Text');
  s().redo();
  assert.equal(elements()[0].content, 'AB');
});
test('cancel transaction restores baseline; pending transaction can be undone; branching drops redo', () => {
  reset();
  s().addElement(el('a'));
  s().beginTransaction();
  s().updateElementProp('x', 40);
  s().cancelTransaction();
  assert.equal(elements()[0].x, 10);
  s().beginTransaction();
  s().updateElementProp('x', 70);
  s().undo();
  assert.equal(elements()[0].x, 10);
  s().redo();
  assert.equal(elements()[0].x, 70);
  s().undo();
  s().updateElementProp('y', 80);
  const count = s().history.length;
  s().redo();
  assert.equal(elements()[0].x, 10);
  assert.equal(s().history.length, count);
});
test('locked and hidden layers cannot be edited or pasted into', () => {
  reset();
  s().addElement(el('a'));
  s().copySelected();
  s().toggleLayerLock('l1');
  const index = s().historyIndex;
  s().selectElement('a');
  s().deleteSelected();
  s().pasteElements();
  s().moveElements(['a'], 20, 20);
  s().updateSpecificElement('a', { content: 'bad' });
  assert.equal(elements().length, 1);
  assert.equal(elements()[0].content, 'Text');
  assert.equal(s().historyIndex, index);
  s().toggleLayerLock('l1');
  s().toggleLayerVisibility('l1');
  s().pasteElements();
  assert.equal(elements().length, 1);
});
test('copy is isolated; pastes are offset and undo independently', () => {
  reset();
  s().addElement(el('a'));
  s().copySelected();
  s().updateElementProp('content', 'Changed');
  s().pasteElements();
  s().pasteElements();
  assert.equal(elements()[1].content, 'Text');
  assert.deepEqual(
    elements().map((e) => e.x),
    [10, 30, 50],
  );
  assert.equal(new Set(elements().map((e) => e.id)).size, 3);
  s().undo();
  assert.equal(elements().length, 2);
  s().redo();
  assert.equal(elements().length, 3);
});
test('cut/paste preserves relative positions, starts in place, and remains undoable', () => {
  reset();
  s().addElement(el('a'));
  s().addElement({ ...el('b'), x: 100 });
  s().selectAll();
  s().cutSelected();
  assert.equal(elements().length, 0);
  s().pasteElements();
  assert.deepEqual(
    elements().map((e) => e.x),
    [10, 100],
  );
  s().undo();
  assert.equal(elements().length, 0);
  s().undo();
  assert.deepEqual(
    elements().map((e) => e.id),
    ['a', 'b'],
  );
});
test('recursive group clones remap internal targets and preserve external page links', () => {
  reset();
  const a = {
    ...el('a'),
    logic: [
      {
        event: { type: 'click' as const },
        actions: [
          { type: 'hideElement' as const, targetId: 'b' },
          { type: 'navigateToPage' as const, targetId: 'p1' },
        ],
      },
    ],
  };
  s().addElement(a);
  s().addElement(el('b'));
  s().selectAll();
  s().groupSelected();
  s().copySelected();
  s().pasteElements();
  const [original, copy] = elements();
  assert.notEqual(original.elements![0].id, copy.elements![0].id);
  assert.equal(copy.elements![0].logic![0].actions[0].targetId, copy.elements![1].id);
  assert.equal(copy.elements![0].logic![0].actions[1].targetId, 'p1');
  s().ungroupSelected();
  assert.ok(elements().some((e) => e.id === copy.elements![0].id));
});
test('page duplicate remaps nested and cross-layer references, including self-navigation', () => {
  reset();
  s().addElement({
    ...el('a'),
    logic: [{ event: { type: 'click' }, actions: [{ type: 'navigateToPage', targetId: 'p1' }] }],
  });
  s().addElement(el('b'));
  s().selectAll();
  s().groupSelected();
  s().duplicatePage('p1');
  assert.equal(elements()[0].elements![0].logic![0].actions[0].targetId, page().id);
  assert.notEqual(elements()[0].elements![0].id, 'a');
  assert.ok(parsePWB(serializePWB(s().project)));
});
test('group resizing scales child geometry and survives ungroup', () => {
  reset();
  s().addElement(el('a'));
  s().addElement({ ...el('b'), x: 150 });
  s().selectAll();
  s().groupSelected();
  let g = elements()[0];
  s().resizeElement(g.id, g.x, g.y, g.width * 2, g.height * 2);
  g = elements()[0];
  assert.equal(g.elements![0].width, 200);
  s().ungroupSelected();
  assert.equal(elements()[1].x, 290);
});
test('invalid dimensions and missing IDs do not corrupt state or create history', () => {
  reset();
  s().addElement(el('a'));
  const index = s().historyIndex;
  s().updateElementProp('width', NaN);
  s().updateElementProp('height', -5);
  s().resizeElement('a', 0, 0, 0, 20);
  s().switchPage('missing');
  s().updateElementProp('animations', [
    { id: 'bad', name: 'fadeIn', trigger: 'onLoad', duration: NaN, delay: 0 },
  ]);
  s().updateElementStyle('opacity', 'invalid');
  assert.equal(elements()[0].width, 100);
  assert.equal(s().historyIndex, index);
  assert.equal(s().project.activePageId, 'p1');
});
test('PWB rejects malformed/unsupported input; legacy 0.4 fixture round-trips', () => {
  assert.equal(parsePWB('{'), null);
  assert.equal(
    parsePWB(JSON.stringify({ signature: 'POWERWEB_PROJECT', project: { unexpected: true } })),
    null,
  );
  const p = parsePWB(fs.readFileSync('tests/fixtures/legacy-0.4.pwb', 'utf8'));
  assert.ok(p);
  assert.deepEqual(parsePWB(serializePWB(p)), p);
  const bad = base();
  bad.pages[0].layers[0].elements = [el('a'), el('a')];
  assert.equal(parsePWB(JSON.stringify({ signature: 'POWERWEB_PROJECT', project: bad })), null);
});
test('export escapes text/attributes, supports media animations, preserves button/line appearance', () => {
  const p = base();
  p.pages[0].layers[0].elements = [
    { ...el('t', 'text'), content: '<img src=x onerror="bad()">' },
    { ...el('b', 'button'), style: { ...DEFAULT_STYLE, fill: '#ff0000', strokeWidth: 3 } },
    {
      ...el('i', 'image'),
      content: 'https://example.org/a.png',
      animations: [{ id: 'anim', name: 'fadeIn', trigger: 'onLoad', duration: 1, delay: 0 }],
    },
    el('line', 'line'),
  ];
  const code = new Generator(p).generate();
  assert.ok(!code.htmlBody.includes('<img src=x'));
  assert.ok(code.htmlBody.includes('&lt;img'));
  assert.match(code.css, /background:\s*#ff0000/);
  assert.match(code.htmlBody, /data-pwb-animation-layer=/);
  assert.match(code.css, /line-height:\s*1.2/);
  assert.equal((code.html.match(/<!DOCTYPE html>/g) || []).length, 1);
  assert.doesNotThrow(() => new Function(code.js));
});
test('logic serialization cannot break script context and supports all declared events/actions', () => {
  const p = base();
  p.pages[0].layers[0].elements = [
    {
      ...el('a'),
      logic: [
        {
          event: { type: 'hover' },
          actions: [{ type: 'navigateToUrl', url: 'https://example.org/"</script><script>bad()' }],
        },
      ],
    },
  ];
  const code = new Generator(p).generate();
  assert.doesNotThrow(() => new Function(code.js));
  assert.ok(!code.js.includes('</script>'));
  assert.match(code.js, /mouseenter/);
  assert.match(code.js, /setVariable/);
});
test('browser preview uses exactly one document and one runtime', async () => {
  let result = '';
  (globalThis as any).window = {
    open: () => ({ document: { write: (s: string) => (result = s), close: () => {} } }),
  };
  await previewProject(base());
  assert.equal((result.match(/<!DOCTYPE html>/g) || []).length, 1);
  assert.equal((result.match(/DOMContentLoaded/g) || []).length, 1);
  delete (globalThis as any).window;
});
test('React export is valid JSX for numeric/cyrillic names, braces, quotes and groups', async () => {
  const p = base();
  p.pages[0].name = '123 Привет';
  p.pages[0].layers[0].elements = [
    { ...el('g', 'group'), elements: [{ ...el('t', 'text'), content: '{Hello} <test> "quote"' }] },
  ];
  const code = new SmartCodeGenerator(p).generateReactTailwind();
  assert.match(code, /Hello/);
  await transform(code, { loader: 'jsx' });
});

test('cut/paste retains identity for external references and falls back to fresh IDs after undo', () => {
  reset();
  s().addElement(el('a'));
  s().addElement({
    ...el('link', 'button'),
    logic: [{ event: { type: 'click' }, actions: [{ type: 'hideElement', targetId: 'a' }] }],
  });
  s().selectElement('a');
  s().cutSelected();
  s().pasteElements();
  assert.ok(elements().some((e) => e.id === 'a'));
  s().undo();
  s().undo();
  s().pasteElements();
  assert.equal(new Set(elements().map((e) => e.id)).size, elements().length);
});
test('history retains 200 snapshots without losing the ability to redo the final document', () => {
  reset();
  s().addElement(el('a'));
  for (let i = 0; i < 240; i++) s().moveElements(['a'], 1, 0);
  const final = structuredClone(s().project);
  assert.equal(s().history.length, 200);
  for (let i = 0; i < 199; i++) s().undo();
  assert.equal(s().historyIndex, 0);
  for (let i = 0; i < 199; i++) s().redo();
  assert.deepEqual(s().project, final);
});
test('legacy and current plugin APIs are isolated, transactional and roll back failed edits', async () => {
  reset();
  s().addElement(el('a'));
  await s().runPlugin({
    name: 'legacy',
    code: `const copy=PowerWeb.state; copy.project.name='mutated'; PowerWeb.updateElement('content','Plugin'); PowerWeb.updateStyle('opacity',0.5);`,
  });
  assert.equal(s().project.name, 'Test');
  assert.equal(elements()[0].content, 'Plugin');
  assert.equal(elements()[0].style.opacity, 0.5);
  s().undo();
  assert.equal(elements()[0].content, 'Text');
  assert.equal(elements()[0].style.opacity, 1);
  s().redo();
  const before = structuredClone(s().project);
  await assert.rejects(
    s().runPlugin({
      name: 'broken',
      code: `PowerWeb.updateElement('content','Bad'); throw new Error('Plugin failed');`,
    }),
  );
  assert.deepEqual(s().project, before);
  assert.equal(s().isPluginRunning, false);
  await s().runPlugin({
    name: 'legacy-setState',
    code: `PowerWeb.setState(s=>({...s,project:{...s.project,name:'Legacy API'}}));`,
  });
  assert.equal(s().project.name, 'Legacy API');
  s().undo();
  assert.equal(s().project.name, 'Test');
});

import { updateLogicAction } from '../utils/logicEditing';
import { InteractionsTab } from '../components/panels/InteractionsTab';
test('editing hover preserves click logic, conditions, additional actions and blocks through PWB and undo', () => {
  reset();
  const original: NonNullable<CanvasElement['logic']> = [
    {
      event: { type: 'click' },
      actions: [{ type: 'navigateToUrl', url: 'https://example.org/click' }],
    },
    {
      event: { type: 'hover' },
      condition: { type: 'screenWidth', operator: '>', value: 600 },
      actions: [
        { type: 'navigateToUrl', url: 'https://example.org/old' },
        { type: 'setVariable', variableName: 'hovered', value: true },
      ],
      elseActions: [{ type: 'hideElement', targetId: 'other' }],
    },
    {
      event: { type: 'hover' },
      actions: [{ type: 'toggleClass', targetId: 'other', className: 'highlight' }],
    },
  ];
  s().addElement({ ...el('hover-source'), logic: original });
  const edited = updateLogicAction(elements()[0].logic, 'hover', {
    type: 'navigateToUrl',
    url: 'https://example.org/hover',
  });
  s().updateElementProp('logic', edited);
  assert.deepEqual(edited[0], original[0]);
  assert.deepEqual(edited[2], original[2]);
  assert.deepEqual(edited[1].condition, original[1].condition);
  assert.deepEqual(edited[1].elseActions, original[1].elseActions);
  assert.deepEqual(edited[1].actions.slice(1), original[1].actions.slice(1));
  assert.equal(original[1].actions[0].url, 'https://example.org/old');
  assert.deepEqual(
    parsePWB(serializePWB(s().project))!.pages[0].layers[0].elements[0].logic,
    edited,
  );
  s().undo();
  assert.deepEqual(elements()[0].logic, original);
  s().redo();
  assert.deepEqual(elements()[0].logic, edited);
  const withoutHover = updateLogicAction(edited, 'hover');
  assert.deepEqual(withoutHover, [original[0]]);
  const added = updateLogicAction(withoutHover, 'hover', { type: 'showModal', targetId: 'modal' });
  assert.deepEqual(added[0], original[0]);
  assert.equal(added[1].event?.type, 'hover');
  assert.equal(added[1].actions[0].targetId, 'modal');
});
test('logic panel displays distinct saved click and hover settings', () => {
  const element: CanvasElement = {
    ...el('source'),
    logic: [
      {
        event: { type: 'click' },
        actions: [{ type: 'navigateToUrl', url: 'https://example.org/click' }],
      },
      {
        event: { type: 'hover' },
        actions: [{ type: 'navigateToUrl', url: 'https://example.org/hover' }],
      },
    ],
  };
  const html = renderToString(
    React.createElement(InteractionsTab, { element, inputClass: 'input', labelClass: 'label' }),
  );
  const sections = [
    ...html.matchAll(/<section data-logic-event="(click|hover)">([\s\S]*?)<\/section>/g),
  ];
  assert.equal(sections.length, 2);
  assert.equal(sections[0][1], 'click');
  assert.equal(sections[1][1], 'hover');
  assert.match(sections[0][2], /value="https:\/\/example.org\/click"/);
  assert.match(sections[1][2], /value="https:\/\/example.org\/hover"/);
});
function runtimeHarness() {
  class List extends Set<string> {
    add(...names: string[]) {
      names.forEach((n) => super.add(n));
      return this;
    }
    remove(...names: string[]) {
      names.forEach((n) => this.delete(n));
    }
    contains(name: string) {
      return this.has(name);
    }
    toggle(name: string, force?: boolean) {
      const next = force ?? !this.has(name);
      if (next) this.add(name);
      else this.delete(name);
      return next;
    }
  }
  class Element extends EventTarget {
    classList = new List();
    dataset: Record<string, string> = {};
    style: any = {};
    offsetWidth = 100;
    constructor(public id: string) {
      super();
    }
    getAttribute() {
      return null;
    }
    setAttribute() {}
    focus() {}
    querySelector() {
      return null;
    }
    closest() {
      return this;
    }
    checkValidity() {
      return true;
    }
  }
  const map = new Map<string, Element>();
  const add = (id: string, classes: string[] = []) => {
    const e = new Element(id);
    e.classList.add(...classes);
    map.set(id, e);
    return e;
  };
  const doc: any = new EventTarget();
  Object.assign(doc, {
    querySelector: (selector: string) => map.get(selector.slice(1)) || null,
    querySelectorAll: (selector: string) =>
      [...map.values()].filter((e) =>
        selector === '.pwb-slide'
          ? e.classList.has('pwb-slide')
          : e.dataset.animations !== undefined,
      ),
    documentElement: { style: { setProperty: () => {} } },
  });
  const opens: string[] = [];
  const win: any = new EventTarget();
  Object.assign(win, {
    innerWidth: 1200,
    scrollY: 200,
    scrollTo: () => {},
    open: (url: string) => opens.push(url),
  });
  const observers: any[] = [];
  class Observer {
    observed = new Set<Element>();
    disconnected = false;
    constructor(public cb: any) {
      observers.push(this);
    }
    observe(e: Element) {
      this.observed.add(e);
    }
    unobserve(e: Element) {
      this.observed.delete(e);
    }
    disconnect() {
      this.disconnected = true;
    }
    trigger() {
      this.cb([...this.observed].map((target) => ({ isIntersecting: true, target })));
    }
  }
  const globals: any = {
    document: doc,
    window: win,
    CSS: { escape: (s: string) => s },
    IntersectionObserver: Observer,
    location: { href: 'https://example.org/', assign: (url: string) => opens.push(url) },
    getComputedStyle: (e: Element) => ({
      display: e.style.display || 'block',
      visibility: 'visible',
    }),
  };
  const previous = new Map(
    Object.keys(globals).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  Object.entries(globals).forEach(([key, value]) =>
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true }),
  );
  return {
    add,
    doc,
    win,
    opens,
    observers,
    restore: () =>
      previous.forEach((descriptor, key) => {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as any)[key];
      }),
  };
}
test('export runtime executes conditions, else, hover, load, submit, scroll and modal actions with cleanup', () => {
  const h = runtimeHarness();
  try {
    const one = h.add('p1', ['pwb-slide', 'active']),
      two = h.add('p2', ['pwb-slide']);
    two.dataset.transition = 'none';
    const button = h.add('button'),
      target = h.add('target'),
      form = h.add('form'),
      modal = h.add('modal');
    const cleanup = startLogic(
      [
        {
          id: 'button',
          logic: [
            {
              event: { type: 'load' },
              actions: [{ type: 'setVariable', variableName: 'ready', value: true }],
            },
            {
              event: { type: 'hover' },
              condition: { type: 'variableEquals', variableName: 'ready', value: true },
              actions: [{ type: 'hideElement', targetId: 'target' }],
            },
            {
              event: { type: 'click' },
              condition: { type: 'screenWidth', operator: '<', value: 500 },
              actions: [{ type: 'navigateToUrl', url: 'javascript:bad()' }],
              elseActions: [
                { type: 'toggleClass', targetId: 'target', className: 'clicked extra' },
                { type: 'showModal', targetId: 'modal' },
              ],
            },
            {
              event: { type: 'scroll' },
              condition: { type: 'scrollPosition', operator: '>=', value: 100 },
              actions: [
                { type: 'playAnimation', targetId: 'target', animationClass: 'anim-pulse' },
              ],
            },
          ],
        },
        {
          id: 'form',
          logic: [
            {
              event: { type: 'submit' },
              condition: { type: 'formValid', formId: 'form' },
              actions: [{ type: 'navigateToPage', targetId: 'p2' }],
            },
          ],
        },
      ],
      h.doc,
      { p2: 'second.html' },
    );
    button.dispatchEvent(new Event('mouseenter'));
    assert.equal(target.style.display, 'none');
    button.dispatchEvent(new Event('click'));
    assert.ok(target.classList.contains('clicked'));
    assert.equal(modal.style.display, 'flex');
    assert.equal(h.opens.length, 0);
    modal.dispatchEvent(new Event('click'));
    assert.equal(modal.style.display, 'none');
    h.win.dispatchEvent(new Event('scroll'));
    assert.ok(target.classList.contains('anim-pulse'));
    const submit = new Event('submit', { cancelable: true });
    form.dispatchEvent(submit);
    assert.equal(submit.defaultPrevented, true);
    assert.deepEqual(h.opens, ['second.html']);
    cleanup();
    target.style.display = 'block';
    button.dispatchEvent(new Event('mouseenter'));
    assert.equal(target.style.display, 'block');
    target.classList.remove('anim-pulse');
    h.win.dispatchEvent(new Event('scroll'));
    assert.ok(!target.classList.contains('anim-pulse'));
  } finally {
    h.restore();
  }
});
test('media scroll animations apply easing/iterations and exported JS runs standalone after minification', async () => {
  const { build } = await import('esbuild');
  const bundle = await build({
    entryPoints: ['codegen/htmlCssJsGenerator.ts'],
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    plugins: [rawTextPlugin()],
  });
  const mod = await import(
    'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
  );
  const h = runtimeHarness();
  try {
    h.add('p1', ['pwb-slide', 'active']);
    const media = h.add('media', ['pwb-invisible']);
    media.dataset.animations = JSON.stringify([
      {
        name: 'spin',
        trigger: 'onScroll',
        duration: 2,
        delay: 0.2,
        easing: 'linear',
        iterationCount: 'infinite',
      },
    ]);
    const p = base();
    p.pages[0].layers[0].elements = [
      {
        ...el('media', 'image'),
        content: 'data:image/png;base64,AA==',
        animations: JSON.parse(media.dataset.animations),
      },
    ];
    const code = new mod.PowerWebCodeGenerator(p).generate();
    new Function('document', code.js)(h.doc);
    h.doc.dispatchEvent(new Event('DOMContentLoaded'));
    h.observers[0].trigger();
    assert.match(media.style.animation, /spin 2s linear 0.2s infinite both/);
  } finally {
    h.restore();
  }
});

import { saveProject, openProject, exportProject } from '../services/fileService';
import { saveCurrentProject } from '../services/editorCommands';
test('native file commands handle cancellation, binary PWB and ZIP exports', async () => {
  const restoreCanvas = installCanvasDocument();
  const calls: any[] = [];
  let selected: string | null = null;
  let read = new TextEncoder().encode(serializePWB(base()));
  (globalThis as any).window = {
    __TAURI_INTERNALS__: {
      invoke: async (command: string, args: any, options: any) => {
        calls.push({ command, args, options });
        if (command === 'plugin:dialog|save' || command === 'plugin:dialog|open') return selected;
        if (command === 'plugin:fs|read_file') return Array.from(read);
      },
    },
  };
  try {
    assert.equal(await saveProject(base()), false);
    assert.equal(await openProject(), null);
    reset();
    s().addElement(el('a'));
    const saved = s().savedProject;
    await saveCurrentProject();
    assert.equal(s().savedProject, saved);
    selected = '/tmp/powerweb-test.pwb';
    assert.equal(await saveProject(base()), true);
    const write = calls.find((c) => c.command === 'plugin:fs|write_file');
    assert.equal((await readPwbContainer(new Uint8Array(write.args))).project.id, 'project');
    assert.equal((await openProject())!.id, 'project');
    read = new TextEncoder().encode('broken');
    await assert.rejects(openProject());
    selected = '/tmp/powerweb-test.zip';
    const exportSource = base();
    exportSource.pages[0].layers[0].elements = [
      {
        ...el('link', 'button'),
        logic: [
          {
            event: { type: 'click' },
            actions: [{ type: 'toggleClass', targetId: 'link', className: 'active' }],
          },
        ],
      },
    ];
    await exportProject(exportSource);
    const exported = calls.filter((c) => c.command === 'plugin:fs|write_file').at(-1)!;
    const files = await readZip(new Uint8Array(exported.args)),
      html = textOf(files.get('index.html')!);
    assert.equal((html.match(/<!DOCTYPE html>/g) || []).length, 1);
    assert.match(html, /href="styles.css"/);
    assert.match(html, /src="script.js"/);
    assert.ok(!html.includes('DOMContentLoaded'));
    assert.match(textOf(files.get('script.js')!), /DOMContentLoaded/);
    assert.ok(files.has('styles.css'));
  } finally {
    delete (globalThis as any).window;
    restoreCanvas();
  }
});
test('browser file chooser cancellation resolves without replacing the document', async () => {
  const original = (globalThis as any).document;
  (globalThis as any).document = {
    body: { appendChild: () => {} },
    createElement: () => {
      const input: any = { remove: () => {} };
      input.click = () => input.oncancel();
      return input;
    },
  };
  try {
    assert.equal(await openProject(), null);
  } finally {
    if (original) (globalThis as any).document = original;
    else delete (globalThis as any).document;
  }
});
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
test('editor initial component tree renders with history and clipboard controls', () => {
  const serverSnapshot = store.getInitialState(),
    original = { ...serverSnapshot };
  try {
    reset();
    Object.assign(serverSnapshot, s());
    const html = renderToString(React.createElement(App));
    assert.match(html, /POWERWEB/);
    assert.match(html, /Beta 1.5.1/);
    assert.match(html, /Undo/);
    assert.match(html, /Cut/);
    assert.match(html, /Paste/);
  } finally {
    Object.assign(serverSnapshot, original);
  }
});

import { createProjectFromTemplate, PROJECT_TEMPLATES } from '../utils/projectTemplates';
import {
  readRecentProjects,
  rememberProject,
  loadRecentProject,
  pinRecentProject,
  removeRecentProject,
} from '../services/projectLibrary';
import {
  createCurrentProject,
  showStartMenu,
  openRecentProject,
  openCurrentProject,
} from '../services/editorCommands';
function localLibraryHarness() {
  const values = new Map<string, string>();
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldConfirm = Object.getOwnPropertyDescriptor(globalThis, 'confirm');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let allow = true;
  Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'confirm', { value: () => allow, configurable: true });
  return {
    values,
    storage,
    decline: () => {
      allow = false;
    },
    accept: () => {
      allow = true;
    },
    restore: () => {
      if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
      else delete (globalThis as any).localStorage;
      if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
      else delete (globalThis as any).window;
      if (oldConfirm) Object.defineProperty(globalThis, 'confirm', oldConfirm);
      else delete (globalThis as any).confirm;
    },
  };
}
test('launch renders the start menu; each template creates a fresh editable and exportable project', () => {
  const snapshot = store.getInitialState(),
    original = { ...snapshot };
  try {
    Object.assign(snapshot, { showStartScreen: true, hasOpenProject: false, language: 'ru' });
    const html = renderToString(React.createElement(App));
    assert.match(html, /data-start-screen/);
    assert.match(html, /Главная/);
    assert.match(html, /Создать/);
    assert.match(html, /Открыть/);
    assert.match(html, /Пустой проект/);
    assert.ok(!html.includes('data-canvas-viewport'));
    assert.ok(!html.includes('Вернуться в редактор'));
    for (const preset of PROJECT_TEMPLATES) {
      const project = createProjectFromTemplate(preset.id, 'ru'),
        other = createProjectFromTemplate(preset.id, 'ru');
      assert.notEqual(project.id, other.id);
      assert.notEqual(project.pages[0].id, other.pages[0].id);
      assert.ok(parsePWB(serializePWB(project)));
      assert.match(new Generator(project).generate().html, /<!DOCTYPE html>/);
      s().loadProject(project);
      assert.equal(s().showStartScreen, false);
      assert.equal(s().hasOpenProject, true);
      const content = elements();
      assert.equal(content.length === 0, preset.id === 'blank');
      if (content.length) {
        s().selectElement(content[0].id);
        s().updateElementProp('content', 'Edited');
        assert.equal(elements()[0].content, 'Edited');
        s().undo();
        assert.equal(elements()[0].content, content[0].content);
      }
    }
  } finally {
    Object.assign(snapshot, original);
  }
});
test('recent projects persist isolated snapshots, preserve pins, deduplicate and tolerate corruption or full storage', async () => {
  const h = localLibraryHarness();
  try {
    const project = base();
    project.pages[0].layers[0].elements = [el('library-shape')];
    await rememberProject(project);
    pinRecentProject(project.id);
    project.name = 'Changed';
    project.pages[0].layers[0].elements[0].content = 'Changed after snapshot';
    const stored = await loadRecentProject(project.id);
    assert.equal(stored.name, 'Test');
    assert.equal(stored.pages[0].layers[0].elements[0].content, 'Text');
    assert.equal(readRecentProjects()[0].project.pages[0].layers[0].elements.length, 0);
    assert.equal(readRecentProjects()[0].project.name, 'Test');
    await rememberProject(project);
    assert.equal(readRecentProjects().length, 1);
    assert.equal(readRecentProjects()[0].pinned, true);
    for (let i = 0; i < 25; i++) await rememberProject({ ...base(), id: `project-${i}` });
    assert.equal(readRecentProjects().length, 20);
    assert.ok(readRecentProjects().some((entry) => entry.project.id === 'project' && entry.pinned));
    pinRecentProject('project');
    assert.equal(
      readRecentProjects().find((entry) => entry.project.id === 'project')!.pinned,
      false,
    );
    removeRecentProject('project');
    assert.ok(!readRecentProjects().some((entry) => entry.project.id === 'project'));
    h.values.set(
      'powerweb.recent-projects.v1',
      JSON.stringify([
        { project: base(), updatedAt: 1e100 },
        { project: { bad: true }, updatedAt: 10 },
      ]),
    );
    assert.deepEqual(readRecentProjects(), []);
    h.values.set('powerweb.recent-projects.v1', 'broken');
    assert.deepEqual(readRecentProjects(), []);
    h.storage.setItem = () => {
      throw new Error('Quota exceeded');
    };
    assert.equal(await rememberProject(base()), false);
  } finally {
    h.restore();
  }
});
test('menu return and resume retain unsaved edits; replacements require confirmation and recent copies stay unsaved', async () => {
  const h = localLibraryHarness();
  try {
    reset();
    s().addElement(el('a'));
    const current = structuredClone(s().project),
      history = s().history.length;
    assert.equal(await showStartMenu(), true);
    assert.equal(s().showStartScreen, true);
    assert.deepEqual(s().project, current);
    assert.equal(readRecentProjects()[0].project.id, current.id);
    s().setShowStartScreen(false);
    assert.deepEqual(s().project, current);
    assert.equal(s().history.length, history);
    h.decline();
    createCurrentProject('studio');
    assert.deepEqual(s().project, current);
    h.accept();
    createCurrentProject('studio');
    assert.equal(s().showStartScreen, false);
    assert.equal(s().savedProject, null);
    assert.notEqual(s().project.id, current.id);
    const next = s().project;
    h.decline();
    await openRecentProject(current.id);
    assert.deepEqual(s().project, next);
    h.accept();
    await openRecentProject(current.id);
    assert.deepEqual(s().project, current);
    assert.equal(s().savedProject, null);
    h.storage.setItem = () => {
      throw new Error('Quota exceeded');
    };
    assert.equal(await showStartMenu(), false);
    assert.deepEqual(s().project, current);
    assert.equal(s().hasOpenProject, true);
  } finally {
    h.restore();
  }
});
test('cancelling open from the start screen keeps the menu and current document intact', async () => {
  const original = (globalThis as any).document;
  const h = localLibraryHarness();
  try {
    reset();
    s().setShowStartScreen(true);
    const project = s().project;
    (globalThis as any).document = {
      body: { appendChild: () => {} },
      createElement: () => {
        const input: any = { remove: () => {} };
        input.click = () => input.oncancel();
        return input;
      },
    };
    await openCurrentProject();
    assert.equal(s().showStartScreen, true);
    assert.equal(s().project, project);
    assert.deepEqual(readRecentProjects(), []);
  } finally {
    h.restore();
    if (original) (globalThis as any).document = original;
    else delete (globalThis as any).document;
  }
});

import { visibleRibbonGroupCount, resolveRibbonTab } from '../utils/ribbonLayout';
test('ribbon overflow keeps whole command groups accessible at narrow and zoomed widths', () => {
  assert.equal(visibleRibbonGroupCount([250, 150, 300], 700), 3);
  assert.equal(visibleRibbonGroupCount([250, 150, 300], 699), 2);
  assert.equal(visibleRibbonGroupCount([250, 150, 300], 240), 0);
  assert.equal(visibleRibbonGroupCount([250, 150, 300], 0), 0);
  assert.equal(visibleRibbonGroupCount([], 700), 0);
  assert.equal(visibleRibbonGroupCount([312.5, 187.5, 375], 875), 3);
});
test('deleting the selected shape preserves ribbon geometry, tab rows and canvas anchoring policy', () => {
  // Zustand's server snapshot is distinct from the live state. Populate it only for these SSR fixtures.
  const serverSnapshot = store.getInitialState();
  const originalSnapshot = { ...serverSnapshot };
  const renderLive = () => {
    Object.assign(serverSnapshot, s());
    return renderToString(React.createElement(App));
  };
  try {
    reset();
    s().addElement(el('delete-layout-shape'));
    const before = renderLive();
    assert.match(before, /element-wrapper-delete-layout-shape/);
    assert.match(before, /aria-selected="true"[^>]*>Format/);
    const panel = (html: string) => html.match(/<div[^>]*role="tabpanel"[^>]*>/)![0];
    const geometry = (html: string) => panel(html).match(/style="([^"]+)"/)![1];
    s().deleteSelected();
    const after = renderLive();
    assert.ok(!after.includes('element-wrapper-delete-layout-shape'));
    assert.match(after, /aria-selected="true"[^>]*>Home/);
    assert.equal(geometry(before), geometry(after));
    assert.match(geometry(after), /height:100px;min-height:100px;max-height:100px/);
    assert.equal((before.match(/role="tab"/g) || []).length, 8);
    assert.equal((after.match(/role="tab"/g) || []).length, 8);
    assert.match(after, /overflow-anchor:none;scrollbar-gutter:stable/);
    assert.equal(resolveRibbonTab('Format', false), 'Home');
    assert.equal(resolveRibbonTab('Logic', false), 'Home');
    assert.equal(resolveRibbonTab('Animations', false), 'Animations');
    s().undo();
    const undone = renderLive();
    assert.equal(geometry(undone), geometry(before));
    assert.match(undone, /element-wrapper-delete-layout-shape/);
  } finally {
    Object.assign(serverSnapshot, originalSnapshot);
    reset();
  }
});

test('two animations keep independent settings, undo/redo history and PWB identity', () => {
  reset();
  s().addElement(el('combined', 'rect'));
  const first = {
    id: 'effect-a',
    name: 'flipInX',
    trigger: 'onLoad' as const,
    duration: 1,
    delay: 0,
    easing: 'ease-out' as const,
    iterationCount: 1,
  };
  const second = {
    id: 'effect-b',
    name: 'float',
    trigger: 'onLoad' as const,
    duration: 3,
    delay: 0.2,
    easing: 'linear' as const,
    iterationCount: 'infinite' as const,
  };
  s().updateElementProp('animations', [first]);
  s().beginTransaction('Add second animation');
  s().updateElementProp('animations', [first, second]);
  s().commitTransaction();
  assert.deepEqual(elements()[0].animations, [first, second]);
  s().beginTransaction('Edit second animation');
  s().updateElementProp('animations', [first, { ...second, duration: 5, delay: 0.7 }]);
  s().commitTransaction();
  assert.deepEqual(elements()[0].animations![0], first);
  assert.equal(elements()[0].animations![1].duration, 5);
  s().undo();
  assert.equal(elements()[0].animations![1].duration, 3);
  s().redo();
  assert.equal(elements()[0].animations![1].duration, 5);
  const roundTrip = parsePWB(serializePWB(s().project))!;
  assert.deepEqual(roundTrip.pages[0].layers[0].elements[0].animations, elements()[0].animations);
  s().updateElementProp('animations', [elements()[0].animations![1]]);
  assert.equal(elements()[0].animations![0].id, 'effect-b');
});
test('simultaneous transform effects run on independent layers instead of overwriting each other', () => {
  const h = runtimeHarness();
  try {
    const target = h.add('combined', ['pwb-invisible']);
    const layers = [h.add('layer-0'), h.add('layer-1')];
    (target as any).querySelector = (selector: string) =>
      layers[Number(selector.match(/"(\d+)"/)![1])];
    target.dataset.animations = JSON.stringify([
      {
        id: 'a',
        name: 'flipInX',
        trigger: 'onLoad',
        duration: 1,
        delay: 0,
        easing: 'ease-out',
        iterationCount: 1,
      },
      {
        id: 'b',
        name: 'float',
        trigger: 'onLoad',
        duration: 3,
        delay: 0.2,
        easing: 'linear',
        iterationCount: 'infinite',
      },
    ]);
    const stop = startClickAnimations(target as any, { editor: true });
    assert.equal(layers[0].style.animation, 'flipInX 1s ease-out 0s 1 both');
    assert.equal(layers[1].style.animation, 'float 3s linear 0.2s infinite both');
    assert.equal(target.style.animation, undefined);
    stop();
    assert.equal(layers[0].style.animation, undefined);
    assert.equal(layers[1].style.animation, undefined);
  } finally {
    h.restore();
  }
});
test('hover animation starts and stops without resetting the other running animation', () => {
  const h = runtimeHarness();
  try {
    const target = h.add('combined'),
      layers = [h.add('layer-0'), h.add('layer-1')];
    (target as any).querySelector = (selector: string) =>
      layers[Number(selector.match(/"(\d+)"/)![1])];
    target.dataset.animations = JSON.stringify([
      {
        id: 'a',
        name: 'spin',
        trigger: 'onLoad',
        duration: 4,
        delay: 0,
        iterationCount: 'infinite',
      },
      { id: 'b', name: 'pulse', trigger: 'onHover', duration: 0.5, delay: 0, iterationCount: 2 },
    ]);
    const stop = startClickAnimations(target as any, { editor: true });
    const spinning = layers[0].style.animation;
    target.dispatchEvent(new Event('mouseenter'));
    assert.match(layers[1].style.animation, /pulse/);
    assert.equal(layers[0].style.animation, spinning);
    target.dispatchEvent(new Event('mouseleave'));
    assert.equal(layers[1].style.animation, '');
    assert.equal(layers[0].style.animation, spinning);
    stop();
  } finally {
    h.restore();
  }
});
import { CanvasElementRenderer } from '../components/canvas/CanvasElement';
import { RibbonAnimations } from '../components/ribbon/RibbonAnimations';
test('editor, HTML and React preserve two nested animation layers and expose separate side-by-side animation editors', async () => {
  reset();
  const element = {
    ...el('combined', 'image'),
    content: 'https://example.org/picture.png',
    animations: [
      { id: 'a', name: 'flipInX', trigger: 'onLoad' as const, duration: 1, delay: 0 },
      {
        id: 'b',
        name: 'float',
        trigger: 'onLoad' as const,
        duration: 3,
        delay: 0.2,
        iterationCount: 'infinite' as const,
      },
    ],
  };
  s().addElement(element);
  const code = new Generator(s().project).generate();
  assert.equal((code.htmlBody.match(/id="combined"/g) || []).length, 1);
  assert.match(code.htmlBody, /data-pwb-animation-layer="0"/);
  assert.match(code.htmlBody, /data-pwb-animation-layer="1"/);
  assert.match(code.htmlBody, /<img[^>]+picture.png/);
  const jsx = new SmartCodeGenerator(s().project).generateReactTailwind();
  await transform(jsx, { loader: 'jsx' });
  assert.match(jsx, /data-pwb-animation-layer=\{0\}/);
  assert.match(jsx, /data-pwb-animation-layer=\{1\}/);
  const canvas = renderToString(
    React.createElement(CanvasElementRenderer, { element, isSelected: false, scale: 1 }),
  );
  assert.match(canvas, /data-pwb-animation-id="a"/);
  assert.match(canvas, /data-pwb-animation-id="b"/);
  const serverSnapshot = store.getInitialState(),
    original = { ...serverSnapshot };
  try {
    Object.assign(serverSnapshot, s());
    const ribbon = renderToString(React.createElement(RibbonAnimations));
    assert.match(ribbon, /Add another animation/);
    assert.match(ribbon, /Preview together/);
    assert.match(ribbon, /data-animation-editor="a"/);
    assert.match(ribbon, /data-animation-editor="b"/);
    assert.match(ribbon, /aria-label="Effect 1"/);
    assert.match(ribbon, /aria-label="Effect 2"/);
    assert.ok(!ribbon.includes('Previous animation'));
  } finally {
    Object.assign(serverSnapshot, original);
    reset();
  }
});

import {
  canvasMetrics,
  canvasPoint,
  gestureDelta,
  canvasMouseIntent,
} from '../utils/canvasCoordinates';
import { CanvasDragSession, DragSnapshot } from '../utils/canvasDragSession';
import { computeCanvasSnap } from '../hooks/useCanvasSnap';
function dragHarness(scale = 1) {
  let metrics = { left: 100, top: 50, scaleX: scale, scaleY: scale },
    valid = true;
  const frames = new Map<number, () => void>();
  let nextFrame = 0;
  const commits: any[] = [],
    previews: any[] = [],
    finished: any[] = [],
    active: boolean[] = [];
  const controller = new CanvasDragSession({
    metrics: () => metrics,
    valid: () => valid,
    snap: (_, dx, dy) => ({ dx, dy, lines: [] }),
    preview: (_, dx, dy) => previews.push({ dx, dy }),
    finishPreview: (_, dx, dy, cancel) => finished.push({ dx, dy, cancel }),
    commit: (ids, dx, dy) => commits.push({ ids, dx, dy }),
    active: (value) => active.push(value),
    guides: () => {},
    frame: (callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelFrame: (id) => {
      frames.delete(id);
    },
  });
  const snapshot: DragSnapshot = {
    pageId: 'p1',
    layerId: 'l1',
    primaryId: 'a',
    positions: { a: { x: 10, y: 20, w: 100, h: 50 } },
    metrics: { ...metrics },
    clientX: 100 + 15 * scale,
    clientY: 50 + 25 * scale,
  };
  return {
    controller,
    snapshot,
    commits,
    previews,
    finished,
    active,
    frames,
    flush: () => {
      const tasks = [...frames.values()];
      frames.clear();
      tasks.forEach((task) => task());
    },
    setMetrics: (next: typeof metrics) => {
      metrics = next;
    },
    invalidate: () => {
      valid = false;
    },
  };
}
test('canvas coordinates include UI zoom as well as canvas zoom', () => {
  for (const scale of [0.25, 0.5, 0.75, 1, 1.5, 2, 3]) {
    const node = {
      offsetWidth: 1200,
      offsetHeight: 800,
      getBoundingClientRect: () => ({
        left: 80,
        top: 90,
        width: 1200 * scale,
        height: 800 * scale,
      }),
    };
    const metrics = canvasMetrics(node as any)!;
    assert.deepEqual(canvasPoint(80 + 30 * scale, 90 + 40 * scale, metrics), { x: 30, y: 40 });
    assert.deepEqual(gestureDelta({ x: 30, y: 40 }, 80 + 50 * scale, 90 + 60 * scale, metrics), {
      x: 20,
      y: 20,
    });
  }
});
test('plain shape follows cursor at every zoom; release commits once and cancels queued frames', () => {
  for (const scale of [0.5, 0.75, 1, 1.5, 2]) {
    const h = dragHarness(scale);
    h.controller.begin(h.snapshot);
    h.controller.move(h.snapshot.clientX + 30 * scale, h.snapshot.clientY + 40 * scale);
    h.flush();
    assert.deepEqual(h.previews, [{ dx: 30, dy: 40 }]);
    // A final pointer position may arrive only with mouseup, before the next animation frame.
    h.controller.move(h.snapshot.clientX + 35 * scale, h.snapshot.clientY + 42 * scale);
    h.controller.end();
    h.controller.end();
    h.flush();
    assert.deepEqual(h.commits, [{ ids: ['a'], dx: 35, dy: 42 }]);
    assert.equal(h.finished.length, 1);
    assert.equal(h.previews.length, 1);
    assert.equal(h.frames.size, 0);
    assert.deepEqual(h.active, [true, false]);
  }
});
test('a click without drag does not snap or move the shape', () => {
  const h = dragHarness();
  h.controller.begin(h.snapshot);
  h.controller.move(h.snapshot.clientX + 1, h.snapshot.clientY + 1);
  h.controller.end();
  assert.equal(h.commits.length, 0);
  assert.equal(h.previews.length, 0);
  assert.deepEqual(h.finished, [{ dx: 0, dy: 0, cancel: false }]);
});
test('Escape, invalidated layer and zoom changes cancel an active drag without a commit', () => {
  for (const reason of ['escape', 'invalid', 'zoom']) {
    const h = dragHarness();
    h.controller.begin(h.snapshot);
    h.controller.move(h.snapshot.clientX + 50, h.snapshot.clientY + 30);
    if (reason === 'invalid') {
      h.invalidate();
      h.controller.validate();
    } else if (reason === 'zoom') {
      h.setMetrics({ left: 100, top: 50, scaleX: 1.5, scaleY: 1.5 });
      h.controller.move(h.snapshot.clientX + 60, h.snapshot.clientY + 30);
    } else h.controller.end(true);
    h.flush();
    h.controller.end();
    assert.equal(h.commits.length, 0);
    assert.equal(h.controller.active, false);
    assert.equal(h.finished.length, 1);
    assert.equal(h.finished[0].cancel, true);
  }
});
test('drag compensates viewport origin movement without changing its scroll position itself', () => {
  const h = dragHarness(1.5);
  h.controller.begin(h.snapshot);
  h.controller.move(h.snapshot.clientX + 30, h.snapshot.clientY + 15);
  h.setMetrics({ left: 85, top: 20, scaleX: 1.5, scaleY: 1.5 });
  h.controller.move(h.snapshot.clientX + 30, h.snapshot.clientY + 15);
  h.controller.end();
  assert.deepEqual(h.commits, [{ ids: ['a'], dx: 30, dy: 30 }]);
});
test('moving two ordinary shapes is one undo operation and snap tolerance follows visual zoom', () => {
  reset();
  s().addElement(el('a'));
  s().addElement({ ...el('b'), x: 150 });
  s().selectAll();
  const before = s().historyIndex;
  const h = dragHarness(1.5);
  h.snapshot.positions.b = { x: 150, y: 20, w: 100, h: 50 };
  h.controller.begin(h.snapshot);
  h.controller.move(h.snapshot.clientX + 30, h.snapshot.clientY + 30);
  h.controller.end();
  const move = h.commits[0];
  s().moveElements(move.ids, move.dx, move.dy);
  assert.equal(s().historyIndex, before + 1);
  assert.deepEqual(
    elements().map((e) => e.x),
    [30, 170],
  );
  s().undo();
  assert.deepEqual(
    elements().map((e) => e.x),
    [10, 150],
  );
  const layer = {
    id: 'l1',
    name: 'Layer',
    visible: true,
    locked: false,
    elements: [el('a'), { ...el('other'), x: 116, y: 200 }],
  };
  const positions = { a: { x: 10, y: 20, w: 100, h: 50 } };
  assert.equal(computeCanvasSnap('a', ['a'], positions, 2, 0, layer, 1).dx, 6);
  assert.equal(computeCanvasSnap('a', ['a'], positions, 2, 0, layer, 2).dx, 2);
});

test('ordinary left-button shape drag never selects the canvas pan mode', () => {
  assert.equal(canvasMouseIntent(0, false, true), 'select');
  assert.equal(canvasMouseIntent(0, false, false), 'select');
  assert.equal(canvasMouseIntent(0, true, true), 'pan');
  assert.equal(canvasMouseIntent(1, false, true), 'pan');
  assert.equal(canvasMouseIntent(2, false, true), 'context');
  assert.equal(canvasMouseIntent(2, false, false), 'pan');
  assert.equal(canvasMouseIntent(3, false, true), 'none');
});
