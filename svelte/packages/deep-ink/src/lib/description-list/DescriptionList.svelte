
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
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> &
    NativeHandlers<HTMLDListElement> & { items: DescriptionItem[]; class?: string };

  let { items, class: cssClass, ...rest }: Props = $props();
</script>

<dl {...eventProps(rest)} class={['dl', cssClass].filter(Boolean).join(' ')}>
  {#each items as item (item.term)}
    <div
      ><dt>{item.term}</dt><dd data-mono={item.mono ? '' : undefined}
        >{#if typeof item.value === 'function'}{@render item.value()}{:else}{item.value}{/if}</dd
      ></div
    >
  {/each}
</dl>
