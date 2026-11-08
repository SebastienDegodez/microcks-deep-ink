<script lang="ts">
  import type { RunMetaProps } from './run-meta.js';
  import { eventProps } from '../event-props';



  let { items, class: cssClass, ...rest }: RunMetaProps = $props();
</script>

<dl {...eventProps(rest)} class={['run-meta', cssClass].filter(Boolean).join(' ')}
  >{#each items as it, i (it.id ?? (typeof it.term === 'string' ? it.term : i))}<div class="run-meta-item"
      ><dt>{#if typeof it.term === 'function'}{@render it.term()}{:else}{it.term}{/if}</dt><dd
        data-kind={it.kind && it.kind !== 'text' ? it.kind : undefined}
        >{#if typeof it.value === 'function'}{@render it.value()}{:else}{it.value}{/if}</dd
      >{#if it.detail}<dd class="run-meta-detail"
          >{#if typeof it.detail === 'function'}{@render it.detail()}{:else}{it.detail}{/if}</dd
        >{/if}</div
    >{/each}</dl
>
