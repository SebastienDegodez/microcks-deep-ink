<script lang="ts">
  import type { Step, StepResult, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { CodeBlock, Icon } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import Verdict from './Verdict.svelte';
  import {
    attemptRows,
    copilotExamplePath,
    flowIcon,
    msText,
    noStepOutputsText,
    responseCaption,
    retryOf,
    schemaRefText,
    valueText,
    waitingText,
  } from './steps';

  interface Props {
    step: StepResult;
    def?: Step;
    run: WorkflowRun;
    running: boolean;
  }

  /** The request, the attempts, the response, the checks and the outputs of a step. */
  let { step, def, run, running }: Props = $props();
  const onMocks = $derived(run.target.kind === 'mocks');
  const retry = $derived(retryOf(def));
  const lastAttempt = $derived(step.attempts[step.attempts.length - 1]);
  const criteriaOk = $derived(step.criteria.every((c) => c.held));
  const schema = $derived(step.schema);
  const coherence = $derived(run.coherence.find((c) => c.stepId === step.stepId));
  const listName = $derived(coherence ? String(run.steps[0]?.outputs['firstName'] ?? '') : '');
  const lines = $derived(step.response?.lines ?? []);
  const pastryTitle = 'GET /pastries/{name} on API Pastry 2.0';
</script>

{#if !running && schema.state === 'fail'}<p class="wfr-step-failure"
    ><Icon name="x-circle" size={14} class="wfr-failure-icon" /><span class="wfr-mono">Step failed: <!---->{schema.message}</span></p
  >{/if}{#if def}<p class="wfr-step-desc">{def.description}</p>{/if}{#if step.request}<div class="wfr-block"
    ><h4 class="wfr-h4">Request</h4
    ><div class="wfr-request-line"
      ><span class="wfr-request-method">{step.request.method}</span><span class="wfr-request-url">{step.request.url}</span></div
    >{#if Object.keys(step.request.params).length > 0}<div class="wfr-grid-wrap"
        ><table class="wfr-grid" data-cols="params"
          ><caption class="sr-only">Parameters of <!---->{step.stepId}</caption
          ><thead><tr><th scope="col">Parameter</th><th scope="col">Value</th><th scope="col">From</th></tr></thead
          ><tbody
            >{#each Object.entries(step.request.params) as [name, value] (name)}{@const p = def?.parameters.find((x) => x.name === name)}<tr
                ><th scope="row" class="wfr-mono"><strong>{name}</strong>{' '}{#if p}<span class="wfr-faint">{p.in}</span>{/if}</th
                ><td class="wfr-mono wfr-strong">{value}</td><td class="wfr-mono wfr-secondary">{#if p?.value}{p.value}{/if}</td></tr
              >{/each}</tbody
          ></table
        ></div
      >{/if}{#if step.request.body && def?.requestBody}<dl class="wfr-body-box"
        ><div><dt>requestBody · application/json</dt><dd class="wfr-secondary">{def.requestBody}</dd></div
        ><div><dt>sent</dt><dd class="wfr-strong">{step.request.body}</dd></div></dl
      >{/if}{#if onMocks && step.baggage}<p class="wfr-baggage-line"
        ><span class="wfr-faint">Baggage</span><code class="wfr-baggage" title="Marks this call in the Live Traces of the API">{step.baggage}</code
        ><RouterLink to={`/traces?run=${run.id}`} class="wfr-link">See in Live traces</RouterLink></p
      >{/if}</div
  >{/if}{#if step.attempts.length > 1 && retry}<div class="wfr-block"
    ><h4 class="wfr-h4"
      >Attempts · onFailure retry, retryAfter <!---->{retry.retryAfter}<!----> s, retryLimit <!---->{retry.retryLimit}</h4
    ><ol class="wfr-attempts"
      >{#each attemptRows(step, retry) as a (a.n)}<li
          ><span class="wfr-attempt-no">Attempt <!---->{a.n}</span><span class="wfr-code-chip">{a.httpStatus}</span><span class="wfr-attempt-ms"
            >{msText(a.ms)}</span
          ><span class="wfr-attempt-note"
            ><Icon name={a.failed ? 'cross' : 'check'} size={12} stroke-width={2.4} class="wfr-attempt-icon" /><span
              >{a.outcome}<!----> → <!---->{a.next}</span
            ></span
          ></li
        >{/each}</ol
    ></div
  >{/if}<div class="wfr-block"
  ><div class="wfr-response-head"
    ><h4 class="wfr-h4">Response</h4
    >{#if !running && lastAttempt}<span class="wfr-code-chip" data-tone={lastAttempt.httpStatus < 300 ? 'success' : 'danger'}
        >{lastAttempt.httpStatus}</span
      ><span class="wfr-mono wfr-secondary"
        >{#if step.response?.meta}{step.response.meta}{/if}<!----> · <!---->{msText(lastAttempt.ms)}<!---->{#if step.attempts.length > 1}{` · attempt ${step.attempts.length}`}{/if}</span
      >{/if}</div
  >{#if running}<div role="status" aria-label="Waiting for response" class="wfr-waiting"
      ><span class="wfr-pulse-bar" style="width: 46%"></span><span class="wfr-pulse-bar" style="width: 72%"></span><span
        class="wfr-pulse-bar"
        style="width: 58%"
      ></span><span class="wfr-faint">{waitingText(run, step)}</span></div
    >{:else if lines.length > 0}<CodeBlock
      class="wfr-response"
      tone={schema.state === 'fail' ? 'danger' : undefined}
      gutter="narrow"
      language="json"
      {lines}
      lineNumbers
      copy={false}
      variant="plain"
      caption={responseCaption(step)}
    />{:else}<span class="wfr-faint wfr-small">Body · Empty</span>{/if}</div
>{#if !running}<div class="wfr-checks"
    ><div class="wfr-block"
      ><div class="wfr-check-head"
        ><h4 class="wfr-h4" data-size="13">Success criteria</h4
        >{#if criteriaOk}<Verdict tone="success" icon="check"
            >Held <!---->{step.criteria.length}<!---->/<!---->{step.criteria.length}</Verdict
          >{:else}<Verdict tone="danger" icon="cross">Did not hold</Verdict>{/if}</div
      >{#if step.criteria.length > 0}<div class="wfr-grid-wrap"
          ><table class="wfr-grid" data-cols="criteria"
            ><caption class="sr-only">Success criteria of <!---->{step.stepId}</caption
            ><thead><tr><th scope="col">Criterion</th><th scope="col">Evaluated</th><th scope="col">Result</th></tr></thead
            ><tbody
              >{#each step.criteria as c (c.condition)}<tr
                  ><th scope="row" class="wfr-mono">{c.condition}<!---->{' '}{#if c.kind === 'regex'}<span class="wfr-kind">regex</span>{/if}</th
                  ><td class="wfr-mono wfr-secondary">{c.evaluation}</td
                  ><td
                    ><Verdict tone={c.held ? 'success' : 'danger'} icon={c.held ? 'check' : 'cross'}>{c.held ? 'Passed' : 'Failed'}</Verdict
                    ></td
                  ></tr
                >{/each}</tbody
            ></table
          ></div
        >{/if}</div
    ><div class="wfr-block" data-gap="6"
      ><div class="wfr-check-head"
        ><h4 class="wfr-h4" data-size="13">Schema validation</h4
        >{#if schema.state === 'pass'}<Verdict tone="success" icon="check">Passed</Verdict
          >{:else if schema.state === 'fail'}<Verdict tone="danger" icon="cross">Failed</Verdict
          >{:else}<Verdict tone="muted" icon="dash">{schema.state === 'na' ? 'Not applicable' : 'Off'}</Verdict>{/if}</div
      ><span class="wfr-schema-ref">{schemaRefText(step)}</span><span
        class="wfr-schema-text"
        data-tone={schema.state === 'fail' ? 'text' : undefined}>{schema.message}</span
      ></div
    ></div
  >{/if}{#if !running && coherence}<div role="note" class="wfr-coherence"
    ><Icon name="info" size={16} class="wfr-coherence-icon" /><div class="wfr-coherence-body"
      ><p
        ><strong>The mocks do not form a coherent scenario.</strong> GetPastries returns “<!---->{listName}<!---->”, but <span class="wfr-mono"
          >{coherence.operationId}</span
        > has no example for <span class="wfr-code-inline">name</span> = <!---->{listName}<!---->. Add that example to the OpenAPI document, or let the workflow send a value that has one.</p
      ><div class="wfr-coherence-links"
        ><RouterLink to="/services/pastry2" class="wfr-link" title={pastryTitle}>Open <!---->{coherence.operationId}</RouterLink
        ><RouterLink to={copilotExamplePath(coherence.copilotHint)} class="wfr-link">Generate the example with the AI Copilot</RouterLink></div
      ></div
    ></div
  >{/if}{#if !running}<div class="wfr-block" data-gap="10"
    ><div class="wfr-outputs"
      ><span class="wfr-outputs-label">Outputs</span
      >{#each Object.entries(step.outputs) as [k, v] (k)}{@const expr = def?.outputs.find((o) => o.name === k)?.expression ?? ''}<span
          class="wfr-output-chip"
          title={expr}
          >{k}<!---->{' '}<span class="wfr-faint">=</span>{' '}<strong>{valueText(v)}</strong><span class="wfr-faint">from <!---->{expr}</span></span
        >{:else}<span class="wfr-faint wfr-small">{noStepOutputsText(step)}</span>{/each}</div
    ><div class="wfr-flow" data-kind={step.flow.kind}
      ><Icon name={flowIcon(step.flow.kind)} size={16} class="wfr-flow-icon" /><span class="wfr-flow-text"
        ><span class="wfr-flow-title">{step.flow.title}</span><span class="wfr-flow-detail">{step.flow.text}</span></span
      ></div
    ></div
  >{/if}
