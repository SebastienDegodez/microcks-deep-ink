<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ApiBadge } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';

  interface Props {
    workflowId: string;
    documentLabel?: string;
    to: string;
    chip?: Snippet;
  }

  /** ARAZZO link badge of the workflow ("restock-pastry Pastry workflows 1.2.0") and the result or status chip. */
  let { workflowId, documentLabel, to, chip }: Props = $props();
</script>

<span class="wfr-badges"
  ><RouterLink {to} class="wfr-badge-link"><ApiBadge arazzo name={workflowId} version={documentLabel} /></RouterLink
  >{@render chip?.()}</span
>
