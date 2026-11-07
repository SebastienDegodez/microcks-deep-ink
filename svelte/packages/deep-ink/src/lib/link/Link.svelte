
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAnchorAttributes, 'class' | 'children'> &
    NativeHandlers<HTMLAnchorElement> & {
    /** Opens in a new tab: adds an icon, a hidden notice and rel="noopener noreferrer". */
    external?: boolean;
    class?: string;
    children?: Snippet;
  };

  let { external, class: cssClass, rel, target, children, ...rest }: Props = $props();

  // In an expression, so that the compiler keeps it.
  const space = ' ';
</script>

<a
  {...eventProps(rest)}
  class={['link', cssClass].filter(Boolean).join(' ')}
  data-external={external ? '' : undefined}
  target={external ? '_blank' : target}
  rel={external ? 'noopener noreferrer' : rel}
>{@render children?.()}{#if external}<Icon name="external" size={14} />{space}<span class="sr-only">(opens in a new tab)</span>{/if}</a
>
