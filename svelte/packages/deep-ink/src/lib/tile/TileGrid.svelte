
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Accessible name of the group: "Packages". */
    label: string;
    /** `section` (default) holds `article` tiles; `ul` holds `li` tiles. */
    as?: 'section' | 'ul' | 'div';
    class?: string;
    children?: Snippet;
  };

  let { label, as = 'section', class: cssClass, children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  {...eventProps(rest)}
  aria-label={label}
  role={as === 'div' ? 'group' : undefined}
  class={['tile-grid', cssClass].filter(Boolean).join(' ')}>{@render children?.()}</svelte:element
>
