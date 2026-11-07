<!--
  Term and value pairs in a native <dl> (registry item description-list). Same props as the React DescriptionList:
  items, className plus any <dl> attribute and React handler (onClick...). An item's `value` (ReactNode in React) is a string or a snippet.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface DescriptionItem {
    term: string;
    value: string | number | Snippet;
    mono?: boolean;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> &
    ReactHandlers<HTMLDListElement> & { items: DescriptionItem[]; className?: string };

  let { items, className, ...rest }: Props = $props();
</script>

<dl {...reactEvents(rest)} class={['dl', className].filter(Boolean).join(' ')}>
  {#each items as item (item.term)}
    <div
      ><dt>{item.term}</dt><dd data-mono={item.mono ? '' : undefined}
        >{#if typeof item.value === 'function'}{@render item.value()}{:else}{item.value}{/if}</dd
      ></div
    >
  {/each}
</dl>
