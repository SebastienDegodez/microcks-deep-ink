import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { cases } from './cases.mjs';
import { readPaths, registryPaths } from '../../packages/deep-ink/scripts/build-icons.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(root, '../..');
const repository = resolve(workspace, '..');
const out = join(root, '.artifacts');
const requireSvelte = createRequire(join(workspace, 'packages/deep-ink/package.json'));
const requireReact = createRequire(join(repository, 'react/packages/deep-ink/package.json'));
const { build } = await import(requireSvelte.resolve('vite'));
const { svelte } = await import(requireSvelte.resolve('@sveltejs/vite-plugin-svelte'));
mkdirSync(out, { recursive: true });
process.chdir(root);
const icons = registryPaths();
assert.deepEqual(icons, readPaths(readFileSync(join(repository, 'react/packages/deep-ink/src/icon.tsx'), 'utf8')), 'Registry/React glyph drift: do not ship partial icon parity');
const matrix = cases(Object.keys(icons));
writeFileSync(join(out, 'cases.json'), JSON.stringify(matrix, null, 2));
const css = readFileSync(join(workspace, 'packages/deep-ink/dist/styles.no-fonts.css'), 'utf8');
const font = join(root, 'fonts/ibm-plex-sans.ttf');
assert.equal(createHash('sha256').update(readFileSync(font)).digest('hex'), '3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3');
cpSync(font, join(out, 'font.ttf'));
writeFileSync(join(out, 'common.css'), `${css}
@font-face { font-family: "IBM Plex Sans"; src: url("/font.ttf") format("truetype"); font-style: normal; font-weight: 100 900; font-display: block; }
html, body { margin: 0; }
body { background: var(--canvas); }
.case { display: none; position: absolute; top: 32px; left: 24px; }
.case.active { display: block; }
*, *::before, *::after { animation: none !important; transition: none !important; }
`);
const sveltePackage = dirname(requireSvelte.resolve('svelte/package.json'));
const common = { configFile: false, root, logLevel: 'error' };
const svelteAliases = [
  { find: /^@microcks\/deep-ink$/, replacement: join(workspace, 'packages/deep-ink/dist/index.js') },
];
await build({
  ...common, esbuild: { jsx: 'automatic' },
  resolve: { alias: [
    { find: /^react\/jsx-runtime$/, replacement: requireReact.resolve('react/jsx-runtime') },
    { find: /^react-dom\/server$/, replacement: requireReact.resolve('react-dom/server') },
    { find: /^react$/, replacement: requireReact.resolve('react') },
  ] },
  build: { ssr: join(root, 'react-entry.tsx'), outDir: join(out, 'react-ssr'), rollupOptions: { output: { entryFileNames: 'entry.mjs' } } },
  ssr: { noExternal: true },
});
await build({
  ...common, plugins: [svelte({ configFile: false })],
  resolve: { alias: [
    ...svelteAliases,
    { find: /^svelte\/server$/, replacement: `${sveltePackage}/src/server/index.js` },
    { find: /^svelte\/internal\/server$/, replacement: `${sveltePackage}/src/internal/server/index.js` },
    { find: /^svelte$/, replacement: `${sveltePackage}/src/index-server.js` },
  ] },
  build: { ssr: join(root, 'svelte-entry.ts'), outDir: join(out, 'svelte-ssr'), rollupOptions: { output: { entryFileNames: 'entry.mjs' } } },
  ssr: { noExternal: true },
});
for (const framework of ['react', 'svelte']) execFileSync('node', [join(out, `${framework}-ssr/entry.mjs`)], { cwd: root });
await build({
  ...common, base: '/client/', plugins: [svelte({ configFile: false })],
  resolve: { alias: [
    ...svelteAliases,
    ...Object.keys(JSON.parse(readFileSync(join(sveltePackage, 'package.json'), 'utf8')).exports)
      .filter((path) => path.startsWith('./internal/'))
      .map((path) => ({ find: `svelte${path.slice(1)}`, replacement: requireSvelte.resolve(`svelte${path.slice(1)}`) })),
    { find: /^svelte$/, replacement: `${sveltePackage}/src/index-client.js` },
  ] },
  build: { outDir: join(out, 'client'), rollupOptions: { input: join(root, 'functional.html') } },
});
const mime = { '.css': 'text/css', '.ttf': 'font/ttf', '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = createServer((request, response) => {
  let path;
  try {
    path = resolve(out, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
    response.writeHead(400); response.end(); return;
  }
  if (!path.startsWith(`${out}/`)) { response.writeHead(403); response.end(); return; }
  let contents;
  try {
    contents = readFileSync(path);
  } catch (error) {
    if (error?.code === 'ENOENT') { response.writeHead(404); response.end(); return; }
    console.error(`Parity server failed to read ${path}`, error);
    response.writeHead(500); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.slice(path.lastIndexOf('.'))] ?? 'application/octet-stream' });
  response.end(contents);
});
server.on('error', (error) => { console.error('Parity server failed', error); process.exitCode = 1; });
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  assert.equal((await fetch(`${base}/svelte.html`)).status, 200, 'Static verification server unavailable');
  const code = await new Promise((done, reject) => {
    const child = spawn(process.env.PARITY_PYTHON ?? 'python3', [join(root, 'compare.py'), base], {
      stdio: 'inherit', env: { ...process.env, TMPDIR: out },
    });
    child.on('error', reject); child.on('exit', done);
  });
  assert.equal(code, 0, 'Strict screenshot or native browser verification failed');
} finally { await new Promise((done) => server.close(done)); }
