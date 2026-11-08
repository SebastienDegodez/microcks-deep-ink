import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
const root = dirname(fileURLToPath(import.meta.url));
const repository = resolve(root, '../../..');
const out = join(root, '.artifacts');
mkdirSync(out, { recursive: true });
rmSync(join(out, 'report.json'), { force: true });
const rs = createRequire(join(repository, 'svelte/apps/storybook/package.json'));
const rr = createRequire(join(repository, 'react/apps/storybook/package.json'));
const { loadCsf } = await import(rr.resolve('storybook/internal/csf-tools'));
const { build } = await import(rs.resolve('vite'));
const { svelte } = await import(rs.resolve('@sveltejs/vite-plugin-svelte'));
const filters = (process.env.PARITY_STORIES ?? '').split(',').filter(Boolean);
const matches = (id) => !filters.length || filters.some((prefix) => id.startsWith(prefix));
function discover(framework) {
  const directory = join(repository, `${framework}/apps/storybook/src/stories`);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((file) => /\.stories\.tsx?$/.test(file)).flatMap((file) => {
    const path = join(directory, file);
    const csf = loadCsf(readFileSync(path, 'utf8'), { makeTitle: (title) => title }).parse();
    return csf.stories.filter((story) => matches(story.id)).map((story) => ({ id: story.id, file: path }));
  });
}
const react = discover('react');
const svelteStories = discover('svelte');
assert(react.length, `No React stories match ${filters}`);
const cases = react.map((story) => ({ id: story.id, react: story.file, svelte: svelteStories.find((twin) => twin.id === story.id)?.file ?? null }));
writeFileSync(join(out, 'cases.json'), JSON.stringify(cases, null, 2));
const fonts = JSON.parse(readFileSync(join(root, 'fonts/manifest.json'), 'utf8'));
let fontCSS = '';
for (const font of fonts) {
  const path = join(root, 'fonts', font.file);
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), font.sha256, `Font drift: ${font.file}`);
  cpSync(path, join(out, font.file));
  fontCSS += `@font-face{font-family:"${font.family}";src:url("/${font.file}");font-weight:${font.weight};font-style:normal;font-display:block;}\n`;
}
for (const framework of ['react', 'svelte']) {
  const css = readFileSync(join(repository, `${framework}/packages/deep-ink/dist/styles.no-fonts.css`), 'utf8');
  const shared = readFileSync(join(repository, 'apps/shared/foundations.css'), 'utf8');
  const frameworkOut = join(out, framework);
  mkdirSync(frameworkOut, { recursive: true });
  writeFileSync(join(frameworkOut, 'common.css'), `${css}\n${shared}\n${fontCSS}\nhtml,body{margin:0;background:var(--bg);color:var(--text)}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`);
  const files = [...new Set(cases.filter((story) => story.svelte).map((story) => story[framework]))];
  writeFileSync(join(out, `${framework}-modules.ts`), `export const modules = {${files.map((file) => `${JSON.stringify(file)}:()=>import(${JSON.stringify(file)})`).join(',')}};`);
  const aliases = [
    ...Object.keys(JSON.parse(readFileSync(rs.resolve("svelte/package.json"), "utf8")).exports).filter((key) => key === "." || key.startsWith("./internal/")).map((key) => ({ find: key === "." ? /^svelte$/ : "svelte" + key.slice(1), replacement: key === "." ? join(dirname(rs.resolve("svelte/package.json")), "src/index-client.js") : rs.resolve("svelte" + key.slice(1)) })),
    { find: /^@microcks\/deep-ink$/, replacement: join(repository, framework === 'react' ? 'react/packages/deep-ink/src/index.ts' : 'svelte/packages/deep-ink/dist/index.js') },
    { find: /^@microcks-deep-ink\/storybook-shared\/(.*)$/, replacement: join(repository, 'apps/shared/$1') },
    { find: /^storybook\/internal\/csf$/, replacement: rr.resolve('storybook/internal/csf') },
    { find: /^react\/jsx-runtime$/, replacement: rr.resolve('react/jsx-runtime') },
    { find: /^react-dom\/client$/, replacement: rr.resolve('react-dom/client') },
    { find: /^react-dom$/, replacement: rr.resolve('react-dom') },
    { find: /^react$/, replacement: rr.resolve('react') },
  ];
  try {
    await build({ root, configFile: false, logLevel: 'error', base: `/${framework}/`,
      plugins: framework === 'svelte' ? [svelte({ configFile: false })] : [],
      esbuild: { jsx: 'automatic' }, resolve: { alias: aliases, dedupe: ['svelte', 'react', 'react-dom'] },
      build: { outDir: frameworkOut, emptyOutDir: false, rollupOptions: { input: join(root, `${framework}.html`) } },
    });
  } catch (error) {
    writeFileSync(join(frameworkOut, `${framework}.html`), `<script>window.__parityError=${JSON.stringify(String(error)).replaceAll('<', '\\u003c')}</script>`);
  }
}
const mime = { '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.js': 'text/javascript', '.html': 'text/html' };
const server = createServer((request, response) => {
  const path = resolve(out, `.${new URL(request.url, 'http://localhost').pathname}`);
  if (!path.startsWith(out + '/') || !existsSync(path)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream' });
  response.end(readFileSync(path));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/react/react.html`)).status, 200);
  process.exitCode = await new Promise((done, reject) => {
    const child = spawn(process.env.PARITY_PYTHON ?? 'python3', [join(root, 'compare.py'), base], { stdio: 'inherit', env: { ...process.env, TMPDIR: out } });
    child.on('error', reject); child.on('exit', done);
  });
} finally { await new Promise((done) => server.close(done)); }
