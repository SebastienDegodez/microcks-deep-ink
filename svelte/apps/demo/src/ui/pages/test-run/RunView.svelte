<script lang="ts">
  import { untrack } from 'svelte';
  import { formatClock } from '@microcks/demo-core/domain/shared';
  import { buildRunnerLog, ciCommandForRun, elapsedMs, type TestRun } from '@microcks/demo-core/domain/testing';
  import { ApiBadge, Button, CiPanel, ConformanceBand, Icon, LiveIndicator, MethodTag, RunProgress, RunnerLog, SectionLabel, StatusBadge } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
  import { TEST_RESULT_WORD } from '@/ui/app/outcomes';
  import { useReplay } from '@/ui/app/use-replay.svelte.js';
  import { useThrottledAnnounce } from '../tests/throttled-announce';
  import StepDiff from './StepDiff.svelte';
  import {
    STEP_LOOK,
    STEP_MS,
    STEP_SEGMENT,
    basePath,
    failedSchemaName,
    initialReplay,
    nowCalling,
    operationBandLabels,
    operationOutcomes,
    operationStates,
    operationsSummary,
    previousPoint,
    progressCounts,
    resultStatus,
    runOperations,
    runScore,
    runnerLogLines,
    runningLabel,
    scoreLevel,
    selectedStepId,
    stepAnnouncement,
    stepCounts,
    stepStates,
    trendDir,
    trendIcon,
    trendText,
    verdictAnnouncement,
    verdictIcon,
    verdictWord,
  } from './run';

  interface Props {
    base: TestRun;
  }

  /** One run, replayed from its first step (or from the live point): progress, verdict, runner log and results. */
  let { base }: Props = $props();

  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const throttled = useThrottledAnnounce(2000);
  const form = useQuery(() => uc.testing.getCreateForm(base.serviceId), () => [base.serviceId]);
  const timeline = useQuery(() => uc.testing.timeline(base.serviceId), () => [base.serviceId]);
  const total = $derived(base.steps.length);
  const initial = untrack(() => initialReplay(base));
  let phase = $state(initial.phase);
  let tick = $state(initial.tick);
  /** `null` follows the run (latest finished step while running, the first failed one when done); '' = all closed. */
  let sel = $state<string | null>(null);
  let ciOpen = $state(false);
  /** The control the user pressed disappears when the run ends (Skip to result, Step forward): focus then moves to the verdict. */
  let focusVerdict = false;
  const running = $derived(phase === 'running');
  const done = $derived(!running);
  const finished = $derived(done ? total : tick);

  /** One step further; after the last step the run computes its verdict. */
  function advance() {
    if (phase !== 'running') return;
    if (tick >= total) {
      phase = 'done';
      tick = total;
    } else tick += 1;
  }
  useReplay(() => phase === 'running', advance, STEP_MS);

  const replay = () => {
    phase = 'running';
    tick = 0;
    sel = null;
    ciOpen = false;
  };
  const focusOnFinish = (node: HTMLElement) => {
    if (!focusVerdict) return;
    focusVerdict = false;
    node.focus();
  };
  const stepForward = () => {
    if (tick >= total) focusVerdict = true;
    advance();
  };
  const skip = () => {
    focusVerdict = true;
    phase = 'done';
    tick = total;
    sel = null;
  };

  const service = $derived(form.data?.services.find((s) => s.id === base.serviceId));
  const serviceLabel = $derived(service ? `${service.name} ${service.version}` : base.serviceId);

  const states = $derived(stepStates(base, finished, tick, running));
  const counts = $derived(stepCounts(states));

  // Announce progress (throttled) and the verdict.
  let previousProgress = untrack(() => ({ finished, done }));
  $effect(() => {
    const prev = previousProgress;
    previousProgress = { finished, done };
    if (done && !prev.done) {
      announce(verdictAnnouncement(base, counts.pass, total));
    } else if (!done && finished > prev.finished) {
      const step = base.steps[finished - 1];
      if (step) throttled(stepAnnouncement(finished, total, step));
    }
  });

  const operations = $derived(runOperations(base));
  const opStates = $derived(operationStates(operations, states));

  const selId = $derived(selectedStepId(base, done, tick, sel));

  const log = $derived(buildRunnerLog({ ...base, result: done ? base.result : 'running' }, finished, done));
  const elapsed = $derived(elapsedMs(base, finished));
  const score = $derived(runScore(counts.pass, total));
  const waitSec = $derived(Math.round(base.timeoutMs / 1000));
  const apiRef = $derived(service ? `${service.name}:${service.version}` : base.serviceId);
  const ci = $derived(ciCommandForRun(apiRef, base.endpoint, base.runner, waitSec));
  const current = $derived(running ? base.steps[tick] : undefined);
  const prefix = $derived(basePath(base.endpoint));

  const previous = $derived(previousPoint(timeline.data ?? [], base.id));
  const delta = $derived(previous ? score - previous.conformance : 0);

  const brokenOps = $derived(operations.filter((_, i) => opStates[i] === 'fail'));
  const failedSchema = $derived(failedSchemaName(base));
  const bandOutcomes = $derived(operationOutcomes(opStates));
  const related = $derived(base.relatedWorkflowRun);
</script>

{#snippet badges()}<span class="tr-badges"
    ><RouterLink to={`/services/${base.serviceId}`} class="tr-badge-link"
      ><ApiBadge protocol={service?.protocol ?? 'REST'} name={serviceLabel} size="lg" /></RouterLink
    >{#if running}<LiveIndicator /><StatusBadge shape="bare" status="running" label={runningLabel(tick, total)} />{:else}<ApiBadge
        label="result"
        value={TEST_RESULT_WORD[base.result].toLowerCase()}
        status={resultStatus(base.result)}
      />{/if}</span
  >{/snippet}

{#snippet description()}<span class="tr-meta"
    ><span><span class="tr-meta-key">Endpoint</span><span class="tr-meta-endpoint">{base.endpoint}</span></span
    ><span><span class="tr-meta-key">Runner</span><span class="tr-meta-runner">{base.runner}</span></span
    ><span
      ><span class="tr-meta-key">Started</span><span>{relative(base.startedAt)}</span><span class="tr-meta-date"
        >{formatClock(base.startedAt)}</span
      ></span
    ><span><span class="tr-meta-key">{done ? 'Duration' : 'Elapsed'}</span><span class="demo-mono">{elapsed}<!----> ms</span></span
    ><span><span class="tr-meta-key">Timeout</span><span class="demo-mono">{waitSec}<!----> s</span></span
    >{#if base.launchedBy}<span><span class="tr-meta-key">Launched by</span><span>{base.launchedBy}</span></span>{/if}</span
  >{/snippet}

{#snippet actions()}<Button icon="reset" onclick={replay}>Replay run</Button>{#if running}<Button variant="primary" icon="skip" onclick={skip}
      >Skip to result</Button
    >{/if}{/snippet}

{#snippet stepForwardAction()}<Button size="sm" icon="chevron" class="tr-step-forward" onclick={stepForward}>Step forward</Button>{/snippet}

{#snippet liveStatus()}<LiveIndicator variant="inline" label="live · streaming" />{/snippet}

{#snippet ciFootnote()}Set <span class="demo-mono">MICROCKS_CLIENT_SECRET</span> from the <span class="demo-mono">microcks-serviceaccount</span> credentials. The same parameters work with the GitHub Action, GitLab CI, Jenkins and Tekton integrations.{/snippet}

<PageHeader
  title={`Run #${base.id}`}
  breadcrumb={[
    { label: 'APIs & Services', to: '/services' },
    { label: serviceLabel, to: `/services/${base.serviceId}` },
    { label: 'Tests', to: `/tests/service/${base.serviceId}` },
    { label: `Run #${base.id}` },
  ]}
  badge={badges}
  align="start"
  {description}
  {actions}
/><div class="tr-top"
  >{#if running}<RunProgress
      class="tr-card"
      done={finished}
      {total}
      caption="test steps done"
      nowLabel="Now calling"
      now={nowCalling(current, base.endpoint)}
      segments={states.map((st) => STEP_SEGMENT[st])}
      counts={progressCounts(counts)}
      action={stepForwardAction}
      note="Microcks replays every example of the contract against the endpoint, then validates each response body with the OpenAPI schema of the operation."
    />{:else}<section aria-label="Verdict" class="tr-verdict" tabindex="-1" {@attach focusOnFinish}
      ><div class="tr-verdict-head"
        ><div class="tr-score"
          ><SectionLabel lineHeight="normal">Conformance score</SectionLabel><span class="tr-score-value" data-level={scoreLevel(score)}
            >{score}<!---->%</span
          >{#if previous}<span class="tr-trend" data-dir={trendDir(delta)}
              ><Icon name={trendIcon(delta)} size={13} stroke-width={2.4} />{trendText(delta)}<!----> run #<!---->{previous.runId}<!---->{' '}<span
                class="tr-trend-prev">{previous.conformance}<!---->%</span
              ></span
            >{/if}</div
        ><div class="tr-verdict-text"
          ><span class="tr-verdict-word" data-result={base.result}
            ><Icon name={verdictIcon(base.result)} size={18} stroke-width={2.6} />{verdictWord(base.result)}</span
          ><span class="tr-verdict-summary"
            ><span class="demo-mono-strong">{counts.pass}<!---->/<!---->{total}</span>{' '}<!---->test steps passed ·<!---->{' '}<!---->{operationsSummary(brokenOps.length, operations.length)}</span
          >{#if brokenOps[0] && base.result === 'failed' && failedSchema}<span class="tr-verdict-detail"
              ><span class="demo-mono">{brokenOps[0].method}<!---->{' '}<!---->{brokenOps[0].path}</span>{' '}<!---->returns a body that does not match the <span
                class="demo-mono">{failedSchema}</span
              > schema.</span
            >{:else if base.reason}<span class="tr-verdict-detail">{base.reason}</span>{/if}{#if related}<RouterLink
              to={`/workflows/runs/${related.runId}`}
              class="tr-verdict-link"
              ><Icon name="dispatcher" size={14} /><span
                >Same contract violation breaks workflow <strong>{related.workflowTitle}</strong> (run #<!---->{related.number}<!---->, schema validation) at step<!---->{' '}<span
                  class="demo-mono">{related.stepId}</span
                ></span
              ></RouterLink
            >{/if}</div
        ></div
      ><div class="tr-band"
        ><span class="tr-band-caption">Conformance band · one cell per operation</span><ConformanceBand
          outcomes={bandOutcomes}
          labels={operationBandLabels(operations, opStates)}
        /></div
      ><div class="tr-actions"
        ><ButtonRouterLink variant="primary" icon="play" to={`/tests/create?service=${base.serviceId}`}>Run again</ButtonRouterLink
        ><ButtonRouterLink to={`/tests/service/${base.serviceId}`}>All runs</ButtonRouterLink
        ><ButtonRouterLink to={`/services/${base.serviceId}`}>Back to service</ButtonRouterLink
        ><Button icon="code" class="ci-panel-toggle" aria-expanded={ciOpen} aria-controls="ci-panel" onclick={() => (ciOpen = !ciOpen)}
          >Add to CI</Button
        ></div
      >{#if ciOpen}<CiPanel
          id="ci-panel"
          title="Run this test in your pipeline"
          hint="Same service, endpoint and runner. The command exits non-zero when the test fails, so a contract break stops the build."
          command={ci}
          copyLabel="Copy command"
          footnote={ciFootnote}
        />{/if}</section
    >{/if}<RunnerLog class="tr-log" status={running ? liveStatus : `${log.length} lines · completed`} lines={runnerLogLines(log)} /></div
><section aria-labelledby="tr-results-title" class="tr-results"
  ><div class="tr-results-head"
    ><h2 id="tr-results-title" class="tr-results-title">Results</h2><span class="tr-results-hint"
      >{operations.length}<!----> operations · <!---->{total}<!----> test steps · select a finished step to compare the contract with the actual response</span
    ></div
  >{#each operations as op, oi (op.id)}{@const opState = opStates[oi] ?? 'pend'}{@const fin = op.idx.filter((i) => i < finished)}{@const ms = fin.reduce(
      (n, i) => n + (base.steps[i]?.ms ?? 0),
      0,
    )}<div class="tr-op" data-state={opState}
      ><div class="tr-op-head"
        ><MethodTag method={op.method} class="tr-op-method" /><h3 class="tr-op-path">{op.path}</h3><span class="tr-op-count"
          >{op.idx.length}<!---->{' '}<!---->{op.idx.length === 1 ? 'step' : 'steps'}{#if fin.length > 0 && fin.length < op.idx.length}{` · ${fin.length} done`}{/if}</span
        ><span class="tr-op-segs" aria-hidden="true">{#each op.idx as i (i)}<span data-state={states[i]}></span>{/each}</span
        ><StatusBadge shape="bare" status={STEP_LOOK[opState].status} label={STEP_LOOK[opState].word} class="tr-state" /><span class="tr-op-ms"
          >{fin.length ? `${ms} ms` : '—'}</span
        ></div
      >{#each op.idx as i (i)}{@const step = base.steps[i]}{#if step}{@const st = states[i] ?? 'pend'}{@const isFin = st === 'pass' || st === 'fail'}{@const open =
            isFin && selId === step.id}{@const regionId = `tr-diff-${step.id}`}<div class="tr-step"
            ><button
              type="button"
              class="tr-step-row"
              data-state={st}
              aria-expanded={open}
              aria-controls={open ? regionId : undefined}
              aria-disabled={!isFin}
              onclick={() => {
                if (isFin) sel = open ? '' : step.id;
              }}
              ><span class="tr-step-name">{step.name}</span><span class="tr-step-req"
                >{step.method}<!---->{' '}<!---->{#if prefix}{prefix}{/if}<!---->{step.path}{#if step.requestBody}{`  ${step.requestBody}`}{/if}</span
              ><span class="tr-step-code" data-fin={isFin ? '' : undefined}>{isFin ? (step.httpStatus ?? 200) : '—'}</span><span class="tr-step-ms"
                >{isFin ? `${step.ms} ms` : '—'}</span
              ><StatusBadge shape="bare" status={STEP_LOOK[st].status} label={STEP_LOOK[st].word} class="tr-state" /><span
                class="tr-step-chevron"
                aria-hidden="true">{#if isFin}<Icon name="chevron" size={16} class="tr-step-chevron-icon" />{/if}</span
              ></button
            >{#if open}<StepDiff id={regionId} {step} run={base} serviceId={base.serviceId} />{/if}</div
          >{/if}{/each}</div
    >{/each}</section
>
