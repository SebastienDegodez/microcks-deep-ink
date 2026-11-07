import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = resolve(root, 'src');
const repo = resolve(root, '../..');

function violations(text, file) {
  const result = [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const preprocessed = ts.preProcessFile(text, true, true);
  for (const { fileName } of preprocessed.importedFiles) {
    const target = resolve(dirname(file), fileName);
    const local = relative(sourceRoot, target);
    if (!fileName.startsWith('.') || local === '..' || local.startsWith(`..${sep}`)) {
      result.push(`External import: ${fileName}`);
    }
  }
  if (preprocessed.referencedFiles.length || preprocessed.typeReferenceDirectives.length || preprocessed.libReferenceDirectives.length) {
    result.push('Source-level reference directives are not allowed');
  }
  function visit(node) {
    if (ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
        (!node.arguments[0] || !ts.isStringLiteral(node.arguments[0]))) {
      result.push('Computed module imports are not allowed');
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) result.push('JSX is not allowed');
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

test('demo-core has only local TypeScript source imports and no runtime dependencies', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  for (const kind of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    assert.deepEqual(Object.keys(manifest[kind] ?? {}), [], kind);
  }
  assert.deepEqual(Object.keys(manifest.devDependencies ?? {}), ['typescript'], 'Only the framework-neutral compiler is needed');
  for (const file of sourceFiles(sourceRoot)) {
    assert.match(file, /\.ts$/, 'No rendering, styles or assets in demo-core');
    assert.deepEqual(violations(readFileSync(file, 'utf8'), file), [], file);
  }
});

test('the boundary rejects framework, design-system and demo back-references', () => {
  const file = resolve(sourceRoot, 'govern/example.ts');
  for (const specifier of ['react', 'svelte', '@angular/core', '@microcks/deep-ink', '../../../apps/demo-react/src/domain/shared/index.js']) {
    for (const text of [
      `import type { Value } from '${specifier}';`,
      `export * from '${specifier}';`,
      `import('${specifier}');`,
      `require('${specifier}');`,
      `type Value = import('${specifier}').Value;`,
    ]) assert.notDeepEqual(violations(text, file), [], text);
  }
  assert.notDeepEqual(violations('import(variable);', file), []);
  assert.notDeepEqual(violations('/// <reference types="react" />', file), []);
  assert.deepEqual(violations("export * from './secret-form.js';", file), []);
});

test('design-system package manifests cannot depend on demo-core or the demos', () => {
  for (const folder of ['packages/core', 'packages/tokens', 'packages/registry', 'react/packages/deep-ink', 'svelte/packages/deep-ink']) {
    const manifest = JSON.parse(readFileSync(resolve(repo, folder, 'package.json'), 'utf8'));
    for (const kind of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [name, specifier] of Object.entries(manifest[kind] ?? {})) {
        assert.doesNotMatch(`${name} ${specifier}`, /demo-core|demo-react|demo-svelte|demo-angular|(?:link:|file:).*apps\//, `${folder}: ${name}`);
      }
    }
  }
});
