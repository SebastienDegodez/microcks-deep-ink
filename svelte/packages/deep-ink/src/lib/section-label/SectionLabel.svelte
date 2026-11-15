<script lang="ts" module>export type { SectionLabelElement } from './section-label.js';</script>
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { SectionLabelElement } from './section-label.js';
  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & { as?: SectionLabelElement; size?: 'md' | 'sm'; weight?: 'semibold' | 'regular'; split?: boolean; lineHeight?: 'fixed' | 'normal' | 'snug'; htmlFor?: string; class?: string; children?: Snippet };
  let { as = 'span', size = 'md', weight = 'semibold', split, lineHeight = 'fixed', htmlFor, class: cssClass, children, ...rest }: Props = $props();
</script>
<svelte:element this={as} {...rest} for={as === 'label' ? htmlFor : undefined} class={['section-label', cssClass].filter(Boolean).join(' ')} data-size={size === 'md' ? undefined : size} data-weight={weight === 'semibold' ? undefined : weight} data-split={split ? '' : undefined} data-line-height={lineHeight === 'fixed' ? undefined : lineHeight}>{#if children}{@render children()}{/if}</svelte:element>
