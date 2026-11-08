import { SyntaxHighlighter } from 'storybook/internal/components';

type Grammar = Record<string, unknown>;
interface PrismLike {
  languages: Record<string, Grammar> & {
    extend(id: string, redef: Grammar): Grammar;
    insertBefore(inside: string, before: string, insert: Grammar, root?: Grammar): Grammar;
  };
}

/**
 * Prism grammar for the Svelte examples of "Show code": markup, plus `{#if}`/`{:else}`/`{@render}` blocks,
 * `{expressions}` (text and attributes) and a TypeScript `<script>`. Storybook only ships JSX, HTML, TS…
 */
function svelte(Prism: PrismLike) {
  const braces = String.raw`\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}`;
  const script = Prism.languages.typescript ?? Prism.languages.javascript;
  const expression = {
    pattern: new RegExp(braces),
    inside: {
      block: { pattern: /^\{[#:/@][a-z]+/, inside: { punctuation: /^\{[#:/@]/, keyword: /[a-z]+/ } },
      punctuation: /^\{|\}$/,
      rest: script,
    },
  };
  Prism.languages.svelte = Prism.languages.extend('markup', {});
  Prism.languages.insertBefore('svelte', 'tag', {
    script: {
      pattern: /(<script\b[^>]*>)[\s\S]*?(?=<\/script>)/i,
      lookbehind: true,
      greedy: true,
      inside: script,
    },
  });
  const tag = Prism.languages.svelte.tag as { pattern: RegExp; inside: Grammar };
  tag.pattern = new RegExp(
    String.raw`<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*(?:${braces}|[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|${braces}|[^\s'">=]+(?=[\s>])))?)))*\s*\/?>`,
  );
  Prism.languages.insertBefore('inside', 'attr-value', { 'svelte-expression': { ...expression, alias: 'language-javascript' } }, tag);
  Prism.languages.insertBefore('svelte', 'entity', { 'svelte-expression': expression });
}
svelte.displayName = 'svelte';
svelte.aliases = [] as string[];

SyntaxHighlighter.registerLanguage('svelte', svelte);
