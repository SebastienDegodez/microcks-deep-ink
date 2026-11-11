<script lang="ts">
  import type { DiffRow } from '@microcks/demo-core/domain/testing';
  import { SectionLabel } from '@microcks/deep-ink';

  interface Props {
    title: string;
    source: string;
    rows: DiffRow[];
    label: string;
    bad?: boolean;
  }

  /** One side of a step's diff: the contract schema or the actual response, line by line, mismatches marked. */
  let { title, source, rows, label, bad }: Props = $props();
</script>

<div class="tr-code-card" data-bad={bad ? '' : undefined}
  ><div class="tr-code-head"><SectionLabel lineHeight="normal">{title}</SectionLabel><span class="tr-code-source">{source}</span></div
  ><!-- The scrollable code must be reachable by keyboard (WCAG 2.1.1): a named, focusable region. --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
    class="tr-code"
    tabindex="0"
    aria-label={label}><code
      >{#each rows as r (r.n)}<span class="tr-line" data-bad={r.bad ? '' : undefined}
          ><span class="tr-line-n" aria-hidden="true">{r.n}</span><span class="tr-line-mark"
            >{#if r.bad}<span aria-hidden="true">✕</span><span class="sr-only">Mismatch:{' '}</span>{/if}</span
          ><span class="tr-line-text">{r.text}</span></span
        >{/each}</code
    ></pre
  ></div
>
