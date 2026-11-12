import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { validateArtifactUrl } from '@microcks/demo-core/domain/importing';
import { createInMemoryCatalogAdapters } from '@microcks/demo-core/infrastructure/in-memory/catalog';
import { workflowPath } from '@microcks/demo-core/presentation/workflows/paths';
import {
  createTickingStream,
  isFastMode,
  latency,
  setDefaultLatencyMode,
  setLatencyMode,
} from '@microcks/demo-core/infrastructure/in-memory/shared';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

afterEach(() => {
  setLatencyMode(undefined);
  setDefaultLatencyMode('normal');
  delete globalThis.window;
});

test('every public entry point loads in plain Node, without a DOM or a bundler', async () => {
  const entries = Object.keys(manifest.exports).filter((key) => !key.includes('*'));
  assert.ok(entries.length >= 28);
  for (const entry of entries) await import(`@microcks/demo-core/${entry.slice(2)}`);
});

test('the in-memory catalogue answers in plain Node', async () => {
  setDefaultLatencyMode('fast');
  const { catalog } = createInMemoryCatalogAdapters();
  assert.ok((await catalog.list()).some((service) => service.id === 'pastry2'));
  assert.equal((await catalog.operation('pastry2', 'get-name'))?.id, 'get-name');
});

test('latency is normal by default, fast when the default, the hash query or the storage flag asks', () => {
  assert.equal(isFastMode(), false);
  setDefaultLatencyMode('fast');
  assert.equal(isFastMode(), true);
  setLatencyMode('normal');
  assert.equal(isFastMode(), false);
  setLatencyMode(undefined);
  setDefaultLatencyMode('normal');
  const page = (hash, flag = null) => ({ location: { hash }, localStorage: { getItem: () => flag } });
  globalThis.window = page('#/services?fast');
  assert.equal(isFastMode(), true);
  globalThis.window = page('#/services?tab=x', '1');
  assert.equal(isFastMode(), true);
  globalThis.window = page('#/services?tab=fast');
  assert.equal(isFastMode(), false);
});

test('simulated latency and ticking streams use the host timers', async () => {
  setLatencyMode('normal');
  const started = Date.now();
  await latency();
  assert.ok(Date.now() - started >= 100);
  const seen = await new Promise((done) => {
    const values = [];
    const off = createTickingStream((tick) => tick, { intervalMs: 5 })((value) => {
      values.push(value);
      if (values.length === 3) {
        off();
        done(values);
      }
    });
  });
  assert.deepEqual(seen, [0, 1, 2]);
});

test('artifact URLs are parsed with the host URL implementation', () => {
  assert.equal(validateArtifactUrl('https://example.com/openapi.yaml'), undefined);
  assert.equal(validateArtifactUrl('ftp://example.com/openapi.yaml'), 'Use an http or https URL.');
  assert.match(validateArtifactUrl('openapi.yaml'), /^Enter an absolute URL/);
});

test('workflow routes encode selections with the host URLSearchParams without a DOM', () => {
  assert.equal(workflowPath('pastry', 'restock-pastry'), '/workflows/pastry/restock-pastry');
  assert.equal(
    workflowPath('pastry', 'restock-pastry', 'steps', { run: '14', step: 'a + b&c', empty: '', missing: undefined }),
    '/workflows/pastry/restock-pastry/steps?run=14&step=a+%2B+b%26c',
  );
});
