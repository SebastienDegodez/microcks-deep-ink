<script lang="ts" module>
  import { criteriaText, stoppedStep, type Action, type ArazzoDocument, type Step, type StepResult, type Workflow, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';

  const pretty = (json: string) => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  /** "PatchPastry · 200 · application/json · Pastry" → "Pastry". */
  const schemaName = (ref: string) => {
    const parts = ref.split(' · ');
    return parts.length > 3 ? parts[parts.length - 1] : undefined;
  };

  /** Title, detail and note of the failure box of a step. */
  function failureBox(step: Step, result: StepResult, run: WorkflowRun): { title: string; detail: string; note: string } | undefined {
    if (result.status !== 'failed') return undefined;
    const last = result.attempts[result.attempts.length - 1];
    if (result.schema.state === 'fail') {
      const bad = result.response?.lines.find((l) => l.bad);
      const field = bad ? /"([^"]+)":\s*(.+?),?$/.exec(bad.text.trim()) : null;
      const expected = bad?.note?.replace(/^schema:\s*/, '');
      const name = schemaName(result.schema.ref);
      return {
        title: `Response ${last?.httpStatus ?? ''} of ${step.operationId} does not conform to its schema`,
        detail:
          field && expected && name
            ? `/${field[1]} does not match the ${name} schema: ${field[2]?.startsWith('"') ? `string ${field[2]}` : field[2]} found, ${expected} expected`
            : result.schema.message,
        note: 'A response that does not conform to its schema fails the step, even when its criteria hold.',
      };
    }
    if (run.origin.kind === 'session') {
      return {
        title: result.flow.title,
        detail: result.flow.text,
        note: 'A verification checks that each call carries the values the workflow passes from earlier steps and from its inputs.',
      };
    }
    const unheld = result.criteria.find((c) => !c.held);
    return unheld
      ? { title: 'A success criterion did not hold', detail: `${unheld.condition}: ${unheld.evaluation}`, note: 'A step passes only when all its success criteria hold.' }
      : { title: result.flow.title, detail: result.flow.text, note: '' };
  }

  /** Why a step was not run, from the step where the run stopped. */
  function notRunText(run: WorkflowRun): string {
    const stopped = stoppedStep(run);
    if (!stopped) return 'Not run: the run ended before this step.';
    if (stopped.status === 'passed') return `Not run: the end action of ${stopped.stepId} ended the run.`;
    const retries = stopped.attempts.length - 1;
    return retries > 0
      ? `Not run: ${stopped.stepId} still failed after its ${retries} ${retries === 1 ? 'retry' : 'retries'}, so the run ended there.`
      : `Not run: ${stopped.stepId} failed, so the run ended there.`;
  }

  interface ActionRow {
    when: 'On success' | 'On failure';
    type: string;
    text: string;
    crit?: string;
    note?: string;
    noteTone?: 'danger' | 'secondary';
  }

  function describe(a: Action): string {
    return a.type === 'retry' ? `retry every ${a.retryAfter} s, up to ${a.retryLimit} ${a.retryLimit === 1 ? 'time' : 'times'}` : 'end the workflow';
  }

  function actionRows(workflow: Workflow, step: Step, result: StepResult | undefined, run: WorkflowRun | undefined): ActionRow[] {
    const ran = result !== undefined && result.status !== 'not-run' && run !== undefined;
    const label = run ? `#${run.number}` : '';
    const index = workflow.steps.indexOf(step);
    const next = workflow.steps[index + 1];
    const rows: ActionRow[] = [];
    if (step.onSuccess.length === 0) {
      rows.push({ when: 'On success', type: 'default', text: next ? 'go on to the next step' : 'the workflow ends and returns its outputs' });
    }
    for (const a of step.onSuccess) {
      let note: string | undefined;
      if (ran && a.type === 'end') {
        if (result.flow.kind === 'end') note = `Applied in ${label}: the run ended here, with success.`;
        else {
          const field = /\$response\.body#\/([A-Za-z0-9_-]+)/.exec(criteriaText(a.criteria))?.[1];
          const v = field ? result.outputs[field] : undefined;
          note = `Not applied in ${label}: ${field && v !== undefined ? `${field} was '${String(v)}', so ` : ''}the run went on to ${next?.stepId ?? 'its end'}.`;
        }
      }
      rows.push({ when: 'On success', type: a.type, text: describe(a), crit: criteriaText(a.criteria) || undefined, note, noteTone: 'secondary' });
    }
    if (step.onFailure.length === 0) {
      rows.push({ when: 'On failure', type: 'default', text: 'end the run; the later steps are not run' });
    }
    for (const a of step.onFailure) {
      let note: string | undefined;
      let noteTone: ActionRow['noteTone'] = 'secondary';
      if (ran && a.type === 'retry') {
        if (run.origin.kind === 'session') note = 'A verification checks the calls received; it does not retry.';
        else if (result.attempts.length > 1) {
          const later = result.attempts.slice(1).map((x) => x.n);
          note = `Applied in ${label}: ${later.length === 1 ? `attempt ${later[0]}` : `attempts ${later.slice(0, -1).join(', ')} and ${later[later.length - 1]}`} ${result.status === 'failed' ? 'failed the same way, then the run ended' : 'passed'}.`;
          noteTone = result.status === 'failed' ? 'danger' : 'secondary';
        } else note = `Not needed in ${label}: the step passed at its first attempt.`;
      }
      rows.push({ when: 'On failure', type: a.type, text: describe(a), crit: criteriaText(a.criteria) || undefined, note, noteTone });
    }
    return rows;
  }
</script>

<script lang="ts">
  import { formatDuration } from '@microcks/demo-core/domain/shared';
  import { Button, Icon, MethodTag, SplitPaneSide } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { STATUS_ICON } from '@/ui/app/outcomes';
  import { bodyPointer, expressionsOf, formatValue, stepResultLine, threadsOf, valueIn, wrongValue } from './loom-model';
  import { httpLine, originWord, runNoun, stepChecksOf, stepStatusOf, type Tone } from './run-facts';

  interface Props {
    workflow: Workflow;
    document: ArazzoDocument;
    run?: WorkflowRun;
    step?: Step;
    failedStepId?: string;
    /** Service names by id ("pastry2" → "API Pastry 2.0"). */
    serviceLabel?: (serviceId: string) => string | undefined;
    /** Thread currently traced by the lens. */
    lens?: string;
    ontrace: (expression: string) => void;
    onselectfailed: () => void;
    onclose: () => void;
  }

  /** Side panel of the Loom: operation, result in the selected run, parameters, body, criteria, actions, outputs. */
  let { workflow, document, run, step, failedStepId, serviceLabel, lens, ontrace, onselectfailed, onclose }: Props = $props();

  const index = $derived(step ? workflow.steps.indexOf(step) + 1 : 0);
  const result = $derived(step ? run?.steps.find((r) => r.stepId === step.stepId) : undefined);
  const source = $derived(step ? document.sources.find((s) => s.name === step.sourceName) : undefined);
  const linked = $derived(source?.link.status === 'linked' ? source.link : undefined);
  const service = $derived(linked ? serviceLabel?.(linked.serviceId) : undefined);
  const validate = $derived(run?.options.validateSchemas === true);
  const notRun = $derived(result?.status === 'not-run');
  const session = $derived(run?.origin.kind === 'session');
  const wrong = $derived(wrongValue(result));
  const box = $derived(step && result && run ? failureBox(step, result, run) : undefined);
  const threads = $derived(threadsOf(workflow, run));
  const attempts = $derived(result?.attempts ?? []);
  const status = $derived(stepStatusOf(result));
  const checks = $derived(run ? stepChecksOf(result, run) : []);

  const paramValue = (expr: string, name: string): { lead: string; text: string; tone?: 'bad' | 'idle' } => {
    if (!run || !result) return { lead: '', text: 'no run selected', tone: 'idle' };
    if (notRun) return { lead: '', text: 'not resolved: step not run', tone: 'idle' };
    const v = valueIn(expr, run);
    const shown = v === undefined ? (expr.startsWith('$') ? 'not resolved' : expr) : formatValue(v);
    if (wrong && wrong.param === name && wrong.expression === expr) return { lead: 'received', text: `"${wrong.got}" · expected ${shown}`, tone: 'bad' };
    return { lead: session ? 'received' : 'resolved', text: shown };
  };

  const bodyExprs = $derived(step?.requestBody ? expressionsOf({ ...step, parameters: [] }) : []);
  const sent = $derived.by(() => {
    if (!step) return undefined;
    const r = run;
    if (result?.request?.body) return pretty(result.request.body);
    return step.requestBody && r && !notRun ? pretty(step.requestBody.replace(/"\{(\$[^}]+)\}"/g, (_, e: string) => JSON.stringify(valueIn(e, r) ?? null))) : undefined;
  });
  // `verdict`: a circled status icon and a word, coloured by tone (the word carries the state).
  const producedWhy = $derived(result?.status === 'failed' ? `not produced: ${step?.stepId} failed${session ? ' the verification' : ''}` : notRun ? 'not run' : '');
</script>

{#snippet verdict(tone: Tone, text: string, size: number)}<span class="wf-ins-verdict" data-tone={tone}
    ><Icon name={STATUS_ICON[tone]} {size} stroke-width={2.2} />{text}</span
  >{/snippet}

{#if !step}<SplitPaneSide as="aside" aria-label="Step inspector" class="wf-inspector-empty"
    ><span class="wf-inspector-empty-title">No step selected</span><span
      >Select a step on the loom to inspect its operation, parameters, criteria, actions and outputs<!---->{run ? `, with the values resolved in run #${run.number}` : ''}<!---->.</span
    >{#if failedStepId && run}<Button size="sm" class="wf-inspector-select" onclick={onselectfailed}
        >Inspect the failed step of #<!---->{run.number}</Button
      >{/if}</SplitPaneSide
  >{:else}<SplitPaneSide as="aside" aria-label="Step inspector" class="wf-step-inspector"
    ><div class="wf-ins-head"
      ><div class="wf-ins-title"
        ><span class="wf-ins-n" aria-hidden="true">{index}</span><h2 id="wf-ins-title" tabindex="-1"
          ><span class="sr-only">Step <!---->{index}<!---->{', '}</span>{step.stepId}</h2
        ><Button size="sm" iconOnly icon="close" aria-label="Close step inspector" class="wf-ins-close" onclick={onclose} /></div
      ><p class="wf-ins-desc">{step.description}</p
      >{#if linked}<RouterLink to={`/services/${linked.serviceId}`} class="wf-ins-op"
          ><MethodTag size="sm" method={step.method} protocol={linked.protocol} /><span class="wf-ins-path">{step.path}</span
          >{#if service}<span class="wf-ins-service">{service}</span>{/if}</RouterLink
        >{:else}<span class="wf-ins-op"
          ><MethodTag size="sm" method={step.method} protocol={source?.type === 'asyncapi' ? 'EVENT' : 'REST'} /><span class="wf-ins-path">{step.path}</span></span
        >{/if}<span class="wf-ins-opref">operationId: $sourceDescriptions.<!---->{step.sourceName}<!---->.<!---->{step.operationId}</span></div
    ><section class="wf-ins-section" aria-labelledby="wf-ins-result"
      ><h3 id="wf-ins-result"
        >Result{#if run}<span class="wf-ins-meta">{' · '}<!---->{runNoun(run)}<!---->{' · '}<!---->{originWord(run)}</span>{/if}</h3
      >{#if !run}<p class="wf-ins-text">No run selected: the loom shows the definition only.</p>{:else}<span class="wf-ins-status"
          >{@render verdict(status.tone, status.word, 16)}{#if result && !notRun}<span class="wf-ins-res">{stepResultLine(result)}</span>{/if}</span
        >{#if checks.length}<div class="wf-ins-checks"
            >{#each checks as c (c.label)}<span class="wf-ins-check"
                ><Icon name={STATUS_ICON[c.tone]} size={15} stroke-width={2.2} data-tone={c.tone} class="wf-ins-icon" /><span>{c.label}</span><strong
                  data-tone={c.tone}>{c.word}</strong
                ></span
              >{/each}</div
          >{/if}{#if box}<div class="wf-ins-alert"
            ><span class="wf-ins-alert-title">{box.title}</span><span class="wf-ins-alert-detail">{box.detail}</span
            >{#if box.note}<span class="wf-ins-alert-note">{box.note}</span>{/if}</div
          >{/if}{#if attempts.length > 1}<ol aria-label="Attempts" class="wf-ins-attempts"
            >{#each attempts as a (a.n)}<li
                ><span class="wf-ins-attempt-n">attempt <!---->{a.n}<!----> of <!---->{attempts.length}</span><span class="wf-ins-attempt-when">{a.when}</span
                ><span class="wf-ins-attempt-http">{a.httpStatus}<!---->{' · '}<!---->{formatDuration(a.ms)}</span
                >{#if result?.status === 'failed' && result.schema.state === 'fail'}<span class="wf-ins-attempt-verdict"
                    >{@render verdict('fail', 'criteria held · schema failed', 12)}</span
                  >{/if}</li
              >{/each}</ol
          >{/if}{#if notRun}<p class="wf-ins-text">{notRunText(run)}</p>{/if}{#if result}<span class="wf-ins-http"
            >{httpLine(step, result, run, wrong ? { [wrong.param]: wrong.got } : undefined)}</span
          >{/if}{/if}</section
    ><section class="wf-ins-section" aria-labelledby="wf-ins-params"
      ><h3 id="wf-ins-params" class="wf-ins-code-h">parameters <span class="wf-ins-count">{step.parameters.length}</span></h3
      >{#each step.parameters as p (p.name)}{@const v = paramValue(p.value, p.name)}<div class="wf-ins-param"
          ><span class="wf-ins-param-name"><span class="wf-ins-name">{p.name}</span><span class="wf-ins-tag">in: <!---->{p.in}</span></span
          >{#if p.value.startsWith('$')}<button
              type="button"
              class="wf-ins-expr"
              aria-pressed={lens === p.value}
              onclick={() => ontrace(p.value)}
              aria-label={`Trace ${p.value}`}>{p.value}</button
            >{/if}<span class="wf-ins-value" data-tone={v.tone}
            >{#if v.lead}<span class="wf-ins-lead">{v.lead}<!---->{' '}</span>{/if}{v.text}</span
          ></div
        >{/each}</section
    >{#if step.requestBody}<section class="wf-ins-section" aria-labelledby="wf-ins-body"
        ><h3 id="wf-ins-body" class="wf-ins-code-h">requestBody <span class="wf-ins-count">application/json</span></h3
        ><div class="wf-ins-bodies"
          ><div><span class="wf-ins-lead">payload</span><pre class="wf-ins-pre" data-tone="template">{pretty(step.requestBody)}</pre></div
          >{#if sent && run}<div
              ><span class="wf-ins-lead"
                >{session ? `sent by ${run.origin.kind === 'session' ? run.origin.app : ''} in ${attempts[0]?.when ?? 'its call'}` : `sent in run #${run.number}`}</span
              ><pre class="wf-ins-pre">{sent}</pre></div
            >{/if}</div
        >{#each bodyExprs as e (e)}<span class="wf-ins-replace"
            ><span class="wf-ins-lead">replacement</span><span class="wf-ins-mono">{bodyPointer(step, e) ?? 'requestBody'}</span><span class="wf-ins-lead"
              >replaced by</span
            ><button type="button" class="wf-ins-expr" aria-pressed={lens === e} onclick={() => ontrace(e)} aria-label={`Trace ${e}`}>{e}</button></span
          >{/each}</section
      >{/if}<section class="wf-ins-section" aria-labelledby="wf-ins-criteria"
      ><h3 id="wf-ins-criteria" class="wf-ins-code-h">successCriteria <span class="wf-ins-count">{step.successCriteria.length}</span></h3
      >{#each step.successCriteria as c (c.condition)}{@const ev = result?.criteria.find((x) => x.condition === c.condition)}{@const tone = !ev
          ? 'off'
          : ev.held
            ? 'pass'
            : 'fail'}<div class="wf-ins-criterion"
          ><span class="wf-ins-type">{c.type}</span><span class="wf-ins-cond">{c.condition}</span
          >{#if run}{@render verdict(tone, !ev ? 'not evaluated' : ev.held ? 'held' : 'did not hold', 13)}{/if}{#if c.type === 'regex'}<span
              class="wf-ins-context">context: <!---->{c.context}</span
            >{/if}</div
        >{/each}{#if validate && result?.status === 'failed' && result.schema.state === 'fail' && result.criteria.every((c) => c.held)}<span class="wf-ins-note"
          >Every criterion held. The step failed on schema validation, which run #<!---->{run?.number}<!----> turned on.</span
        >{/if}</section
    ><section class="wf-ins-section" aria-labelledby="wf-ins-actions"
      ><h3 id="wf-ins-actions" class="wf-ins-code-h">onSuccess · onFailure</h3
      >{#each actionRows(workflow, step, result, run) as a, i (i)}<div class="wf-ins-action"
          ><span class="wf-ins-action-line"><span class="wf-ins-lead">{a.when}</span><span class="wf-ins-kind">{a.type}</span><span>{a.text}</span></span
          >{#if a.crit}<span class="wf-ins-context">when <!---->{a.crit}</span>{/if}{#if a.note}<span class="wf-ins-action-note" data-tone={a.noteTone}
              >{a.note}</span
            >{/if}</div
        >{/each}</section
    ><section class="wf-ins-section" aria-labelledby="wf-ins-outputs"
      ><h3 id="wf-ins-outputs" class="wf-ins-code-h">outputs</h3
      >{#if step.outputs.length === 0}<span class="wf-ins-note">No output declared.</span>{/if}{#each step.outputs as o (o.name)}{@const expr = `$steps.${step.stepId}.outputs.${o.name}`}{@const value =
          result?.outputs[o.name]}{@const missing = run !== undefined && value === undefined}<div class="wf-ins-output"
          ><span class="wf-ins-name">{o.name}</span><span class="wf-ins-oexpr">{o.expression}</span><span class="wf-ins-output-row"
            ><span class="wf-ins-value" data-tone={missing ? 'bad' : undefined}
              ><span class="wf-ins-lead">{'resolved '}</span>{!run ? 'no run selected' : missing ? `— ${producedWhy || 'not resolved'}` : formatValue(value)}</span
            >{#if threads.some((t) => t.expression === expr)}<button type="button" class="wf-ins-trace" aria-pressed={lens === expr} onclick={() => ontrace(expr)}
                ><Icon name="search" size={12} />{lens === expr ? 'Tracing' : 'Trace on the loom'}</button
              >{:else}<span class="wf-ins-note">Not consumed by another step or output.</span>{/if}</span
          ></div
        >{/each}</section
    ></SplitPaneSide
  >{/if}
