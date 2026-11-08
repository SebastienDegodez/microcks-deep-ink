import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'svelte/compiler';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stories = resolve(root, 'src/stories');

function unwrap(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) node = node.expression;
  return node;
}

function property(node, name) {
  node = unwrap(node);
  if (node && ts.isCallExpression(node)) return property(node.arguments[0], name);
  return node && ts.isObjectLiteralExpression(node)
    ? node.properties.find((entry) => ts.isPropertyAssignment(entry) && entry.name.getText() === name)?.initializer
    : undefined;
}

function sources(file) {
  const text = readFileSync(resolve(stories, file), 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const raw = new Map();
  for (const statement of ast.statements.filter(ts.isImportDeclaration)) {
    const path = statement.moduleSpecifier.text;
    if (path.endsWith('.svelte?raw')) {
      raw.set(statement.importClause.name.text, readFileSync(resolve(stories, path.slice(0, -4)), 'utf8'));
    }
  }
  function value(node) {
    node = unwrap(node);
    assert.ok(node, `${file}: missing native docs.source`);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isIdentifier(node)) {
      assert.ok(raw.has(node.text), `${file}: expected standard ?raw import for ${node.text}`);
      return raw.get(node.text);
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'join') {
      const array = node.expression.expression;
      assert.ok(ts.isArrayLiteralExpression(array));
      return array.elements.map(value).join(value(node.arguments[0]));
    }
    assert.fail(`${file}: unsupported source expression ${node.getText()}`);
  }
  const result = new Map();
  for (const statement of ast.statements.filter(ts.isVariableStatement)) {
    if (!statement.modifiers?.some((entry) => entry.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const source = property(property(property(declaration.initializer, 'parameters'), 'docs'), 'source');
      assert.equal(value(property(source, 'language')), 'svelte');
      assert.equal(value(property(source, 'type')), 'code');
      result.set(declaration.name.text, value(property(source, 'code')));
    }
  }
  return result;
}

test('Button Icons source contains real Svelte Button usage, not its CSF adapter', () => {
  const code = sources('Components.Button.stories.ts').get('WithIcon');
  assert.match(code, /<Button variant="primary" icon="play">Run test<\/Button>/);
  assert.match(code, /<Button iconOnly icon="trash" aria-label="Delete example"/);
  assert.doesNotMatch(code, /WithIconComposition|Component:|render: \(\)/);
  parse(code);
});

test('nested compositions include their actual helper files', () => {
  const code = sources('Components.Dialog.stories.ts').get('Default');
  assert.match(code, /<!-- Components.Dialog\/Default.svelte -->/);
  assert.match(code, /<!-- Components.Dialog\/Demo.svelte -->/);
  assert.match(code, /<Dialog /);
});

test('direct stories use native Svelte snippets and the public package', () => {
  const code = sources('Microcks.StatCard.stories.ts').get('Playground');
  assert.match(code, /import \{ StatCard \} from '@microcks\/deep-ink'/);
  assert.match(code, /{#snippet title\(\)}Conformance{\/snippet}/);
  assert.match(code, /Across 12 operations/);
  parse(code);
  parse(sources('Microcks.ApiBadge.stories.ts').get('Playground'));
});

test('every story declares native source metadata', () => {
  let count = 0;
  for (const file of readdirSync(stories).filter((name) => name.endsWith('.stories.ts'))) {
    for (const [name, code] of sources(file)) {
      assert.ok(code.includes('<'), `${file}: ${name}`);
      assert.doesNotMatch(code, /Component:/, `${file}: ${name}`);
      count++;
    }
  }
  assert.ok(count >= 307, `Expected all current examples, got ${count}`);
});

test('Show code does not require custom Storybook plugins or transforms', () => {
  const main = readFileSync(resolve(root, '.storybook/main.ts'), 'utf8');
  assert.doesNotMatch(main, /storySourcePlugin|deep-ink-svelte-story-source/);
  for (const file of readdirSync(stories).filter((name) => name.endsWith('.stories.ts'))) {
    const code = readFileSync(resolve(stories, file), 'utf8');
    assert.doesNotMatch(code, /__deepInkComponentSource|transform:/, file);
  }
});
