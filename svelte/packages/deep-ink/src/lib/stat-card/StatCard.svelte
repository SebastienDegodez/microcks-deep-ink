<script lang="ts" module>export type { StatCardProps, StatCardTone } from './stat-card.js';</script>
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { StatCardTone } from './stat-card.js';
  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> & { title: string | Snippet; headingLevel?: 2 | 3 | 4 | 5 | 6; action?: Snippet; value: string | Snippet; unit?: string | Snippet; tone?: StatCardTone; class?: string; children?: Snippet };
  let { title, headingLevel = 2, action, value, unit, tone = 'neutral', class: cssClass, children, ...rest }: Props = $props();
  const id = $props.id();
</script>
{#snippet text(v: string | Snippet)}{#if typeof v === 'function'}{@render v()}{:else}{v}{/if}{/snippet}
<section {...rest} class={['stat-card', cssClass].filter(Boolean).join(' ')} aria-labelledby={id} data-tone={tone}>
  <div class="stat-card-head"><svelte:element this={`h${headingLevel}`} class="stat-card-title" id={id}>{@render text(title)}</svelte:element>{#if action}<span class="stat-card-action">{@render action()}</span>{/if}</div><p class="stat-card-figure"><span class="stat-card-value">{@render text(value)}</span>{#if unit}<span class="stat-card-unit">{@render text(unit)}</span>{/if}</p>{#if children}<div class="stat-card-body">{@render children()}</div>{/if}
</section>
