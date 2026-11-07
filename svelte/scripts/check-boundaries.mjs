import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const library = join(workspace, 'packages/deep-ink');
const forbidden = /^(?:react(?:-dom|-reconciler)?|@types\/react(?:-dom)?|@storybook\/react(?:-vite)?)(?:\/|$)/;

function graph(nodes) {
  for (const [name, node] of Object.entries(nodes ?? {})) {
    assert(!forbidden.test(name), `Production dependency must not require ${name}`);
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) graph(node[field]);
  }
}

function scan(directory) {
  assert(existsSync(directory), `Build first: missing ${directory}`);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (/\.(?:svelte|[cm]?[jt]sx?)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      assert(!/\bReact(?:Node|Element|Handlers|EventOverrides)?\b|\breactEvents\b|\bclassName\s*[?:]/.test(text), `React compatibility API in ${path}`);
      for (const match of text.matchAll(/(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)['"]([^'"]+)['"]/g)) {
        assert(!forbidden.test(match[1]), `Forbidden import ${match[1]} in ${path}`);
        assert(!/(?:^|\/)(?:react|react-events|registry\/src)(?:\/|$)/.test(match[1]), `Framework boundary violation in ${path}`);
      }
    }
  }
}

const manifest = JSON.parse(readFileSync(join(library, 'package.json'), 'utf8'));
assert.equal(manifest.name, '@microcks/deep-ink');
assert.equal(manifest.private, true);
for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) graph(manifest[field]);
assert.deepEqual(Object.keys(manifest.peerDependencies), ['svelte']);
scan(join(library, 'src/lib'));
scan(join(library, 'dist'));
scan(join(workspace, 'apps/storybook/src'));
scan(join(workspace, 'apps/storybook/.storybook'));
for (const app of readdirSync(join(workspace, 'apps'))) {
  const path = join(workspace, 'apps', app, 'package.json');
  if (existsSync(path)) {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) graph(pkg[field]);
  }
}
const list = JSON.parse(execFileSync('pnpm', ['list', '-r', '--prod', '--depth', 'Infinity', '--json'], {
  cwd: workspace, encoding: 'utf8',
}));
for (const pkg of list) graph(pkg.dependencies);
console.log('Svelte boundaries: native source/declarations, Storybook preview, production dependency graph OK');
