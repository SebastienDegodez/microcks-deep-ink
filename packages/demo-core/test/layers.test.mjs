import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

// The layer rules demo-react applied to this code before #287 moved it here (.dependency-cruiser.cjs).
const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const FEATURE_APPLICATIONS = /^application\/(arazzo|catalog|copilot|govern|importing|observe|testing)\//;

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

const posix = (path) => path.split(sep).join('/');

/** `src`-relative module -> `src`-relative modules it imports (type-only imports and re-exports included). */
function sourceGraph() {
  const graph = new Map();
  for (const file of sourceFiles(sourceRoot)) {
    const { importedFiles } = ts.preProcessFile(readFileSync(file, 'utf8'), true, true);
    graph.set(
      posix(relative(sourceRoot, file)),
      importedFiles.map(({ fileName }) => posix(relative(sourceRoot, resolve(dirname(file), fileName))).replace(/\.js$/, '.ts')),
    );
  }
  return graph;
}

const featureOf = (path, layer) => path.slice(layer.length + 1).split('/')[0];

function layerViolations(graph) {
  const result = [];
  for (const [from, targets] of graph) {
    for (const to of targets) {
      const edge = `${from} -> ${to}`;
      if (!graph.has(to)) result.push(`Unresolvable: ${edge}`);
      if (from.startsWith('domain/') && !to.startsWith('domain/')) result.push(`Domain is isolated: ${edge}`);
      if (from.startsWith('domain/') && to.startsWith('domain/')) {
        const feature = featureOf(to, 'domain');
        if (feature !== 'shared' && feature !== featureOf(from, 'domain')) result.push(`Cross-feature domain: ${edge}`);
      }
      if (from.startsWith('application/') && !/^(domain|application)\//.test(to)) result.push(`Application depends on domain only: ${edge}`);
      if (FEATURE_APPLICATIONS.test(from) && FEATURE_APPLICATIONS.test(to) && featureOf(from, 'application') !== featureOf(to, 'application')) {
        result.push(`Cross-feature application: ${edge}`);
      }
    }
  }
  return result.concat(cycles(graph));
}

function cycles(graph) {
  const state = new Map();
  const found = [];
  const visit = (node, trail) => {
    state.set(node, 'open');
    for (const next of graph.get(node) ?? []) {
      if (state.get(next) === 'open') found.push(`Circular: ${[...trail.slice(trail.indexOf(next)), next].join(' -> ')}`);
      else if (!state.has(next)) visit(next, [...trail, next]);
    }
    state.set(node, 'done');
  };
  for (const node of graph.keys()) if (!state.has(node)) visit(node, [node]);
  return found;
}

test('the extracted layers keep the dependency rules they had in demo-react', () => {
  const graph = sourceGraph();
  assert.ok(graph.size > 100, 'domain, application and in-memory adapters are all checked');
  assert.deepEqual(layerViolations(graph), []);
});

test('the layer rules reject upward, cross-feature, dangling and circular imports', () => {
  const graph = (edges) => new Map(Object.entries(edges));
  const cases = {
    'Domain is isolated': { 'domain/catalog/a.ts': ['application/shared/index.ts'], 'application/shared/index.ts': [] },
    'Cross-feature domain': { 'domain/catalog/a.ts': ['domain/importing/b.ts'], 'domain/importing/b.ts': [] },
    'Application depends on domain only': { 'application/catalog/a.ts': ['infrastructure/in-memory/shared/b.ts'], 'infrastructure/in-memory/shared/b.ts': [] },
    'Cross-feature application': { 'application/catalog/a.ts': ['application/testing/b.ts'], 'application/testing/b.ts': [] },
    Unresolvable: { 'domain/catalog/a.ts': ['domain/catalog/missing.ts'] },
    Circular: { 'domain/catalog/a.ts': ['domain/catalog/b.ts'], 'domain/catalog/b.ts': ['domain/catalog/a.ts'] },
  };
  for (const [rule, edges] of Object.entries(cases)) {
    assert.ok(layerViolations(graph(edges)).some((v) => v.startsWith(rule)), rule);
  }
  assert.deepEqual(
    layerViolations(graph({
      'domain/catalog/a.ts': ['domain/shared/index.ts'],
      'domain/shared/index.ts': [],
      'application/catalog/a.ts': ['domain/catalog/a.ts', 'application/shared/b.ts', 'application/ports/c.ts'],
      'application/shared/b.ts': [],
      'application/ports/c.ts': [],
      'infrastructure/in-memory/catalog/a.ts': ['application/ports/c.ts', 'domain/catalog/a.ts'],
    })),
    [],
  );
});
