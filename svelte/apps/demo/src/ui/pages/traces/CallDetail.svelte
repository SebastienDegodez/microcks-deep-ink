<script lang="ts">
  import { clockTime, isMiss, statusLabel, traceEvents, traceIds, type TraceCall } from '@microcks/demo-core/domain/observe';
  import { ApiBadge, Button, FactRow, Facts, Icon, SectionLabel, SplitPaneSide } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink } from '@/ui/app';
  import { arazzoAttempt, arazzoRunId, arazzoStep, arazzoWorkflow, methodTone, operationPath, requestText, shortPath } from './calls';
  import StatusText from './StatusText.svelte';

  interface Props {
    call: TraceCall;
    /** Shown in the status line under the actions once the call has been replayed; empty otherwise. */
    replayNote: string;
    onclose: () => void;
    onreplay: () => void;
  }

  /** The selected call: its facts, its Arazzo run or session, the raw request and response, the span events. */
  let { call: c, replayNote, onclose, onreplay }: Props = $props();
  const miss = $derived(isMiss(c));
  const isEvent = $derived(c.kind === 'EVENT');
  const runId = $derived(arazzoRunId(c));
  const workflowId = $derived(arazzoWorkflow(c));
  const openTo = $derived(operationPath(c));
</script>

<SplitPaneSide as="section" aria-labelledby="tr2-detail-title" class="tr2-detail"
  ><div class="tr2-detail-head"
    ><div class="tr2-detail-id"
      ><div class="tr2-detail-title"
        ><span class="tr2-method" data-size="md" data-tone={methodTone(c)}>{c.method}</span
        ><h2 id="tr2-detail-title">{shortPath(c)}</h2></div
      ><span class="tr2-detail-meta"
        >{#if c.kind === 'MCP'}<ApiBadge label="MCP" value={c.serviceName} size="sm" />{:else}<ApiBadge
            protocol={isEvent ? 'EVENT' : 'REST'}
            name={c.serviceName}
            size="sm"
          />{/if}<span class="tr2-time">{clockTime(c.at)}</span></span
      ></div
    ><button type="button" class="tr2-close" aria-label="Close call detail" onclick={onclose}
      ><Icon name="close" size={14} stroke-width={2.2} /></button
    ></div
  ><Facts layout="columns" columns={2} boxed="surface" gap="10px 16px" size="sm" class="tr2-facts"
    ><FactRow term="Client" mono>{c.clientName}<!---->{' · '}<!---->{c.clientIp}</FactRow
    ><FactRow term="Dispatcher" mono>{c.dispatcher ?? 'n/a'}</FactRow
    ><FactRow term="Dispatch criteria" mono tone="warning">{c.criteria ?? 'none'}</FactRow
    ><FactRow term="Matched example" tone={miss ? 'warning' : undefined}
      ><span class="tr2-example-name">{c.exampleName ?? 'none'}</span></FactRow
    ><FactRow term="Status · latency"><StatusText call={c} withLatency /></FactRow
    ><FactRow term="Trace id" mono tone="muted"><span class="tr2-trace-id">{traceIds(c.seq).traceId}</span></FactRow
    ></Facts
  >{#if c.baggage}<div role="note" aria-label="Arazzo run of this call" class="tr2-note"
      ><div class="tr2-note-line"
        ><span class="tr2-arazzo-tag">ARAZZO</span
        ><span
          >From workflow<!---->{' '}<RouterLink class="tr2-strong-link" to={`/workflows/pastry/${workflowId ?? 'restock-pastry'}/loom`}
            >{c.workflowName ?? workflowId}</RouterLink
          >{' · '}<RouterLink to={`/workflows/runs/${runId ?? ''}`}>run #<!---->{c.arazzoRun}</RouterLink
          >{' · step '}<span class="demo-mono">{arazzoStep(c)}</span>{' · attempt'}<!---->{' '}<!---->{arazzoAttempt(c) ?? '1'}</span
        ></div
      ><span class="tr2-note-label">W3C baggage</span><code class="tr2-note-code">{c.baggage}</code></div
    >{/if}{#if c.sessionId}<div role="note" aria-label="Arazzo session of this call" class="tr2-note" data-variant="session"
      ><span>Session <span class="demo-mono tr2-strong">{c.sessionId}</span></span
      ><span class="tr2-secondary"
        >verification of<!---->{' '}<RouterLink class="tr2-strong-link" to="/workflows/pastry/restock-pastry/loom">Restock a pastry</RouterLink
        >{' '}<!---->· the mocks answer along the workflow</span
      ><code class="tr2-note-code tr2-muted">x-microcks-session: <!---->{c.sessionId}</code></div
    >{/if}{#if miss}<div role="note" class="tr2-note" data-variant="miss"
      ><Icon name="warning" size={14} class="tr2-note-icon" /><span
        >No example of<!---->{' '}<span class="demo-mono">{c.method}<!---->{' '}<!---->{c.endpointLabel}</span
        >{' '}<!---->matches <span class="demo-mono">{c.criteria}</span>. Add an example or let the AI Copilot propose one.</span
      ></div
    >{/if}<div class="tr2-raw"
    ><div class="tr2-raw-head"
      ><span class="tr2-raw-label">{isEvent ? 'Subscription' : c.kind === 'MCP' ? 'MCP request' : 'Request'}</span
      ><span class="demo-mono tr2-secondary">{c.clientName}</span></div
    ><!-- The scrollable request must be reachable by keyboard (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
      tabindex="0"
      aria-label="Request">{requestText(c)}</pre
    ></div
  ><div class="tr2-raw" data-part="response"
    ><div class="tr2-raw-head"
      ><span class="tr2-raw-label">{isEvent ? 'Message' : 'Response'}</span
      ><span class="tr2-raw-status" data-miss={miss ? '' : undefined}>{statusLabel(c)}</span></div
    ><!-- The scrollable response must be reachable by keyboard (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
      tabindex="0"
      aria-label="Response">{c.rawResponse ?? 'No content captured.'}</pre
    ></div
  ><div class="tr2-events"
    ><SectionLabel as="h3">Span events</SectionLabel
    >{#each traceEvents(c) as e, i (i)}<div class="tr2-event"
        ><span class="tr2-event-at">{e.at}</span><span class="tr2-event-text">{e.text}</span></div
      >{/each}</div
  ><div class="tr2-actions"
    ><Button variant="primary" icon="replay" onclick={onreplay}>Replay this call</Button
    ><ButtonRouterLink icon="external" to={openTo}>{miss ? 'Open operation' : 'Open example'}</ButtonRouterLink
    ></div
  ><!-- Always in the DOM, so the live region announces the replay when its text appears. --><p role="status" class="tr2-replayed"
    >{#if replayNote}<Icon name="check" size={13} />{replayNote}{/if}</p
  ></SplitPaneSide
>
