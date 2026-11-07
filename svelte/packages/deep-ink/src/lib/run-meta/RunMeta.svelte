
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type RunMetaKind = 'text' | 'mono' | 'url' | 'chip';

  export interface RunMetaItem {
    term: string | Snippet;
    value: string | number | Snippet;
    /** `mono` (durations), `url` (mono, link colour: wrap it in `<a>` when it navigates), `chip` (runner name). */
    kind?: RunMetaKind;
    /** Muted mono 12px detail after the value: the absolute date after "just now". */
    detail?: string | Snippet;
    id?: string;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> &
    NativeHandlers<HTMLDListElement> & { items: RunMetaItem[]; class?: string };

  let { items, class: cssClass, ...rest }: Props = $props();
</script>

<dl {...eventProps(rest)} class={['run-meta', cssClass].filter(Boolean).join(' ')}
  >{#each items as it, i (i)}<div class="run-meta-item"
      ><dt>{#if typeof it.term === 'function'}{@render it.term()}{:else}{it.term}{/if}</dt><dd
        data-kind={it.kind && it.kind !== 'text' ? it.kind : undefined}
        >{#if typeof it.value === 'function'}{@render it.value()}{:else}{it.value}{/if}</dd
      >{#if it.detail}<dd class="run-meta-detail"
          >{#if typeof it.detail === 'function'}{@render it.detail()}{:else}{it.detail}{/if}</dd
        >{/if}</div
    >{/each}</dl
>
