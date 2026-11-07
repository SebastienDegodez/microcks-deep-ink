import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const library = join(workspace, 'packages/deep-ink');
const scratch = join(workspace, '.smoke', randomUUID());
const consumer = join(scratch, 'consumer');
mkdirSync(scratch, { recursive: true });

function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

try {
  const output = run('npm', ['pack', '--json', '--pack-destination', scratch, '--cache', join(scratch, 'cache')], library);
  const [pack] = JSON.parse(output.slice(output.indexOf('[')));
  const paths = pack.files.map((file) => file.path);
  for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/Button.svelte', 'dist/ButtonLink.svelte', 'dist/internal/icon-data.js', 'dist/MethodTag.svelte', 'dist/StatusBadge.svelte', 'dist/LiveIndicator.svelte', 'dist/SummaryStrip.svelte', 'dist/SummaryStripSep.svelte', 'dist/styles.css', 'dist/styles.no-fonts.css']) {
    assert(paths.includes(file), `Tarball missing ${file}`);
  }
  assert(!paths.some((path) => /(?:test|spec|react-events|node_modules)/.test(path)), 'Unexpected tarball contents');
  cpSync(join(workspace, 'test/consumer'), consumer, { recursive: true });
  const versions = {};
  for (const name of ['svelte', 'vite', 'svelte-check', 'typescript', '@sveltejs/vite-plugin-svelte']) {
    versions[name] = JSON.parse(readFileSync(join(library, 'node_modules', name, 'package.json'), 'utf8')).version;
  }
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'standalone-svelte-tarball-consumer', private: true, type: 'module',
    dependencies: { '@microcks/deep-ink': `file:${join(scratch, pack.filename)}`, svelte: versions.svelte },
    devDependencies: Object.fromEntries(Object.entries(versions).filter(([name]) => name !== 'svelte')),
  }, null, 2));
  run('npm', ['install', '--no-audit', '--no-fund', '--cache', join(scratch, 'cache')], consumer);
  const installed = join(consumer, 'node_modules/@microcks/deep-ink');
  assert(realpathSync(installed).startsWith(realpathSync(consumer)), 'Consumer must use tarball, not workspace symlink');
  const manifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  assert.equal(manifest.name, '@microcks/deep-ink');
  assert.equal(manifest.private, true);
  assert.deepEqual(Object.keys(manifest.peerDependencies), ['svelte']);
  for (const name of ['react', 'react-dom', 'react-reconciler', '@types/react']) {
    assert(!existsSync(join(consumer, 'node_modules', name)), `Consumer installed ${name}`);
  }
  const lock = JSON.parse(readFileSync(join(consumer, 'package-lock.json'), 'utf8'));
  assert(!Object.keys(lock.packages).some((path) => /(?:^|\/)node_modules\/(?:react|react-dom|react-reconciler|@types\/react)(?:\/|$)/.test(path)), 'React in packed production/consumer dependency graph');
  for (const path of ['@microcks/deep-ink/internal/icon-data.js', '@microcks/deep-ink/dist/internal/icon-data.js']) {
    let rejected = false;
    try { run('node', ['--input-type=module', '-e', `await import(${JSON.stringify(path)})`], consumer); }
    catch { rejected = true; }
    assert(rejected, `Internal implementation leaked through export ${path}`);
  }
  for (const file of paths.filter((path) => /\.(?:js|ts|svelte)$/.test(path))) {
    const text = readFileSync(join(installed, file), 'utf8');
    assert(!/\bReact(?:Node|Element|Handlers)?\b|\breactEvents\b|(?:from|import)\s*['"]react(?:\/|-dom|['"])/.test(text), `React coupling in packed ${file}`);
  }
  console.log(run(join(consumer, 'node_modules/.bin/svelte-check'), ['--tsconfig', './tsconfig.json', '--fail-on-warnings'], consumer).trim());
  run(join(consumer, 'node_modules/.bin/vite'), ['build'], consumer);
  run(join(consumer, 'node_modules/.bin/vite'), ['build', '--ssr', 'src/entry-server.ts', '--outDir', 'dist-server'], consumer);
  console.log(run('node', ['dist-server/entry-server.js'], consumer).trim());
  console.log(`Tarball smoke OK: ${paths.length} files; actual tarball installed; client + SSR builds; zero React`);
} catch (error) {
  if (error.stdout) console.error(String(error.stdout));
  if (error.stderr) console.error(String(error.stderr));
  throw error;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
