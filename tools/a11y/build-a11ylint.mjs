// Bundles @a11ylint/core@1.0.0-alpha.7 into one browser IIFE (dist/a11ylint.iife.js).
//
// Why: the published package cannot run in a browser as is. Its entry point imports the report generator, which
// imports `node:fs`, `node:path`, `node:url` and `handlebars`. The bundle replaces those modules with empty stubs.
// The rule engine (`Core.run`) does not use them; `Core.generateAudit` would fail, so reports are produced by
// rgaa-audit.mjs instead. See docs/a11ylint-findings.md (finding 1).
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STUBBED = /^(node:fs|node:path|node:url|fs|path|url|handlebars)$/;

const stubNodeModules = {
  name: 'stub-node-modules',
  setup(b) {
    b.onResolve({ filter: STUBBED }, (args) => ({ path: args.path, namespace: 'a11y-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'a11y-stub' }, () => ({
      // Named imports (readFileSync, join...) and the default import (Handlebars) all resolve to a throwing stub.
      contents: `
        const unavailable = () => { throw new Error('Node-only API is stubbed in the a11ylint browser bundle'); };
        export default { compile: unavailable };
        export const readFileSync = unavailable, writeFileSync = unavailable, join = unavailable,
          dirname = unavailable, fileURLToPath = unavailable;`,
      loader: 'js',
    }));
  },
};

mkdirSync(resolve(here, 'dist'), { recursive: true });
const result = await build({
  entryPoints: [resolve(here, 'src/a11ylint-entry.js')],
  outfile: resolve(here, 'dist/a11ylint.iife.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'none',
  define: { 'import.meta.url': '"file:///a11ylint-browser-bundle.js"' },
  plugins: [stubNodeModules],
  logLevel: 'warning',
  metafile: true,
});
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(`a11ylint browser bundle: dist/a11ylint.iife.js (${(bytes / 1024).toFixed(1)} KiB)`);
