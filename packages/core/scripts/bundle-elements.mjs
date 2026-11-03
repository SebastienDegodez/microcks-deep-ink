#!/usr/bin/env node
// Bundles each Stencil custom element into one self-contained ESM file: dist/elements/<tag>.js (+ <tag>.d.ts).
// The bundle registers the element on import and includes the Stencil runtime, so a copied file has no dependency.
import { build } from 'esbuild';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'elements');
const TAGS = ['workflow-loom', 'command-bar', 'plugin-slot'];

// Extra exports of a bundle (the plugin slot re-exports the shared plugin host accessor).
const EXTRA_EXPORT = {
  'plugin-slot': {
    js: "export { getPluginHost } from '@microcks-deep-ink/plugin-sdk';",
    dts: `export interface PluginHost {
  readonly apiVersion: number;
  register(plugin: { manifest: { id: string; [key: string]: unknown }; activate(api: any): void | Promise<void>; deactivate?(): void | Promise<void> }): Promise<void>;
  unregister(id: string): Promise<void>;
  load(entryUrl: string): Promise<void>;
  list(): Array<{ id: string; [key: string]: unknown }>;
  subscribe(listener: () => void): () => void;
  on(event: string, handler: (detail: unknown) => void): () => void;
}
/** The plugin host shared through globalThis.__MICROCKS_PLUGIN_HOST__ (created on first use). */
export declare function getPluginHost(): PluginHost;
`,
  },
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const tag of TAGS) {
  const entry = join(ROOT, 'dist', 'components', `${tag}.js`);
  if (!existsSync(entry)) {
    console.error(`bundle-elements: ${entry} not found. Run "stencil build" first.`);
    process.exit(1);
  }
  const extra = EXTRA_EXPORT[tag];
  await build({
    stdin: {
      contents: `import { defineCustomElement } from ${JSON.stringify(entry)};\ndefineCustomElement();\n${extra?.js ?? ''}\n`,
      resolveDir: ROOT,
      sourcefile: `${tag}.entry.js`,
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
    outfile: join(OUT, `${tag}.js`),
    logLevel: 'warning',
  });
  writeFileSync(join(OUT, `${tag}.d.ts`), extra?.dts ?? 'export {};\n');
  console.log(`bundled ${tag}`);
}
