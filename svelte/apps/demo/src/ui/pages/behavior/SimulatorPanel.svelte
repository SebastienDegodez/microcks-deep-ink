<script lang="ts">
  import '@microcks/demo-styles/pages/behavior/simulator.css';
  import type { Behavior, SimulationResult } from '@microcks/demo-core/domain/catalog';
  import { Button, Checkbox, Icon, Input, Panel } from '@microcks/deep-ink';
  import { useAnnounce, useUseCases } from '@/ui/app';
  import { API_KEY_HEADER, REQUEST_PRESETS, STATUS_ICON, STEP_ICON, resultKind, runCode, runCodeKind, runSummary, type HistoryItem } from './simulator';

  /**
   * Request simulator: a dry run of one call against the configuration on the page. The last request is
   * evaluated on load and again on every change of the configuration; Simulate also adds it to the recent runs.
   */
  interface Props {
    serviceId: string;
    operationId: string;
    method: string;
    protocol: string;
    /** Base URL of the mock, shown under the request field. */
    mockBase: string;
    /** The configuration being edited: the result follows every change. */
    draft: Behavior;
  }

  let { serviceId, operationId, method, protocol, mockBase, draft }: Props = $props();
  const uc = useUseCases();
  const announce = useAnnounce();
  let input = $state(REQUEST_PRESETS[0] as string);
  let path = $state(REQUEST_PRESETS[0] as string);
  let sendKey = $state(true);
  let store = $state.raw<Record<string, number>>({});
  let sim = $state.raw<SimulationResult | undefined>();
  let history = $state.raw<HistoryItem[]>([]);

  $effect(() => {
    // Only synchronous reads are tracked: every dependency is read before the call.
    const request = { path, params: {}, headers: sendKey ? API_KEY_HEADER : undefined, store };
    let live = true;
    void uc.catalog.simulate(serviceId, operationId, request, draft).then((r) => {
      if (live) sim = r;
    });
    return () => {
      live = false;
    };
  });

  const run = async (target: string) => {
    input = target;
    path = target;
    const r = await uc.catalog.simulate(serviceId, operationId, { path: target, params: {}, headers: sendKey ? API_KEY_HEADER : undefined, store }, draft);
    const key = r.storeKey;
    if (key) store = { ...store, [key]: (store[key] ?? 0) + 1 };
    else sim = r;
    history = [{ id: Date.now() + history.length, path: target, code: runCode(r), what: runSummary(r) }, ...history].slice(0, 4);
    announce(`Simulation: ${r.statusLabel}.`);
  };

  const kind = $derived(sim ? resultKind(sim) : 'ok');
</script>

{#snippet title()}<Icon name="play" size={16} class="sim-title-icon" />Request simulator{/snippet}

{#snippet keyLabel()}Send header <code>x-api-key: demo-7f3a</code>{/snippet}

<Panel class="sim" id="sec-sim" padding="lg" {title}
  ><p class="panel-lead">Dry run against the configuration on this page, saved or not. Nothing reaches the live mock.</p
  ><form
    class="sim-form"
    onsubmit={(e) => {
      e.preventDefault();
      void run(input);
    }}
    ><div class="sim-field"
      ><label for="sim-path" class="section-label">Request</label
      ><div class="sim-request" style={`--sim-proto: var(--proto-${protocol.toLowerCase()}, var(--proto-rest))`}
        ><span class="sim-method">{method}</span
        ><Input id="sim-path" class="sim-input" type="text" spellcheck={false} bind:value={input} aria-describedby="sim-base" /></div
      ><span id="sim-base" class="sim-base">{mockBase}<!----> + path</span></div
    ><div class="sim-presets" role="group" aria-label="Request examples"
      >{#each REQUEST_PRESETS as p (p)}<button type="button" class="sim-preset" onclick={() => void run(p)}>{p}</button>{/each}</div
    ><div class="sim-send"
      ><Checkbox class="sim-key" label={keyLabel} bind:checked={sendKey} /><Button type="submit" variant="primary" icon="play">Simulate</Button></div
    ></form
  >{#if sim}<div class="sim-result" aria-label="Simulation result" role="group"
      ><div class="sim-result-head"
        ><span class="sim-line">{sim.requestLine}</span
        ><span class="sim-status" data-kind={kind}><Icon name={STATUS_ICON[kind]} size={12} />{sim.statusLabel}</span></div
      ><div class="sim-chain">{sim.chain}</div
      ><ol class="sim-steps"
        >{#each sim.steps as s, i (i)}<li class="sim-step" data-kind={s.kind}
            ><span class="sim-step-icon"><Icon name={STEP_ICON[s.kind]} size={14} /></span
            ><span class="sim-step-text"
              ><span class="sim-step-label">{s.label}</span
              ><span class="sim-step-value">{s.value}</span></span
            ></li
          >{/each}</ol
      ><div class="sim-response"
        ><div class="sim-response-head"><span>Response</span><span class="sim-media">{sim.mediaType}</span></div
        ><pre class="sim-headers" aria-label="Response headers">{sim.headers.join('\n')}</pre
        ><!-- The scrollable response body must be reachable by keyboard (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
          class="sim-body"
          data-kind={kind}
          role="region"
          aria-label="Response body"
          tabindex="0">{sim.body}</pre
        ></div
      ></div
    >{/if}{#if history.length}<div class="sim-history"
      ><div class="section-label sim-history-head"
        ><h3 class="sim-history-title">Recent runs</h3
        ><button type="button" class="sim-clear" onclick={() => (history = [])}>Clear</button></div
      ><ul class="sim-history-list"
        >{#each history as h (h.id)}<li
            ><button type="button" class="sim-run" onclick={() => void run(h.path)}
              ><span class="sim-run-code" data-code={runCodeKind(h.code)}>{h.code}</span
              ><span class="sim-run-path">{h.path}</span
              ><span class="sim-run-what">{h.what}</span></button
            ></li
          >{/each}</ul
      ></div
    >{/if}</Panel
>
