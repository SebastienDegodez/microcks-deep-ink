<script lang="ts" module>export type { OpPickOption, OpPickListProps } from './op-pick.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import MethodTag from '../MethodTag.svelte'; import type { OpPickOption } from './op-pick.js';
 type Props = { options: OpPickOption[]; value?: string; onchange: (id: string) => void; mode?: 'toggle' | 'radio'; label?: string; labelledBy?: string; class?: string };
 let { options, value, onchange, mode = 'toggle', label, labelledBy, class: cssClass }: Props = $props();
 let refs: HTMLButtonElement[] = [];
 const space = ' ';
 const checked = $derived(Math.max(0, options.findIndex((o) => o.id === value)));
 function content(v: string | Snippet) { return typeof v === 'function'; }
 function keydown(event: KeyboardEvent, i: number) {
  const n = options.length; if (!n) return;
  const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (i + 1) % n : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (i - 1 + n) % n : event.key === 'Home' ? 0 : event.key === 'End' ? n - 1 : undefined;
  if (next === undefined) return; event.preventDefault(); const option = options[next]; if (option) onchange(option.id); refs[next]?.focus();
 }
</script>
{#snippet card(o: OpPickOption)}<MethodTag method={o.method} protocol={o.protocol} />{space}<span class="op-pick-main"><span class="op-pick-path">{o.path}</span>{#if o.summary}{space}<span class="op-pick-summary">{#if content(o.summary)}{@render o.summary()}{:else}{o.summary}{/if}</span>{/if}{#if o.meta}{space}<span class="op-pick-meta">{#if content(o.meta)}{@render o.meta()}{:else}{o.meta}{/if}</span>{/if}</span> {#if o.end !== undefined && o.end !== null}<span class="op-pick-end" data-tone={o.endTone}>{#if o.endLabel}<span class="sr-only">{o.endLabel}</span> {/if}{#if content(o.end)}{@render o.end()}{:else}{o.end}{/if}</span>{/if}{/snippet}
{#if mode === 'toggle'}<ul class={['op-pick-list', cssClass].filter(Boolean).join(' ')} aria-label={label} aria-labelledby={labelledBy}>{#each options as o (o.id)}<li><button type="button" class="op-pick" aria-pressed={o.id === value} onclick={() => onchange(o.id)}>{@render card(o)}</button></li>{/each}</ul>
{:else}<div class={['op-pick-list', cssClass].filter(Boolean).join(' ')} role="radiogroup" aria-label={label} aria-labelledby={labelledBy}>{#each options as o, i (o.id)}<button bind:this={refs[i]} type="button" role="radio" class="op-pick" aria-checked={o.id === value} tabindex={i === checked ? 0 : -1} onclick={() => onchange(o.id)} onkeydown={(e) => keydown(e, i)}>{@render card(o)}</button>{/each}</div>{/if}
