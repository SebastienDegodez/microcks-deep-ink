<script lang="ts">
  import { clockTime, isMiss, type TraceCall } from '@microcks/demo-core/domain/observe';
  import { arazzoStep, arazzoTitle, methodTone } from './calls';
  import StatusText from './StatusText.svelte';

  interface Props {
    call: TraceCall;
    selected: boolean;
    flash: boolean;
    replay: boolean;
    onpick: () => void;
  }

  /** The row is named by its visible text, cell by cell, plus hidden words for the units and the run (RGAA 6.1). */
  let { call: c, selected, flash, replay, onpick }: Props = $props();
  const step = $derived(arazzoStep(c));
</script>

<button type="button" class="tr2-row" aria-pressed={selected} data-flash={flash ? '' : undefined} onclick={onpick}
  ><span class="tr2-time">{clockTime(c.at)}</span>{' '}<span class="tr2-client"
    ><span class="tr2-ellipsis">{c.clientName}</span>{' '}<span class="tr2-ip">{c.clientIp}</span></span
  >{' '}<span class="tr2-request"
    ><span class="tr2-method" data-tone={methodTone(c)}>{c.method}</span>{' '}<span class="tr2-path"
      ><span class="tr2-ellipsis">{c.path}</span>{#if c.mcpTool}{' '}<span class="tr2-tool">tools/call · <!---->{c.mcpTool}</span>{/if}</span
    >{#if replay}{' '}<span class="tr2-tag" data-tag="replay">replay</span>{/if}{#if step}{' '}<span class="tr2-arazzo" title={arazzoTitle(c)}
        ><span>ARAZZO</span>{' '}<span>{step}</span></span
      >{/if}{#if c.sessionId}{' '}<span class="tr2-tag" data-tag="session" title={`x-microcks-session: ${c.sessionId}`}>session</span>{/if}</span
  >{' '}<span class="tr2-crit tr2-ellipsis">{c.criteria}</span>{' '}<span class="tr2-example tr2-ellipsis" data-miss={isMiss(c) ? '' : undefined}
    >{c.exampleName}</span
  >{' '}<StatusText call={c} />{' '}<span class="tr2-ms">{c.ms}</span>{' '}<span class="sr-only"
    >ms{#if c.baggage}{`, ${arazzoTitle(c)}`}{/if}{#if c.sessionId}{`, session ${c.sessionId}`}{/if}</span
  ></button
>
