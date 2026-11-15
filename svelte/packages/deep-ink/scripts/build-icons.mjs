import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Parse literal registry icon data at build time; never import or execute a renderer.
export function readPaths(source) {
  const file = ts.createSourceFile('icons.ts', source, ts.ScriptTarget.Latest, true);
  const declaration = file.statements.flatMap((statement) =>
    ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [],
  ).find((node) => ts.isIdentifier(node.name) && node.name.text === 'PATHS');
  assert(declaration?.initializer, 'Registry icon PATHS contract missing');
  function literal(node) {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return literal(node.expression);
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map((property) => {
      assert(ts.isPropertyAssignment(property), 'Only literal icon properties are supported');
      assert(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name), 'Invalid icon key');
      return [property.name.text, literal(property.initializer)];
    }));
    throw new Error('Registry icon data must contain only string, array and object literals');
  }
  const paths = literal(declaration.initializer);
  assert(Array.isArray(paths.circle), 'Fallback circle missing');
  for (const strokes of Object.values(paths)) {
    assert(Array.isArray(strokes) && strokes.length, 'Empty icon');
    for (const stroke of strokes) {
      assert(typeof stroke === 'string' || (
        Object.keys(stroke).sort().join(',') === 'd,dash' &&
        typeof stroke.d === 'string' && typeof stroke.dash === 'string'
      ), 'Invalid icon stroke contract');
    }
  }
  return paths;
}

export function registryPaths() {
  const require = createRequire(import.meta.url);
  return readPaths(readFileSync(require.resolve('@microcks-deep-ink/registry/angular/icon'), 'utf8'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/internal/icon-data.ts');
  const paths = registryPaths();
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, `// Generated from the public registry icon artifact by build-icons.mjs. Do not edit.\nexport type IconName = ${Object.keys(paths).map((name) => JSON.stringify(name)).join(' | ')};\nexport const ICON_PATHS: Record<IconName, readonly (string | { readonly d: string; readonly dash: string })[]> = ${JSON.stringify(paths, null, 2)};\n`);
  console.log(`Native Svelte icon contract: ${Object.keys(paths).length} icons`);
}
