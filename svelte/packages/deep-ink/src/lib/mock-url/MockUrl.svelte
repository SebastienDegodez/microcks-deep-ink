<script lang="ts" module>export { snippetFor } from './mock-url.js'; export type { MockUrlProps } from './mock-url.js';</script>
<script lang="ts">
 import type { HTMLAttributes } from 'svelte/elements'; import CopyButton from '../copy-button/CopyButton.svelte'; import MethodTag from '../MethodTag.svelte'; import Segmented from '../segmented/Segmented.svelte'; import { snippetFor, type MockUrlFormat } from './mock-url.js';
 type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & { url: string; method?: string; mcpTool?: string; bare?: boolean; class?: string };
 let { url, method = 'GET', mcpTool, bare, class: cssClass, ...rest }: Props = $props(); let chosen = $state<MockUrlFormat>('url');
 const format = $derived(bare || (chosen === 'mcp' && !mcpTool) ? 'url' : chosen);
 const text = $derived(snippetFor(format, url, method, mcpTool));
 const options = $derived([{ id: 'url', label: 'URL' }, { id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }, ...(mcpTool ? [{ id: 'mcp', label: 'MCP tool' }] : [])]);
 const copyLabel = $derived(format === 'url' ? 'Copy URL' : `Copy ${options.find((o) => o.id === format)?.label ?? ''}`);
</script>
{#if !bare}<Segmented label="Snippet format" options={options} value={format} onchange={(id) => chosen = id as MockUrlFormat} />{/if}
<div {...rest} class={['mock-url', cssClass].filter(Boolean).join(' ')}><MethodTag {method} /><code>{text}</code><CopyButton value={text} label={copyLabel} /></div>
