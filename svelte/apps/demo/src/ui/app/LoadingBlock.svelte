<script lang="ts">
  import { Skeleton } from '@microcks/deep-ink';

  /**
   * Loading placeholder: `aria-busy`, and a polite status "Loading {label}" for assistive technology.
   * `lines` draws one block of lines; `rows` draws that many two-line blocks, spaced (workflow pages).
   */
  interface Props {
    label: string;
    lines?: number;
    rows?: number;
  }

  let { label, lines = 5, rows }: Props = $props();
</script>

<div aria-busy="true" class={rows === undefined ? 'demo-loading' : 'wf-loading'}
  ><p role="status" class="sr-only">Loading <!---->{label}</p
  >{#if rows === undefined}<Skeleton {lines} />{:else}{#each { length: rows }, i (i)}<Skeleton lines={2} />{/each}{/if}</div
>
