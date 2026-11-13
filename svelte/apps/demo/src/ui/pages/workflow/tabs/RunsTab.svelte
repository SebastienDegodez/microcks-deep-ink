<script lang="ts" module>
  import { stoppedStep, verdictExplanation, type RunKindFilter, type Session, type StepStatus, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import type { IconName } from '@microcks/deep-ink';

  type Filter = Exclude<RunKindFilter, 'any'> | 'all';

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All origins' },
    { id: 'implementations', label: 'Implementations' },
    { id: 'mocks', label: 'Microcks mocks' },
    { id: 'mock-url', label: 'Mock URL' },
    { id: 'session', label: 'Session' },
  ];

  const CELL: Record<StepStatus, { icon: IconName; word: string }> = {
    passed: { icon: 'check', word: 'Passed' },
    failed: { icon: 'cross', word: 'Failed' },
    'not-run': { icon: 'dash', word: 'Not run' },
  };

  const RUNS_API = (workflowId: string) => `/api/arazzo/documents/{documentId}/workflows/${workflowId}/runs`;

  /** "staging · pastry.staging.acme.io/v2", "s-7f3a2c91 · checkout-web", "example restock-eclair", "POST on the Mock URL". */
  function originSub(run: WorkflowRun): string {
    if (run.origin.kind === 'session') return `${run.origin.sessionId} · ${run.origin.app}`;
    if (run.origin.kind === 'mock-url') return 'POST on the Mock URL';
    if (run.target.kind === 'implementations') {
      const url = Object.values(run.target.baseUrls)[0] ?? '';
      return `${/staging/.test(url) ? 'staging' : 'implementation'} · ${url.replace(/^https?:\/\//, '')}`;
    }
    return run.options.example ? `example ${run.options.example}` : 'Microcks mocks';
  }

  function endOf(run: WorkflowRun): string {
    const s = stoppedStep(run);
    if (run.status === 'RUNNING') return 'Running';
    if (!s) return 'Runs to its end';
    if (run.status === 'SUCCESS') return `Ends early at ${s.stepId}`;
    return `${run.origin.kind === 'session' ? 'Fails' : 'Stops'} at ${s.stepId}`;
  }

  function byOf(run: WorkflowRun): string {
    switch (run.origin.kind) {
      case 'session':
        return `Verification requested by ${run.origin.app}`;
      case 'mock-url':
        return `Answered ${run.status === 'SUCCESS' ? '200 with the outputs' : '409 with the failed step'}`;
      case 'api':
        return 'Started from the API';
      default:
        return `Run by MA${run.target.kind === 'implementations' && run.options.validateSchemas ? ' · schema validation on' : ''}`;
    }
  }

  /** The note under a run row: why it failed, how it matched its example, or its outputs. */
  function noteOf(run: WorkflowRun, sessions: readonly Session[]): { text: string; tone: 'fail' | 'pass' | 'info' } {
    const s = stoppedStep(run);
    if (run.status === 'FAILURE') {
      if (run.origin.kind === 'session') {
        const session = sessions.find((x) => x.id === (run.origin as { sessionId: string }).sessionId);
        const unexpected = session?.calls.filter((c) => c.stepId === 'unexpected').length ?? 0;
        const parts = [
          s ? `${s.flow.title.charAt(0).toLowerCase()}${s.flow.title.slice(1)} on ${s.stepId}` : undefined,
          unexpected ? `${unexpected} unexpected ${unexpected === 1 ? 'call' : 'calls'}` : undefined,
        ].filter(Boolean);
        return { text: `The calls of the session do not follow the workflow${parts.length ? `: ${parts.join(', ')}` : ''}.`, tone: 'fail' };
      }
      if (s && s.schema.state === 'fail') {
        const bad = s.response?.lines.find((l) => l.bad);
        const field = bad ? /"([^"]+)":\s*(.+?),?$/.exec(bad.text.trim()) : null;
        const expected = bad?.note?.replace(/^schema:\s*/, '');
        const schema = s.schema.ref.split(' · ').pop();
        const attempts = s.attempts.length;
        const why = field && expected ? `/${field[1]} is a ${field[2]?.startsWith('"') ? 'string' : 'value'} where the ${schema} schema expects a ${expected}` : s.schema.message;
        return { text: `${s.stepId} failed${attempts > 1 ? ` after ${attempts} attempts` : ''}: schema validation, ${why}.`, tone: 'fail' };
      }
      return { text: verdictExplanation(run), tone: 'fail' };
    }
    if (run.origin.kind === 'mock-url') {
      const outs = Object.entries(run.outputs).map(([k, v]) => `${k} = ${String(v)}`);
      return { text: outs.length ? `Outputs ${outs.join(' · ')}` : 'No outputs.', tone: 'info' };
    }
    if (run.options.example && run.target.kind === 'mocks') return { text: `Matches the example ${run.options.example}: every expectation holds.`, tone: 'pass' };
    return { text: verdictExplanation(run), tone: run.status === 'SUCCESS' ? 'pass' : 'info' };
  }

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/runs.css';
  import { formatClock, formatDuration } from '@microcks/demo-core/domain/shared';
  import { callTotals, matchesRunKind } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { Button, Chip, Icon, MethodTag } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink, useRelativeTime } from '@/ui/app';
  import { RUN_STATUS_ICON, RUN_STATUS_WORD } from '@/ui/app/outcomes';
  import { runPath, runSetupPath } from '../../workflows/paths';
  import { originWord } from '../run-facts';

  interface Props {
    detail: WorkflowDetail;
    runs: WorkflowRun[];
    sessions?: Session[];
    initialFilter?: string;
  }

  let { detail, runs, sessions = [], initialFilter }: Props = $props();

  const relative = useRelativeTime();
  const workflow = $derived(detail.workflow);
  const document = $derived(detail.document);
  // svelte-ignore state_referenced_locally
  const initial = initialFilter === 'impl' ? 'implementations' : initialFilter === 'mockurl' ? 'mock-url' : initialFilter;
  let filter = $state<Filter>(FILTERS.some((f) => f.id === initial) ? (initial as Filter) : 'all');
  let copied = $state(false);
  const match = (r: WorkflowRun, f: Filter) => f === 'all' || matchesRunKind(r, f);
  const shown = $derived(runs.filter((r) => match(r, filter)));
  const label = $derived(FILTERS.find((f) => f.id === filter)?.label ?? '');
  const total = $derived(runs[0]?.number ?? runs.length);
  const n = $derived(workflow.steps.length);
  const api = $derived(RUNS_API(workflow.workflowId));

  const rowOf = (r: WorkflowRun) => ({
    passed: r.status === 'SUCCESS',
    word: RUN_STATUS_WORD[r.status],
    ms: callTotals(r).ms,
    when: `${cap(relative(r.startedAt))} · ${formatClock(r.startedAt).replace(/, \d{4} (\d\d:\d\d):\d\d$/, ', $1')}`,
    note: noteOf(r, sessions),
    end: endOf(r),
    bandAlt: `Steps: ${workflow.steps.map((s, i) => `${i + 1} · ${s.stepId} · ${CELL[r.steps.find((x) => x.stepId === s.stepId)?.status ?? 'not-run'].word}`).join('; ')}`,
  });
  const copyEndpoint = () =>
    void navigator.clipboard
      ?.writeText(`POST ${api}`)
      .then(() => (copied = true))
      .catch(() => undefined);
</script>

<section aria-label="Runs" class="wf-runs-panel"
  ><div class="wf-runs-head"
    ><div class="wf-runs-left"
      ><span class="wf-runs-count">Last <!---->{runs.length}<!----> of <!---->{total}<!---->{' '}<!---->{total === 1 ? 'run' : 'runs'}</span><div
        role="group"
        aria-label="Filter runs by origin"
        class="wf-runs-filters"
        >{#each FILTERS as f (f.id)}<Chip size="lg" pressed={f.id === filter} count={runs.filter((r) => match(r, f.id)).length} onclick={() => (filter = f.id)}
            >{f.label}</Chip
          >{/each}</div
      ></div
    >{#if workflow.runnability.runnable}<ButtonRouterLink variant="primary" size="compact" icon="play" to={runSetupPath(document.id, workflow.workflowId)}
        >Run workflow</ButtonRouterLink
      >{/if}</div
  >{#if shown.length === 0}<div class="wf-runs-empty"
      ><span role="status" class="wf-runs-empty-title">{runs.length === 0 ? 'This workflow has no run yet' : `No run with the origin ${label} among the last runs`}</span
      >{#if runs.length > 0}<Button size="compact" onclick={() => (filter = 'all')}>Show all runs</Button>{/if}</div
    >{:else}<div class="wf-runs-scroll"
      ><ul class="wf-runs-list" aria-label={`Runs of ${workflow.workflowId}${filter === 'all' ? '' : ` with the origin ${label}`}`}
        ><li aria-hidden="true" class="wf-runs-row wf-runs-header"
          ><span data-col="run">Run</span><span data-col="result">Result</span><span data-col="origin">Origin</span><span data-col="inputs">Inputs</span><span
            data-col="steps">Steps 1 → <!---->{n}</span
          ><span data-col="end">End</span><span data-col="dur">Duration</span><span data-col="started">Started</span><span data-col="chev"></span></li
        >{#each shown as r (r.id)}{@const row = rowOf(r)}<li class="wf-runs-item"
            ><RouterLink to={runPath(r.id)} class="wf-runs-row wf-runs-link"
              ><span data-col="run" class="wf-runs-id">#<!---->{r.number}</span><span
                data-col="result"
                class="wf-runs-result"
                data-tone={row.passed ? 'pass' : r.status === 'FAILURE' ? 'fail' : 'off'}
                ><Icon name={RUN_STATUS_ICON[r.status]} size={14} stroke-width={2.2} />{row.word}</span
              ><span data-col="origin" class="wf-runs-origin"><Chip size="sm">{originWord(r)}</Chip><span class="wf-runs-sub">{originSub(r)}</span></span><span
                data-col="inputs"
                class="wf-runs-inputs"
                >{Object.entries(r.options.inputs)
                  .map(([k, v]) => `${k}=${String(v)}`)
                  .join(' · ') || 'no input'}</span
              ><span data-col="steps" role="img" aria-label={row.bandAlt} class="wf-runs-band"
                >{#each workflow.steps as s (s.stepId)}{@const st = r.steps.find((x) => x.stepId === s.stepId)?.status ?? 'not-run'}<span
                    class="wf-runs-cell"
                    data-status={st}><Icon name={CELL[st].icon} size={9} stroke-width={3} /></span
                  >{/each}</span
              ><span data-col="end" class="wf-runs-end" data-tone={r.status === 'FAILURE' ? 'fail' : undefined}>{row.end}</span><span data-col="dur" class="wf-runs-dur"
                >{row.ms > 0 ? formatDuration(row.ms) : '—'}</span
              ><span data-col="started" class="wf-runs-started"><span>{row.when}</span><span class="wf-runs-by">{byOf(r)}</span></span><span
                data-col="chev"
                class="wf-runs-chev"><Icon name="chevron" size={14} /><span class="sr-only">Open run</span></span
              ></RouterLink
            ><div class="wf-runs-note" data-tone={row.note.tone}>{row.note.text}</div></li
          >{/each}</ul
      ></div
    ><div aria-hidden="true" class="wf-runs-legend"
      ><span
        ><span class="wf-runs-cell" data-status="passed" data-size="sm"><Icon name="check" size={7} stroke-width={3.4} /></span>Passed</span
      ><span
        ><span class="wf-runs-cell" data-status="failed" data-size="sm"><Icon name="cross" size={7} stroke-width={3.4} /></span>Failed (criteria, schema validation or verification)</span
      ><span
        ><span class="wf-runs-cell" data-status="not-run" data-size="sm"><Icon name="dash" size={7} stroke-width={3.4} /></span>Not run</span
      ></div
    >{/if}<div class="wf-runs-pipeline"
    ><span class="wf-runs-pipeline-label">Run it from a pipeline</span><span class="wf-runs-api"><MethodTag size="xs" method="POST" />{api}</span><Button
      size="sm"
      aria-label="Copy the runs endpoint"
      onclick={copyEndpoint}>{copied ? 'Copied' : 'Copy'}</Button
    ></div
  ></section
>
