import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Match Vite's ?raw imports when bundling tests with esbuild. */
export function rawTextPlugin() {
  return {
    name: 'vite-raw-text',
    setup(builder) {
      builder.onResolve({ filter: /\?raw$/ }, (args) => ({
        path: resolve(args.resolveDir, args.path.slice(0, -4)),
        namespace: 'raw-text',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'raw-text' }, async (args) => ({
        contents: await readFile(args.path, 'utf8'),
        loader: 'text',
      }));
    },
  };
}
