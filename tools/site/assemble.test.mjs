import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
test('assembles both clickable demos and refuses a missing Svelte build', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'deep-ink-site-test-'));
  try {
    const folders = ['react', 'angular', 'svelte', 'demo', 'demo-svelte'];
    for (const name of folders) {
      mkdirSync(join(fixture, name));
      writeFileSync(join(fixture, name, 'index.html'), `<title>${name}</title>`);
    }
    writeFileSync(join(fixture, 'svelte/index.json'), '{}');
    writeFileSync(join(fixture, 'demo/mockServiceWorker.js'), '// fixture');
    const env = {
      ...process.env,
      SITE_DIR: join(fixture, 'site'),
      REACT_STORYBOOK_DIR: join(fixture, 'react'),
      ANGULAR_STORYBOOK_DIR: join(fixture, 'angular'),
      SVELTE_STORYBOOK_DIR: join(fixture, 'svelte'),
      DEMO_DIR: join(fixture, 'demo'),
      SVELTE_DEMO_DIR: join(fixture, 'demo-svelte'),
    };
    execFileSync('bash', ['tools/site/assemble.sh'], { cwd: root, env });
    for (const name of folders) {
      assert.equal(readFileSync(join(fixture, 'site', name, 'index.html'), 'utf8'), `<title>${name}</title>`);
    }
    assert.match(readFileSync(join(fixture, 'site/index.html'), 'utf8'), /href="\.\/demo-svelte\/"/);
    rmSync(join(fixture, 'demo-svelte/index.html'));
    const missing = spawnSync('bash', ['tools/site/assemble.sh'], { cwd: root, env, encoding: 'utf8' });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /missing .*demo-svelte\/index.html/);
    assert.equal(readFileSync(join(fixture, 'site/demo-svelte/index.html'), 'utf8'), '<title>demo-svelte</title>');
  } finally {
    rmSync(fixture, { recursive: true });
  }
});
