import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function unwrap(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) node = node.expression;
  return node;
}

function property(node, name) {
  node = unwrap(node);
  return node && ts.isObjectLiteralExpression(node)
    ? node.properties.find((entry) => ts.isPropertyAssignment(entry) && entry.name.getText() === name)?.initializer
    : undefined;
}

function compositionSource(file, watch, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  watch(file);
  const code = readFileSync(file, 'utf8').trim();
  const dependencies = [];
  for (const match of code.matchAll(/import\s+[\s\S]*?\s+from\s+['"](\.[^'"]+\.svelte)['"]/g)) {
    dependencies.push(...compositionSource(resolve(dirname(file), match[1]), watch, seen));
  }
  return [{ file, code }, ...dependencies];
}

/** Read actual example files, not Storybook's CSF render adapters. */
export function storySources(code, file, watch = () => {}) {
  const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const imports = new Map();
  const declarations = new Map();
  const stories = new Map();
  let meta;
  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const path = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (clause?.name) imports.set(clause.name.text, { path, name: clause.name.text });
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const entry of clause.namedBindings.elements) {
          imports.set(entry.name.text, { path, name: (entry.propertyName ?? entry.name).text });
        }
      }
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        declarations.set(declaration.name.text, declaration.initializer);
        if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
          stories.set(declaration.name.text, declaration.initializer);
        }
      }
    }
    if (ts.isExportAssignment(statement)) meta = statement.expression;
  }
  function dereference(node) {
    node = unwrap(node);
    return node && ts.isIdentifier(node) && declarations.has(node.text) ? dereference(declarations.get(node.text)) : node;
  }
  function object(node) {
    node = dereference(node);
    if (node && ts.isCallExpression(node)) return object(node.arguments[0]);
    return node;
  }
  function snippetText(node) {
    if (!node) return undefined;
    node = unwrap(node);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isCallExpression(node) && node.expression.getText() === 'createRawSnippet') {
      const factory = unwrap(node.arguments[0]);
      if (factory && ts.isArrowFunction(factory)) {
        const render = unwrap(property(factory.body, 'render'));
        if (render && ts.isArrowFunction(render)) return snippetText(render.body);
      }
      throw new Error(`Unsupported raw snippet in ${file}: ${node.getText()}`);
    }
    return undefined;
  }
  function renderedComponent(node, visited = new Set()) {
    if (!node) return undefined;
    node = unwrap(node);
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'Component') return unwrap(node.initializer);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && !visited.has(node.expression.text)) {
      visited.add(node.expression.text);
      const found = renderedComponent(declarations.get(node.expression.text), visited);
      if (found) return found;
    }
    let found;
    ts.forEachChild(node, (child) => { found ??= renderedComponent(child, visited); });
    return found;
  }
  const sources = new Map();
  for (const [name, initializer] of stories) {
    const component = renderedComponent(initializer) ?? unwrap(property(dereference(meta), 'component'));
    if (!component || !ts.isIdentifier(component)) throw new Error(`No example component for ${file}: ${name}`);
    const imported = imports.get(component.text);
    if (imported?.path.endsWith('.svelte')) {
      const parts = compositionSource(resolve(dirname(file), imported.path), watch);
      sources.set(name, {
        code: parts.length === 1 ? parts[0].code : parts.map((part) =>
          `<!-- ${relative(dirname(file), part.file)} -->\n${part.code}`).join('\n\n'),
      });
    } else if (imported?.path === '@microcks/deep-ink') {
      const snippets = {};
      for (const args of [property(dereference(meta), 'args'), property(object(initializer), 'args')]) {
        const value = dereference(args);
        if (!value || !ts.isObjectLiteralExpression(value)) continue;
        for (const entry of value.properties) {
          if (!ts.isPropertyAssignment(entry)) continue;
          const text = snippetText(entry.initializer);
          if (text !== undefined && ts.isCallExpression(unwrap(entry.initializer))) {
            snippets[entry.name.getText().replace(/^['"]|['"]$/g, '')] = text;
          }
        }
      }
      sources.set(name, { component: imported.name, snippets });
    } else {
      throw new Error(`Example must use a Svelte composition or the public package: ${file}: ${name}`);
    }
  }
  return sources;
}

export function storySourcePlugin() {
  return {
    name: 'deep-ink-svelte-story-source',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0];
      if (!file.endsWith('.stories.ts')) return;
      const sources = storySources(code, file, (dependency) => this.addWatchFile(dependency));
      const helper = fileURLToPath(new URL('../.storybook/component-source.mjs', import.meta.url)).replaceAll('\\', '/');
      const assignments = [...sources].map(([name, source]) => {
        const config = source.code
          ? `code: ${JSON.stringify(source.code)}, type: 'code'`
          : `type: 'dynamic', transform: (_code, context) => __deepInkComponentSource(${JSON.stringify(source.component)}, context.args, ${JSON.stringify(source.snippets)})`;
        return `${name}.parameters = { ...${name}.parameters, docs: { ...${name}.parameters?.docs, source: { ...${name}.parameters?.docs?.source, language: 'svelte', ${config} } } };`;
      });
      return {
        code: `${code}\nimport { componentSource as __deepInkComponentSource } from ${JSON.stringify(helper)};\n${assignments.join('\n')}\n`,
        map: null,
      };
    },
  };
}
