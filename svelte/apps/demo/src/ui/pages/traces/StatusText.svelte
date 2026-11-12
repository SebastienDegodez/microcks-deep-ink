<script lang="ts">
  import { isMiss, statusLabel, type TraceCall } from '@microcks/demo-core/domain/observe';
  import { Icon } from '@microcks/deep-ink';

  interface Props {
    call: TraceCall;
    withLatency?: boolean;
  }

  /** The status of a call, with a check or a warning icon, and its latency in the detail. */
  let { call, withLatency }: Props = $props();
  const miss = $derived(isMiss(call));
</script>

<span class="tr2-status" data-miss={miss ? '' : undefined}
  ><Icon name={miss ? 'warning' : 'check'} size={13} stroke-width={2.6} class="tr2-status-icon" /><span class="demo-mono"
    >{statusLabel(call)}{#if withLatency}{` · ${call.ms} ms`}{/if}</span
  ></span
>
