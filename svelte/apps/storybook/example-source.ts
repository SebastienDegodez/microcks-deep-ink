import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { format } from 'prettier';
import * as sveltePlugin from 'prettier-plugin-svelte';

const IMPORT = /^[ \t]*import\s+(type\s+)?\{([^}]*)\}\s+from\s+(['"][^'"]+['"]);?[ \t]*\r?\n/gm;

/** Drops the named imports an example never uses (e.g. `untrack`), so the shown code only imports what it needs. */
function dropUnusedImports(source: string): string {
  const body = source.replace(IMPORT, '');
  return source.replace(IMPORT, (_line, type: string | undefined, names: string, from: string) => {
    const used = names
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name && new RegExp(`\\b${name.replace(/^type\s+/, '').split(/\s+as\s+/).pop()}\\b`).test(body));
    return used.length ? `import ${type ?? ''}{ ${used.join(', ')} } from ${from};\n` : '';
  });
}

/** Puts adjacent tags (`</a><b>`) on their own lines outside `<script>`, so the formatter can indent them. */
function splitAdjacentTags(source: string): string {
  return source
    .split(/(<script\b[\s\S]*?<\/script>)/)
    .map((part) =>
      part.startsWith('<script')
        ? part
        : part
            .replace(/>(?=<)/g, '>\n')
            .replace(/>(?=\{[#:/])/g, '>\n')
            .replace(/(\{[#:/][^{}]*\})(?=<)/g, '$1\n'),
    )
    .join('');
}

/**
 * Formats the `*.svelte?raw` examples shown by "Show code": one element per line, indented.
 * Only the displayed string changes; the rendered component keeps its exact whitespace.
 */
export function exampleSource(): Plugin {
  return {
    name: 'deep-ink-example-source',
    enforce: 'pre',
    async load(id) {
      const [file, query] = id.split('?');
      if (query !== 'raw' || !file.endsWith('.svelte') || !file.includes('/src/stories/')) return;
      const raw = await readFile(file, 'utf8');
      let code = raw;
      try {
        code = await format(splitAdjacentTags(dropUnusedImports(raw)), {
          parser: 'svelte',
          plugins: [sveltePlugin],
          singleQuote: true,
          printWidth: 100,
          htmlWhitespaceSensitivity: 'ignore',
        });
      } catch (error) {
        this.warn(`kept unformatted example ${file}: ${(error as Error).message}`);
      }
      return `export default ${JSON.stringify(code.replace(/<script lang="ts">\s*<\/script>\s*/, '').trim() + '\n')};`;
    },
  };
}
