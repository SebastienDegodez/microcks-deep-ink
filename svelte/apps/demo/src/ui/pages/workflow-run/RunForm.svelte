<script lang="ts">
  import { untrack } from 'svelte';
  import { timeoutOrDefault, validateRunRequest, type FieldError, type Step } from '@microcks/demo-core/domain/arazzo';
  import type { RunSetup, StartRunInput } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, Callout, Checkbox, Chip, Facts, Field, Input, Radio, RunMeta, Select, Stepper } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, useNavigate, useUseCases } from '@/ui/app';
  import { ErrorBlock } from '@/ui/app/states';
  import { runPath, runSetupPath, workflowPath } from '@/ui/pages/workflows/paths';
  import RunApiPanel from './RunApiPanel.svelte';
  import RunBadges from './RunBadges.svelte';
  import SourceBlock from './SourceBlock.svelte';
  import { runBreadcrumb } from './api';
  import {
    RUN_TARGETS,
    SIZE_OPTIONS,
    exampleInputs,
    examplesFile,
    expectedFacts,
    inputHelp,
    inputTypeLabel,
    launchHint as launchHintOf,
    planActions,
    problemsTitle,
    runTargetLabel,
    setupApiBody,
    workflowSources,
    type RunTargetKind,
  } from './setup';

  let { setup, exampleParam }: { setup: RunSetup; exampleParam?: string } = $props();
  const uc = useUseCases();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const workflow = $derived(setup.workflow);
  const document = $derived(setup.document);
  const sources = $derived(workflowSources(workflow));

  // The form starts from the defaults of the setup it was keyed on.
  const initial = untrack(() => {
    const { defaults } = setup;
    const example = exampleParam && setup.examples.some((e) => e.id === exampleParam) ? exampleParam : defaults.example;
    const ex = setup.examples.find((e) => e.id === example);
    return { defaults, example, inputs: ex ? exampleInputs(ex) : defaults.inputs };
  });
  let target = $state<RunTargetKind>(initial.defaults.target);
  let baseUrls = $state.raw<Record<string, string>>(initial.defaults.baseUrls);
  let perSource = $state.raw<Record<string, 'mock' | 'implementation'>>(initial.defaults.perSource);
  let secret = $state(initial.defaults.secret);
  let example = $state(initial.example);
  let inputs = $state.raw<Record<string, string>>(initial.inputs);
  let validate = $state(initial.defaults.validateSchemas);
  let timeoutMs = $state(initial.defaults.timeoutMs);
  let submitted = $state(false);
  let busy = $state(false);
  let failure = $state<Error | null>(null);
  let summary = $state<HTMLDivElement>();

  const chosen = $derived(setup.examples.find((e) => e.id === example));
  const detached = $derived(example === '');
  const usesImplementation = $derived(target === 'implementations' || (target === 'mixed' && Object.values(perSource).includes('implementation')));
  const effectivePer = (name: string) => perSource[name] ?? 'mock';

  const errors: FieldError[] = $derived(
    validateRunRequest({
      workflowId: workflow.workflowId,
      notRunnableMessage: workflow.runnability.runnable ? undefined : workflow.runnability.message,
      target,
      sources,
      baseUrls,
      perSource,
      inputs: workflow.inputs.map((i) => ({ name: i.name, type: i.type, value: inputs[i.name] ?? '' })),
      timeoutMs,
    }),
  );
  const errorOf = (field: string) => (submitted ? errors.find((e) => e.field === field)?.message : undefined);

  // Focus the summary only when the user submits.
  $effect(() => {
    if (!submitted) return;
    untrack(() => {
      if (errors.length > 0) summary?.focus();
    });
  });

  const pickExample = (id: string) => {
    example = id;
    const ex = setup.examples.find((e) => e.id === id);
    if (ex) inputs = exampleInputs(ex);
  };
  const setInput = (name: string, value: string) => {
    inputs = { ...inputs, [name]: value };
    if (example) example = '';
  };

  const request: StartRunInput = $derived({
    documentId: document.id,
    workflowId: workflow.workflowId,
    target,
    baseUrls: usesImplementation ? baseUrls : {},
    perSource: target === 'mixed' ? perSource : undefined,
    secret: usesImplementation && secret ? secret : undefined,
    example: example || undefined,
    inputs,
    validateSchemas: validate,
    timeoutMs: timeoutOrDefault(timeoutMs),
  });
  const launch = async () => {
    submitted = true;
    failure = null;
    if (errors.length > 0) return;
    busy = true;
    const input = request;
    try {
      const { runId } = await uc.arazzo.startRun(input);
      announce('Run started.');
      navigate(runPath(runId, true));
    } catch (e) {
      failure = e instanceof Error ? e : new Error(String(e));
      busy = false;
    }
  };

  const targetLabel = $derived(runTargetLabel(target));
  const workflowOptions = $derived(setup.workflows);
  const documentLabel = $derived(`${document.title} ${document.version}`);
  const workflowTo = $derived(workflowPath(document.id, workflow.workflowId));
  const unused = $derived(document.sources.map((s) => s.name).filter((n) => !sources.includes(n)));
  const serviceIdOf = (name: string) => {
    const l = document.sources.find((s) => s.name === name)?.link;
    return l?.status === 'linked' ? l.serviceId : undefined;
  };
  const launchHint = $derived(launchHintOf(workflow.workflowId, example, target));
  const metaItems = $derived([
    { term: 'Document', kind: 'url' as const, value: documentLink },
    { term: 'Run against', value: targetLabel },
    { term: 'Started', value: 'not yet' },
    { term: 'Elapsed', value: '—' },
    { term: 'Launched by', value: 'MA' },
  ]);
  const planSteps = $derived(workflow.steps.map((step) => ({ id: step.stepId, label: step.stepId, step })));
</script>

{#snippet chip()}<ApiBadge label="status" value="not started" icon="circle" />{/snippet}
{#snippet badge()}<RunBadges workflowId={workflow.workflowId} {documentLabel} to={workflowTo} {chip} />{/snippet}
{#snippet documentLink()}<RouterLink to={workflowPath(document.id, workflow.workflowId, 'source')} class="wfr-meta-file">{document.file}</RouterLink>{/snippet}
{#snippet workflowLabel()}<span class="wfr-legend">Workflow</span>{/snippet}
{#snippet exampleHelp()}Recorded in <span class="wfr-mono">{examplesFile(document.file)}</span>. Picking one fills the inputs; the run is then judged on it.{/snippet}
{#snippet planLabel({ step: s }: { step: Step }, i: number)}<span class="wfr-plan-id"><span class="sr-only">Step <!---->{i + 1}<!---->:{' '}</span>{s.stepId}</span
  ><span class="wfr-plan-op">{s.operationId}<!----> · <!---->{s.method}<!---->{' '}<!---->{s.path}</span
  >{#each planActions(s) as a (a)}<span class="wfr-plan-action">{a}</span>{/each}{/snippet}

<PageHeader
  title="Run workflow"
  breadcrumb={runBreadcrumb(`${document.title} - ${document.version}`, workflowTo, workflowPath(document.id, workflow.workflowId, 'runs'), 'Run workflow')}
  {badge}
  align="start"
  ><RunMeta class="wfr-run-meta" items={metaItems} /></PageHeader
><div class="wfr-layout"
  ><div class="wfr-main"
    ><form
      class="wfr-card wfr-setup"
      novalidate
      aria-labelledby="wfr-setup-h"
      onsubmit={(e) => {
        e.preventDefault();
        void launch();
      }}
      ><div class="wfr-setup-head"
        ><h2 id="wfr-setup-h" class="wfr-setup-title">Run workflow</h2
        ><span class="wfr-muted">Choose what the steps call, fill the inputs or play an example, then run.</span></div
      ><div class="wfr-setup-group"
        ><Field label={workflowLabel} error={errorOf('workflowId')} class="wfr-field wfr-w-420"
          >{#snippet children(c)}<Select
              {...c}
              class="wfr-mono-control"
              value={workflow.workflowId}
              onchange={(e) => {
                const w = workflowOptions.find((x) => x.workflowId === e.currentTarget.value);
                if (w) navigate(runSetupPath(w.documentId, w.workflowId));
              }}
              >{#each workflowOptions as w (`${w.documentId}/${w.workflowId}`)}<option value={w.workflowId}
                  >{w.workflowId}<!----> · <!---->{w.steps.length}<!----> steps<!---->{#if !w.runnability.runnable}{' · not runnable'}{/if}</option
                >{/each}</Select
            >{/snippet}</Field
        >{#if !workflow.runnability.runnable}<Callout tone="warning" title="This workflow cannot run yet" live="polite"
            >{workflow.runnability.message}<!---->.</Callout
          >{/if}</div
      ><fieldset class="wfr-setup-group"
        ><legend class="wfr-legend">Run against</legend><div class="wfr-target-grid"
          >{#each RUN_TARGETS as t (t.value)}{#snippet label()}{t.label}{#if t.proposed}<Chip size="sm" variant="dashed" tone="warning" class="wfr-proposed"
                  >Proposed · beyond POC</Chip
                >{/if}{/snippet}<Radio
              variant="card"
              name="run-target"
              value={t.value}
              checked={target === t.value}
              onchange={() => (target = t.value)}
              {label}
              description={t.description}
            />{/each}</div
        >{#if target === 'mixed'}<p class="wfr-muted"
            >Proposal beyond the POC: the POC sends every source to its mocks or every source to its implementation. Mixed lets a workflow spanning several APIs hit one real service while Microcks mocks the others, e.g.{' '}<span
              class="wfr-mono">compare-prices</span
            >{' '}with apiPastry on staging and apiPastryV1 on its mocks.</p
          >{/if}{#if target !== 'mocks'}<div class="wfr-source-box"
            >{#each sources as name (name)}<SourceBlock
                {name}
                serviceId={serviceIdOf(name)}
                mixed={target === 'mixed'}
                where={effectivePer(name)}
                onwhere={(v) => (perSource = { ...perSource, [name]: v })}
                url={baseUrls[name] ?? ''}
                onurl={(v) => (baseUrls = { ...baseUrls, [name]: v })}
                showUrl={target === 'implementations' || effectivePer(name) === 'implementation'}
                error={errorOf(`baseUrl.${name}`)}
              />{/each}{#if unused.length > 0}<span class="wfr-note"
                >{workflow.workflowId}<!----> calls no other source: <!---->{unused.join(' and ')}<!---->{' '}<!---->{unused.length > 1 ? 'are' : 'is'}<!----> not used.</span
              >{/if}{#if usesImplementation}<div class="wfr-source-secret"
                ><Field label="Secret" help="Every call carries the authorization this secret defines, as in contract tests." class="wfr-field wfr-w-320"
                  >{#snippet children(c)}<Select {...c} class="wfr-mono-control" value={secret} onchange={(e) => (secret = e.currentTarget.value)}
                      ><option value="">No secret</option>{#each setup.secrets as s (s.id)}<option value={s.name}>{s.name}</option>{/each}</Select
                    >{/snippet}</Field
                ></div
              >{/if}</div
          >{/if}</fieldset
      ><fieldset class="wfr-setup-group"
        ><legend class="wfr-legend"
          >Inputs<!---->{' '}<span class="wfr-legend-note">From the workflow <span class="wfr-mono">inputs</span>{' schema'}</span></legend
        ><Field label="Example" class="wfr-field wfr-w-420" help={exampleHelp}
          >{#snippet children(c)}<Select {...c} value={example} onchange={(e) => pickExample(e.currentTarget.value)}
              ><option value="">None, I enter the inputs</option>{#each setup.examples as e (e.id)}<option value={e.id}>{e.id}</option>{/each}</Select
            >{/snippet}</Field
        >{#if workflow.inputs.length > 0}<div class="wfr-inputs"
            >{#each workflow.inputs as input (input.name)}{@const help = inputHelp(workflow, input.name)}{#snippet label()}<span class="wfr-mono wfr-strong"
                  >{input.name}</span
                >{' '}<span class="wfr-label-type">{inputTypeLabel(input)}</span>{/snippet}{#snippet parameterHelp()}{#if help?.kind === 'parameter'}{help.where}<!---->{' '}<span
                    class="wfr-mono">{help.name}</span
                  >{' of '}<!---->{help.stepId}{/if}{/snippet}<Field
                class="wfr-field wfr-input-field"
                {label}
                error={errorOf(`input.${input.name}`)}
                help={help?.kind === 'parameter' ? parameterHelp : help?.text}
                >{#snippet children(c)}{#if input.name === 'size'}<Select
                      {...c}
                      class="wfr-mono-control"
                      value={inputs[input.name] ?? 'M'}
                      onchange={(e) => setInput(input.name, e.currentTarget.value)}
                      >{#each SIZE_OPTIONS as s (s)}<option>{s}</option>{/each}</Select
                    >{:else}<Input
                      {...c}
                      class="wfr-mono-control"
                      inputmode={input.type === 'number' ? 'decimal' : undefined}
                      spellcheck="false"
                      autocomplete="off"
                      value={inputs[input.name] ?? ''}
                      oninput={(e) => setInput(input.name, e.currentTarget.value)}
                    />{/if}{/snippet}</Field
              >{/each}</div
          >{:else}<p class="wfr-muted">This workflow has no input.</p>{/if}{#if chosen}<div class="wfr-expected"
            ><h3 class="wfr-card-subtitle">Expected by <span class="wfr-mono">{chosen.id}</span></h3
            ><Facts layout="inline" termWidth="70px" gap="6px 14px" class="wfr-expected-facts" items={expectedFacts(chosen)} /></div
          >{:else if detached && Object.keys(inputs).length > 0}<p class="wfr-note" role="status">
            This run plays no example, so its expected outputs will not be checked.
          </p>{/if}</fieldset
      ><fieldset class="wfr-setup-group"
        ><legend class="wfr-legend">Options</legend><div class="wfr-option"
          ><Checkbox
            variant="card"
            label="Validate each response against its OpenAPI schema"
            description="Uses the validators of OpenAPI contract tests: a step fails on a non-conformant response, even when its criteria hold. Off by default."
            checked={validate}
            onchange={(e) => (validate = e.currentTarget.checked)}
          /></div
        ><Field label="Timeout per step (ms)" error={errorOf('timeoutMs')} help="How long a step waits for its response." class="wfr-field wfr-w-220"
          >{#snippet children(c)}<Input
              {...c}
              class="wfr-mono-control"
              type="number"
              min={1}
              step={1}
              value={timeoutMs}
              oninput={(e) => (timeoutMs = e.currentTarget.value)}
            />{/snippet}</Field
        ></fieldset
      >{#if submitted && errors.length > 0}<div class="wfr-setup-errors"
          ><div bind:this={summary} class="wf-error-summary" role="alert" tabindex="-1"
            ><h2>{problemsTitle(errors.length)}</h2
            ><ul>{#each errors as e (e.field)}<li>{e.message}</li>{/each}</ul></div
          ></div
        >{/if}{#if failure}<div class="wfr-setup-errors"><ErrorBlock error={failure} title="The run could not start" /></div>{/if}<div
        class="wfr-setup-foot"
        ><span class="wfr-setup-hint">{launchHint}</span><div class="wfr-setup-buttons"
          ><ButtonRouterLink to={workflowTo}>Cancel</ButtonRouterLink><Button
            type="submit"
            variant="primary"
            icon="play"
            loading={busy}
            aria-disabled={!workflow.runnability.runnable || undefined}>Run</Button
          ></div
        ></div
      ></form
    ></div
  ><aside aria-label="Run side panels" class="wfr-aside"
    ><section aria-labelledby="wfr-plan-h" class="wfr-card wfr-plan"
      ><div class="wfr-plan-head"
        ><h2 id="wfr-plan-h" class="wfr-card-title">What runs</h2
        ><RouterLink to={workflowTo} class="wfr-link wfr-small-13">View in the loom</RouterLink></div
      ><Stepper variant="list" marker="circle" steps={planSteps} renderLabel={planLabel} /><p class="wfr-note"
        >A step passes when its success criteria hold and, with schema validation on, its response conforms to its OpenAPI schema. A failed step applies its first onFailure action whose criteria hold; without one, the run ends there and later steps are not run.</p
      ></section
    ><RunApiPanel
      hint="Launches the same run as the form above."
      documentApiId={document.apiId}
      {documentLabel}
      workflowId={workflow.workflowId}
      mockUrl={workflow.mockUrl}
      mixed={target === 'mixed'}
      body={setupApiBody({ workflow, inputs, timeoutMs: request.timeoutMs, target, baseUrls, perSource, secret: request.secret, validate, example })}
    /></aside
  ></div
>
