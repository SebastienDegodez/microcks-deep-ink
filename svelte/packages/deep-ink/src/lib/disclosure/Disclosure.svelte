<!--
  Native <details> (registry item disclosure). Same props as the React Disclosure: summary, defaultOpen, className
  plus any <details> attribute, and React's onToggle. `summary` (ReactNode in React) is a string or a snippet; the
  revealed content is the children. Open state is exposed by the browser, so no ARIA is added.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLDetailsAttributes } from 'svelte/elements';

  type Props = Omit<HTMLDetailsAttributes, 'class' | 'open' | 'children'> & {
    summary: string | Snippet;
    /** Open on first render; the user toggles it afterwards. */
    defaultOpen?: boolean;
    className?: string;
    onToggle?: (event: Event & { currentTarget: EventTarget & HTMLDetailsElement }) => void;
    children?: Snippet;
  };

  let { summary, defaultOpen, className, onToggle, ontoggle, children, ...rest }: Props = $props();
</script>

<details
  {...rest}
  ontoggle={(e) => {
    ontoggle?.(e);
    onToggle?.(e);
  }}
  class={['disclosure', className].filter(Boolean).join(' ')}
  open={defaultOpen || undefined}
  ><summary>{#if typeof summary === 'function'}{@render summary()}{:else}{summary}{/if}</summary>{@render children?.()}</details
>
