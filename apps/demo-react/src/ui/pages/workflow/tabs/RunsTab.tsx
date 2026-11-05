import { useState } from 'react';
import { Link } from 'react-router';
import { formatClock, formatDuration } from '@/domain/shared';
import { callTotals, matchesRunKind, stoppedStep, verdictExplanation, type RunKindFilter, type Session, type StepStatus, type WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useRelativeTime } from '@/ui/app';
import { RUN_STATUS_ICON, RUN_STATUS_WORD } from '@/ui/app/outcomes';
import { Chip } from '@/ui/components/ui/chip';
import { Button } from '@/ui/components/ui/button';
import { Icon, type IconName } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { runPath, runSetupPath } from '../../workflows/shared';
import { originWord } from '../run-facts';
import './runs.css';

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

export interface RunsTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  sessions?: Session[];
  initialFilter?: string;
}

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
      const parts = [s ? `${s.flow.title.charAt(0).toLowerCase()}${s.flow.title.slice(1)} on ${s.stepId}` : undefined, unexpected ? `${unexpected} unexpected ${unexpected === 1 ? 'call' : 'calls'}` : undefined].filter(Boolean);
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

export function RunsTab({ detail, runs, sessions = [], initialFilter }: RunsTabProps) {
  const relative = useRelativeTime();
  const { workflow, document } = detail;
  const initial = initialFilter === 'impl' ? 'implementations' : initialFilter === 'mockurl' ? 'mock-url' : initialFilter;
  const [filter, setFilter] = useState<Filter>(FILTERS.some((f) => f.id === initial) ? (initial as Filter) : 'all');
  const [copied, setCopied] = useState(false);
  const match = (r: WorkflowRun, f: Filter) => f === 'all' || matchesRunKind(r, f);
  const shown = runs.filter((r) => match(r, filter));
  const label = FILTERS.find((f) => f.id === filter)?.label ?? '';
  const total = runs[0]?.number ?? runs.length;
  const n = workflow.steps.length;
  const api = RUNS_API(workflow.workflowId);

  return (
    <section aria-label="Runs" className="wf-runs-panel">
      <div className="wf-runs-head">
        <div className="wf-runs-left">
          <span className="wf-runs-count">
            Last {runs.length} of {total} {total === 1 ? 'run' : 'runs'}
          </span>
          <div role="group" aria-label="Filter runs by origin" className="wf-runs-filters">
            {FILTERS.map((f) => (
              <Chip key={f.id} size="lg" pressed={f.id === filter} count={runs.filter((r) => match(r, f.id)).length} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
        </div>
        {workflow.runnability.runnable ? (
          <Button asChild variant="primary" size="compact" icon="play">
            <Link to={runSetupPath(document.id, workflow.workflowId)}>Run workflow</Link>
          </Button>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <div className="wf-runs-empty">
          <span role="status" className="wf-runs-empty-title">
            {runs.length === 0 ? 'This workflow has no run yet' : `No run with the origin ${label} among the last runs`}
          </span>
          {runs.length > 0 ? (
            <Button size="compact" onClick={() => setFilter('all')}>
              Show all runs
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="wf-runs-scroll">
            <ul className="wf-runs-list" aria-label={`Runs of ${workflow.workflowId}${filter === 'all' ? '' : ` with the origin ${label}`}`}>
              <li aria-hidden="true" className="wf-runs-row wf-runs-header">
                <span data-col="run">Run</span>
                <span data-col="result">Result</span>
                <span data-col="origin">Origin</span>
                <span data-col="inputs">Inputs</span>
                <span data-col="steps">Steps 1 → {n}</span>
                <span data-col="end">End</span>
                <span data-col="dur">Duration</span>
                <span data-col="started">Started</span>
                <span data-col="chev" />
              </li>
              {shown.map((r) => {
                const passed = r.status === 'SUCCESS';
                const word = RUN_STATUS_WORD[r.status];
                const ms = callTotals(r).ms;
                const when = `${cap(relative(r.startedAt))} · ${formatClock(r.startedAt).replace(/, \d{4} (\d\d:\d\d):\d\d$/, ', $1')}`;
                const note = noteOf(r, sessions);
                const end = endOf(r);
                const bandAlt = `Steps: ${workflow.steps.map((s, i) => `${i + 1} · ${s.stepId} · ${CELL[r.steps.find((x) => x.stepId === s.stepId)?.status ?? 'not-run'].word}`).join('; ')}`;
                return (
                  <li key={r.id} className="wf-runs-item">
                    <Link to={runPath(r.id)} className="wf-runs-row wf-runs-link">
                      <span data-col="run" className="wf-runs-id">
                        #{r.number}
                      </span>
                      <span data-col="result" className="wf-runs-result" data-tone={passed ? 'pass' : r.status === 'FAILURE' ? 'fail' : 'off'}>
                        <Icon name={RUN_STATUS_ICON[r.status]} size={14} strokeWidth={2.2} />
                        {word}
                      </span>
                      <span data-col="origin" className="wf-runs-origin">
                        <Chip size="sm">{originWord(r)}</Chip>
                        <span className="wf-runs-sub">{originSub(r)}</span>
                      </span>
                      <span data-col="inputs" className="wf-runs-inputs">
                        {Object.entries(r.options.inputs).map(([k, v]) => `${k}=${String(v)}`).join(' · ') || 'no input'}
                      </span>
                      <span data-col="steps" role="img" aria-label={bandAlt} className="wf-runs-band">
                        {workflow.steps.map((s) => {
                          const st = r.steps.find((x) => x.stepId === s.stepId)?.status ?? 'not-run';
                          return (
                            <span key={s.stepId} className="wf-runs-cell" data-status={st}>
                              <Icon name={CELL[st].icon} size={9} strokeWidth={3} />
                            </span>
                          );
                        })}
                      </span>
                      <span data-col="end" className="wf-runs-end" data-tone={r.status === 'FAILURE' ? 'fail' : undefined}>
                        {end}
                      </span>
                      <span data-col="dur" className="wf-runs-dur">
                        {ms > 0 ? formatDuration(ms) : '—'}
                      </span>
                      <span data-col="started" className="wf-runs-started">
                        <span>{when}</span>
                        <span className="wf-runs-by">{byOf(r)}</span>
                      </span>
                      <span data-col="chev" className="wf-runs-chev">
                        <Icon name="chevron" size={14} />
                        <span className="sr-only">Open run</span>
                      </span>
                    </Link>
                    <div className="wf-runs-note" data-tone={note.tone}>
                      {note.text}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div aria-hidden="true" className="wf-runs-legend">
            <span>
              <span className="wf-runs-cell" data-status="passed" data-size="sm">
                <Icon name="check" size={7} strokeWidth={3.4} />
              </span>
              Passed
            </span>
            <span>
              <span className="wf-runs-cell" data-status="failed" data-size="sm">
                <Icon name="cross" size={7} strokeWidth={3.4} />
              </span>
              Failed (criteria, schema validation or verification)
            </span>
            <span>
              <span className="wf-runs-cell" data-status="not-run" data-size="sm">
                <Icon name="dash" size={7} strokeWidth={3.4} />
              </span>
              Not run
            </span>
          </div>
        </>
      )}

      <div className="wf-runs-pipeline">
        <span className="wf-runs-pipeline-label">Run it from a pipeline</span>
        <span className="wf-runs-api">
          <MethodTag size="xs" method="POST" />
          {api}
        </span>
        <Button
          size="sm"
          aria-label="Copy the runs endpoint"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(`POST ${api}`)
              .then(() => setCopied(true))
              .catch(() => undefined)
          }
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </section>
  );
}
