import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { PluginHost, getPluginHost, tagError, tagPrefixError, validateManifest } from '../dist/index.js';

const schema = JSON.parse(readFileSync(new URL('../microcks-plugin.schema.json', import.meta.url), 'utf8'));

const manifest = (over = {}) => ({
  schemaVersion: 1,
  id: 'io.github.acme.kafka-replay',
  name: 'Kafka Replay',
  version: '0.3.0',
  publisher: { name: 'ACME' },
  microcks: '>=2.0.0 <3.0.0',
  permissions: ['services:read'],
  frontend: { entry: './kafka-replay.js', tagPrefix: 'acme-', contributes: ['nav.items', 'service.tabs'] },
  ...over,
});
const withFrontend = (f) => manifest({ frontend: { ...manifest().frontend, ...f } });
const without = (key) => {
  const m = manifest();
  delete m[key];
  return m;
};

/** A plugin that tries `fn(api)` during activation. */
const plugin = (m, fn = () => {}) => ({ manifest: m, activate: (api) => fn(api) });
const contribute = (m, point, element, trusted) => {
  const host = new PluginHost();
  return host.register(plugin(m, (api) => api.contribute(point, { id: 'x', element })), trusted);
};

describe('tagPrefix is required and not reserved (schema and runtime)', () => {
  const tagPrefixSchema = schema.properties.frontend.properties.tagPrefix;
  const schemaRe = new RegExp(tagPrefixSchema.pattern);

  it('the schema requires tagPrefix whenever there is a frontend part', () => {
    assert.ok(schema.properties.frontend.required.includes('tagPrefix'));
    assert.ok(schema.properties.frontend.required.includes('contributes'));
  });

  it('schema and runtime agree on valid and reserved prefixes', () => {
    const ok = ['acme-', 'kafka2-', 'a-', 'microcksx-', 'wf-'];
    const reserved = ['mk-', 'microcks-', 'workflow-', 'command-', 'plugin-'];
    const malformed = ['', 'acme', 'Acme-', 'acme--', 'a-b-', '1a-', '-'];
    for (const p of ok) {
      assert.equal(schemaRe.test(p), true, `schema ${p}`);
      assert.equal(tagPrefixError(p), undefined, `runtime ${p}`);
    }
    for (const p of [...reserved, ...malformed]) {
      assert.equal(schemaRe.test(p), false, `schema ${p}`);
      assert.notEqual(tagPrefixError(p), undefined, `runtime ${p}`);
    }
  });

  it('a manifest with a frontend part and no tagPrefix is rejected', async () => {
    const m = manifest();
    delete m.frontend.tagPrefix;
    assert.match(validateManifest(m).join('\n'), /tagPrefix is required/);
    await assert.rejects(new PluginHost().register(plugin(m)), /tagPrefix is required/);
  });

  it('a reserved tagPrefix is rejected at registration', async () => {
    for (const prefix of ['mk-', 'microcks-', 'workflow-', 'command-', 'plugin-']) {
      await assert.rejects(new PluginHost().register(plugin(withFrontend({ tagPrefix: prefix }))), /reserved|cover a host tag/, prefix);
    }
  });

  it('a manifest without frontend cannot contribute any tag', async () => {
    for (const tag of ['workflow-loom', 'mk-x', 'script', 'iframe', 'acme-widget']) {
      await assert.rejects(contribute(without('frontend'), 'nav.items', tag), /no frontend part/, tag);
    }
  });
});

describe('contributed tags', () => {
  it('accepts a tag under the plugin prefix', async () => {
    const host = new PluginHost();
    await host.register(plugin(manifest(), (api) => api.contribute('nav.items', { id: 'a', element: 'acme-replay-widget' })));
    assert.equal(host.contributionsFor('nav.items').length, 1);
  });

  it('rejects tags without a hyphen, and host tags', async () => {
    const m = withFrontend({ tagPrefix: 'acme-' });
    for (const tag of ['script', 'iframe', 'div', 'workflow-loom', 'command-bar', 'plugin-slot', 'mk-shell', 'microcks-x', 'other-widget', 'ACME-x', 'acme-', 'acme-<x>']) {
      await assert.rejects(contribute(m, 'nav.items', tag), /must start with|host element|reserved|not a valid custom element/, tag);
    }
  });

  it('tagError explains each case', () => {
    assert.match(tagError('script', 'acme-'), /not a valid custom element name/);
    assert.match(tagError('workflow-loom', 'acme-'), /host element/);
    assert.match(tagError('mk-x', 'acme-'), /reserved/);
    assert.match(tagError('other-x', 'acme-'), /must start with/);
    assert.equal(tagError('acme-x', 'acme-'), undefined);
  });
});

describe('contributes and permissions are enforced', () => {
  it('rejects an extension point that is not in frontend.contributes', async () => {
    await assert.rejects(contribute(manifest(), 'cockpit.widgets', 'acme-w'), /"cockpit\.widgets" is not listed in frontend\.contributes/);
    await contribute(manifest(), 'service.tabs', 'acme-w');
  });

  it('import.sources needs services:write', async () => {
    const m = withFrontend({ contributes: ['import.sources'] });
    await assert.rejects(contribute(m, 'import.sources', 'acme-i'), /requires the "services:write" permission/);
    await contribute({ ...m, permissions: ['services:write'] }, 'import.sources', 'acme-i');
  });

  it('the host can grant fewer permissions than the manifest requests', async () => {
    const m = manifest({ permissions: ['services:read', 'tests:run'] });
    await assert.rejects(new PluginHost().register(plugin(m), { granted: ['services:read'] }), /permissions not granted: tests:run/);
    const host = new PluginHost();
    await host.register(plugin(m, (api) => {
      assert.equal(api.hasPermission('tests:run'), true);
      assert.equal(api.hasPermission('secrets:read'), false);
    }), { granted: ['services:read', 'tests:run', 'secrets:read'] });
  });

  it('the manifest handed to the plugin is frozen', async () => {
    const m = manifest();
    await new PluginHost().register(plugin(m, (api) => {
      assert.throws(() => api.manifest.frontend.contributes.push('cockpit.widgets'), TypeError);
      assert.throws(() => { api.manifest.frontend.tagPrefix = 'mk-'; }, TypeError);
    }));
    assert.deepEqual(m.frontend.contributes, ['nav.items', 'service.tabs']);
  });
});

describe('manifest validation', () => {
  it('accepts a valid manifest and reports every problem of an invalid one', () => {
    assert.deepEqual(validateManifest(manifest()), []);
    const errors = validateManifest({ schemaVersion: 2, id: 'bad', permissions: ['root'], frontend: { contributes: ['nope'] } });
    assert.ok(errors.length >= 6, errors.join('\n'));
    assert.match(errors.join('\n'), /unknown extension point "nope"/);
    assert.match(errors.join('\n'), /permissions must be a list/);
  });

  it('register rejects an invalid manifest exported by the module', async () => {
    await assert.rejects(new PluginHost().register(plugin(manifest({ id: 'x' }))), /Invalid manifest/);
  });
});

describe('load() with a trusted manifest', () => {
  const ENTRY = 'https://shell.example/plugins/io.github.acme.kafka-replay/kafka-replay.js';
  const SOURCE = 'export default {}';
  const bytes = new TextEncoder().encode(SOURCE).buffer;
  const sri = (alg, data = SOURCE) => `${alg}-${createHash(alg).update(data).digest('base64')}`;

  const hostFor = (moduleManifest, imported = []) =>
    new PluginHost({
      fetchBytes: async () => bytes,
      importModule: async (url, verified) => {
        imported.push({ url, verified });
        return { default: plugin(moduleManifest, (api) => api.contribute('nav.items', { id: 'a', element: 'acme-w' })) };
      },
    });

  it('registers with the trusted manifest', async () => {
    const host = hostFor(manifest());
    await host.load(ENTRY, { manifest: manifest() });
    assert.equal(host.list()[0].id, 'io.github.acme.kafka-replay');
  });

  it('the trusted manifest wins: a module that widens its own manifest is an error', async () => {
    for (const evil of [
      withFrontend({ contributes: ['nav.items', 'service.tabs', 'cockpit.widgets'] }),
      withFrontend({ tagPrefix: 'evil-' }),
      manifest({ permissions: ['services:read', 'secrets:read'] }),
      manifest({ version: '9.9.9' }),
    ]) {
      const host = hostFor(evil);
      await assert.rejects(host.load(ENTRY, { manifest: manifest() }), /differs from the trusted manifest \(manifest\./);
      assert.deepEqual(host.list(), []);
    }
  });

  it('key order does not matter when comparing manifests', async () => {
    const reordered = JSON.parse(JSON.stringify(manifest()));
    const { frontend, ...rest } = reordered;
    await hostFor({ frontend, ...rest }).load(ENTRY, { manifest: manifest() });
  });

  it('the registered manifest is the trusted one even if the module mutates its own object later', async () => {
    const own = manifest();
    const host = new PluginHost({ importModule: async () => ({ default: plugin(own) }) });
    await host.load(ENTRY, { manifest: manifest() });
    own.frontend.tagPrefix = 'mk-';
    assert.equal(host.list()[0].frontend.tagPrefix, 'acme-');
  });

  it('rejects an invalid trusted manifest, one without frontend, and an entry that does not match', async () => {
    await assert.rejects(hostFor(manifest()).load(ENTRY, { manifest: manifest({ id: 'x' }) }), /Invalid manifest/);
    await assert.rejects(hostFor(manifest()).load(ENTRY, { manifest: without('frontend') }), /no frontend part/);
    await assert.rejects(hostFor(manifest()).load('https://shell.example/other.js', { manifest: manifest() }), /does not match frontend\.entry/);
    await hostFor(manifest()).load(`${ENTRY}?v=2`, { manifest: manifest() });
    const abs = withFrontend({ entry: 'https://x.example/a.js' });
    await hostFor(abs).load('https://x.example/a.js', { manifest: abs });
  });

  it('rejects a module that is not a plugin', async () => {
    const host = new PluginHost({ importModule: async () => ({ default: { nope: true } }) });
    await assert.rejects(host.load(ENTRY), /does not export a plugin/);
  });

  describe('integrity', () => {
    it('imports the verified bytes when the hash matches (sha256, sha384, sha512, or one of several)', async () => {
      for (const integrity of [sri('sha256'), sri('sha384'), sri('sha512'), `sha256-AAAA ${sri('sha256')}`]) {
        const imported = [];
        await hostFor(manifest(), imported).load(ENTRY, { manifest: manifest(), integrity });
        assert.equal(imported[0].verified, bytes);
      }
    });

    it('fails on a mismatch, before importing anything', async () => {
      const imported = [];
      const host = hostFor(manifest(), imported);
      await assert.rejects(host.load(ENTRY, { manifest: manifest(), integrity: sri('sha256', 'tampered') }), /Integrity check failed/);
      assert.equal(imported.length, 0);
      assert.deepEqual(host.list(), []);
    });

    it('rejects an unsupported integrity value', async () => {
      await assert.rejects(hostFor(manifest()).load(ENTRY, { integrity: 'md5-abc' }), /Unsupported integrity value/);
      await assert.rejects(hostFor(manifest()).load(ENTRY, { integrity: '  ' }), /Empty integrity value/);
    });

    it('without integrity nothing is fetched and the entry is imported by URL', async () => {
      const imported = [];
      const host = new PluginHost({
        fetchBytes: async () => { throw new Error('should not fetch'); },
        importModule: async (url, verified) => { imported.push({ url, verified }); return { default: plugin(manifest()) }; },
      });
      await host.load(ENTRY, { manifest: manifest() });
      assert.deepEqual(imported, [{ url: ENTRY, verified: undefined }]);
    });
  });
});

describe('activation failure', () => {
  it('leaves no plugin and no contribution behind', async () => {
    const host = new PluginHost();
    await assert.rejects(
      host.register(plugin(manifest(), (api) => {
        api.contribute('nav.items', { id: 'a', element: 'acme-a' });
        throw new Error('boom');
      })),
      /boom/,
    );
    assert.deepEqual(host.list(), []);
    assert.deepEqual(host.contributionsFor('nav.items'), []);
    await host.register(plugin(manifest())); // the id is free again
  });
});

describe('the shared host', () => {
  it('lives on globalThis as a read-only, non-configurable property', () => {
    const host = getPluginHost();
    assert.equal(getPluginHost(), host);
    const d = Object.getOwnPropertyDescriptor(globalThis, PluginHost.GLOBAL_KEY);
    assert.equal(d.writable, false);
    assert.equal(d.configurable, false);
    assert.equal(d.value, host);
    assert.throws(() => { globalThis[PluginHost.GLOBAL_KEY] = {}; }, TypeError);
    assert.throws(() => delete globalThis[PluginHost.GLOBAL_KEY], TypeError);
    assert.throws(() => Object.defineProperty(globalThis, PluginHost.GLOBAL_KEY, { value: {} }), TypeError);
    assert.equal(getPluginHost(), host);
  });

  it('another bundle with its own copy of the SDK gets the same host', async () => {
    const host = getPluginHost();
    const copy = await import(`../dist/host.js?second-bundle`);
    assert.notEqual(copy.PluginHost, PluginHost);
    assert.equal(copy.getPluginHost(), host);
  });
});
