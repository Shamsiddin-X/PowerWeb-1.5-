/** A PNG encoder stub for file-service tests, not a visual canvas implementation. */
export function installCanvasDocument() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const png = Uint8Array.from(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',
      'base64',
    ),
  );
  const context = new Proxy(
    { measureText: (text: string) => ({ width: text.length * 8 }) },
    {
      get: (target, key) => (key in target ? target[key as keyof typeof target] : () => {}),
    },
  );
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (tag: string) => {
        if (tag !== 'canvas') throw new Error(`Unexpected test element: ${tag}`);
        return {
          getContext: () => context,
          toBlob: (callback: (blob: Blob) => void) =>
            callback(new Blob([png], { type: 'image/png' })),
        };
      },
    },
  });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
    else delete (globalThis as any).document;
  };
}
