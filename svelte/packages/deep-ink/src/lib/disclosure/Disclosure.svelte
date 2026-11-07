<!--
  Native <details> (registry item disclosure). Same props as the React Disclosure: summary, defaultOpen, className
  plus any <details> attribute, and any React handler (onToggle, onClick...). `summary` (ReactNode in React) is a string or a snippet; the
  revealed content is the children. Open state is exposed by the browser, so no ARIA is added.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLDetailsAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLDetailsAttributes, 'class' | 'open' | 'children'> &
    ReactHandlers<HTMLDetailsElement> & {
    summary: string | Snippet;
    /** Open on first render; the user toggles it afterwards. */
    defaultOpen?: boolean;
    className?: string;
    children?: Snippet;
  };

  let { summary, defaultOpen, className, children, ...rest }: Props = $props();
</script>

<details
  {...reactEvents(rest)}
  class={['disclosure', className].filter(Boolean).join(' ')}
  open={defaultOpen || undefined}
  ><summary>{#if typeof summary === 'function'}{@render summary()}{:else}{summary}{/if}</summary>{@render children?.()}</details
>
