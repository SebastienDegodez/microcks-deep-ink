<!--
  Text link (registry item link). Same props as the React Link: external, className plus any <a> attribute, and any
  React handler (onClick, onKeyDown, onFocus...). `external` opens in a new tab and adds an icon, a hidden notice and
  rel="noopener noreferrer".
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAnchorAttributes, 'class' | 'children'> &
    ReactHandlers<HTMLAnchorElement> & {
    /** Opens in a new tab: adds an icon, a hidden notice and rel="noopener noreferrer". */
    external?: boolean;
    className?: string;
    children?: Snippet;
  };

  let { external, className, rel, target, children, ...rest }: Props = $props();

  // In an expression, so that the compiler keeps it.
  const space = ' ';
</script>

<a
  {...reactEvents(rest)}
  class={['link', className].filter(Boolean).join(' ')}
  data-external={external ? '' : undefined}
  target={external ? '_blank' : target}
  rel={external ? 'noopener noreferrer' : rel}
>{@render children?.()}{#if external}<Icon name="external" size={14} />{space}<span class="sr-only">(opens in a new tab)</span>{/if}</a
>
