#!/usr/bin/env node
// Generates src/stories/_argtypes.generated.ts: for every Angular registry item, the signal inputs
// (`input()`, `input.required()`, `model()`) of its components and directives, with their resolved TypeScript
// type (string-literal unions become select options), default value and JSDoc. Angular Storybook has no
// compodoc here (angular.json "compodoc": false), so this feeds the Controls panel and the docs table.
// Run: pnpm --filter storybook-angular gen:argtypes
import { createRequire } from 'node:module';
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY = resolve(HERE, '../../../packages/registry');
const require = createRequire(join(REGISTRY, 'package.json'));
const ts = require('typescript');

const dir = join(REGISTRY, 'src/angular');
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')).map((f) => join(dir, f));
const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true, experimentalDecorators: true, noEmit: true, skipLibCheck: true, types: [], lib: ['lib.es2023.d.ts', 'lib.dom.d.ts'],
});
const checker = program.getTypeChecker();

function decoratorInfo(node) {
  for (const d of ts.getDecorators?.(node) ?? []) {
    const call = d.expression;
    if (!ts.isCallExpression(call)) continue;
    const name = call.expression.getText();
    if (name !== 'Component' && name !== 'Directive') continue;
    const arg = call.arguments[0];
    let selector = '';
    if (arg && ts.isObjectLiteralExpression(arg)) {
      for (const p of arg.properties) if (ts.isPropertyAssignment(p) && p.name.getText() === 'selector') selector = p.initializer.getText().replace(/^['"`]|['"`]$/g, '');
    }
    return { kind: name, selector };
  }
  return null;
}

function unwrap(type) {
  // InputSignal<T> / InputSignalWithTransform<T, U> / ModelSignal<T>: the first type argument is the read type.
  const args = type.aliasTypeArguments ?? checker.getTypeArguments(type);
  return args?.[0];
}

function describe(t) {
  const flags = t.flags;
  const nonNull = t.isUnion() ? t.types.filter((x) => !(x.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [t];
  const literals = nonNull.filter((x) => x.isStringLiteral() || x.isNumberLiteral() || (x.flags & ts.TypeFlags.BooleanLiteral));
  let text = t.aliasSymbol && !t.isUnion?.() ? t.aliasSymbol.name : checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
  if (t.aliasSymbol) text = t.aliasSymbol.name + (t.isUnion() && t.types.some((x) => x.flags & (ts.TypeFlags.Undefined)) ? ' | undefined' : '');
  if (text.length > 90) text = text.slice(0, 87) + '...';
  const strLits = nonNull.filter((x) => x.isStringLiteral()).map((x) => x.value);
  const numLits = nonNull.filter((x) => x.isNumberLiteral()).map((x) => x.value);
  const hasBool = nonNull.some((x) => x.flags & ts.TypeFlags.BooleanLiteral);
  let control = { type: 'object' };
  let options;
  if (nonNull.length && nonNull.every((x) => x.isStringLiteral()) && strLits.length) { control = { type: 'select' }; options = strLits; }
  else if (nonNull.length && nonNull.every((x) => x.isStringLiteral() || x.isNumberLiteral()) && (strLits.length || numLits.length)) { control = { type: 'select' }; options = [...strLits, ...numLits]; }
  else if (nonNull.length && nonNull.every((x) => x.flags & ts.TypeFlags.BooleanLiteral)) control = { type: 'boolean' };
  else if (nonNull.length && nonNull.every((x) => x.isStringLiteral() || (x.flags & ts.TypeFlags.BooleanLiteral) || x.isNumberLiteral()) && literals.length) { control = { type: 'select' }; options = [...strLits, ...numLits]; options.push(...nonNull.filter((x) => x.flags & ts.TypeFlags.BooleanLiteral).map((x) => x.intrinsicName === 'true')); }
  else if (nonNull.length === 1 && nonNull[0].flags & ts.TypeFlags.String) control = { type: 'text' };
  else if (nonNull.length === 1 && nonNull[0].flags & ts.TypeFlags.Number) control = { type: 'number' };
  else control = { type: 'object' };
  if (options && t.isUnion() && t.types.some((x) => x.flags & ts.TypeFlags.Undefined)) options = [...options];
  return { text, control, options };
}

const out = {};
for (const sf of program.getSourceFiles()) {
  if (!sf.fileName.startsWith(dir) || sf.fileName.endsWith('.d.ts')) continue;
  const item = sf.fileName.slice(dir.length + 1).replace(/\.ts$/, '');
  const classes = [];
  ts.forEachChild(sf, (node) => {
    if (!ts.isClassDeclaration(node) || !node.name) return;
    const info = decoratorInfo(node);
    if (!info) return;
    const inputs = [];
    for (const m of node.members) {
      if (!ts.isPropertyDeclaration(m) || !m.initializer || !ts.isCallExpression(m.initializer)) continue;
      const callee = m.initializer.expression.getText();
      const required = callee === 'input.required' || callee === 'model.required';
      if (!['input', 'input.required', 'model', 'model.required'].includes(callee)) continue;
      const name = m.name.getText();
      const sym = checker.getSymbolAtLocation(m.name);
      const type = unwrap(checker.getTypeAtLocation(m));
      if (!type) continue;
      const d = describe(type);
      const first = m.initializer.arguments[0];
      const hasDefault = !required && first && !(ts.isObjectLiteralExpression(first) && false);
      let def;
      if (!required && first && !ts.isObjectLiteralExpression(first)) def = first.getText();
      const doc = ts.displayPartsToString(sym?.getDocumentationComment(checker) ?? []).replace(/\s+/g, ' ').trim();
      inputs.push({ name, type: d.text, control: d.control.type, options: d.options, required, default: def, model: callee.startsWith('model'), description: doc });
    }
    if (inputs.length) classes.push({ className: node.name.text, selector: info.selector, inputs });
  });
  if (classes.length) out[item] = classes;
}

const q = (v) => JSON.stringify(v);
const lines = [];
for (const [item, classes] of Object.entries(out)) {
  lines.push(`  ${q(item)}: [`);
  for (const c of classes) {
    lines.push(`    { className: ${q(c.className)}, selector: ${q(c.selector)}, inputs: [`);
    for (const i of c.inputs) lines.push(`      ${q(i)},`);
    lines.push('    ] },');
  }
  lines.push('  ],');
}
const header = `// GENERATED by scripts/gen-argtypes.mjs from packages/registry/src/angular. Do not edit.\n// Run: pnpm --filter storybook-angular gen:argtypes\n`;
const types = `export interface InputDoc {
  name: string;
  type: string;
  control: 'select' | 'boolean' | 'text' | 'number' | 'object';
  options?: (string | number | boolean)[];
  required: boolean;
  default?: string;
  model: boolean;
  description: string;
}
export interface ClassDoc { className: string; selector: string; inputs: InputDoc[] }

`;
writeFileSync(join(HERE, '../src/stories/_argtypes.generated.ts'), header + types + 'export const REGISTRY_INPUTS: Record<string, ClassDoc[]> = {\n' + lines.join('\n') + '\n};\n');
console.log('items:', Object.keys(out).length, 'classes:', Object.values(out).reduce((n, c) => n + c.length, 0));
