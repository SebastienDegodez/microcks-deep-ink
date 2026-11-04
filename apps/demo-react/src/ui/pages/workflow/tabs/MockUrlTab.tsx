import { useState } from 'react';
import { Link } from 'react-router';
import { callTotals, stoppedStep, type WorkflowRun } from '@/domain/arazzo';
import { formatDuration } from '@/domain/shared/time';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Icon } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { workflowPath } from '../../workflows/shared';
import './mock-url.css';

const RUN_ID = '6543f0c2a9e1b7d4c3f20a11';

type Tone = 'success' | 'warning' | 'danger';
interface Answer {
  code: string;
  tone: Tone;
  title: string;
  when: string;
  head: string;
  body: unknown;
}

const answers = (outputs: Record<string, unknown>, failed: string, timeoutRun: number): Answer[] => [
  { code: '200', tone: 'success', title: 'The workflow outputs', when: 'The workflow passed on the mocks: the body is exactly its outputs.', head: `200 OK · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: outputs },
  { code: '400', tone: 'warning', title: 'Refused', when: 'The body is not a JSON object of inputs. No run is created.', head: '400 Bad Request', body: { reason: 'The inputs must be a JSON object' } },
  {
    code: '504', tone: 'danger', title: 'Timeout', when: 'The run did not end within 30000 ms. It goes on; open it to see how it ends.',
    head: `504 Gateway Timeout · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: { runId: RUN_ID, reason: `Run #${timeoutRun} did not end within 30000 ms` },
  },
  {
    code: '409', tone: 'danger', title: 'A step failed', when: 'The status the mock of the failed step answered, else 502, naming the failed step.',
    head: `409 Conflict · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: { runId: RUN_ID, failedStep: failed, reason: `Step ${failed} failed: unmet success criteria $statusCode == 200` },
  },
];

function useCopy(): [string | undefined, (id: string, text: string) => void] {
  const [copied, setCopied] = useState<string | undefined>(undefined);
  return [
    copied,
    (id, text) =>
      void navigator.clipboard
        ?.writeText(text)
        .then(() => setCopied(id))
        .catch(() => undefined),
  ];
}

export function MockUrlTab({ detail, runs, onShowRuns }: { detail: WorkflowDetail; runs: WorkflowRun[]; onShowRuns?: () => void }) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const { workflow, document } = detail;
  const info = useQuery(() => uc.arazzo.getMockUrl(document.id, workflow.workflowId), [document.id, workflow.workflowId]);
  const examples = useQuery(() => uc.arazzo.listExamples(document.id, workflow.workflowId), [document.id, workflow.workflowId]);
  const [pick, setPick] = useState('200');
  const [copied, copy] = useCopy();

  if (!workflow.runnability.runnable) {
    return (
      <Callout tone="warning" title="Mock URL not available">
        {workflow.runnability.message}. Its Mock URL answers once the workflow can run.
      </Callout>
    );
  }
  if (info.status === 'loading' && !info.data) return <LoadingBlock label="the Mock URL" rows={2} />;
  if (info.status === 'error') return <ErrorBlock error={info.error} onRetry={info.reload} />;
  const data = info.data;
  if (!data) return null;

  const lastMockRun = runs.find((r) => r.number === data.lastCall?.runNumber && r.origin.kind === 'mock-url');
  // The 200 answer is the outputs of the last Mock URL call that passed, else of the last run with outputs.
  const sample = (lastMockRun?.status === 'SUCCESS' ? lastMockRun : runs.find((r) => r.status === 'SUCCESS' && Object.keys(r.outputs).length > 0))?.outputs ?? {};
  const failedStep = runs.map(stoppedStep).find((s) => s?.status === 'failed')?.stepId ?? workflow.steps[workflow.steps.length - 1]?.stepId ?? 'step';
  const list = answers(sample, failedStep, (runs[0]?.number ?? 0) + 1);
  const chosen = list.find((a) => a.code === pick) ?? (list[0] as Answer);
  const firstExample = examples.data?.[0]?.id;
  const runsLink = workflowPath(document.id, workflow.workflowId, 'runs', { filter: 'mock-url' });

  return (
    <div className="wf-mu-tab">
      <section aria-labelledby="wf-mu-title" className="wf-mu-panel" data-size="wide">
        <div className="wf-mu-intro">
          <h2 id="wf-mu-title">Mock URL</h2>
          <p>
            POST the inputs as JSON: Microcks plays the workflow on its mocks and answers with its outputs. An application can call one business operation instead
            of chaining the {workflow.steps.length} calls itself. Each call is a run of <span className="wf-mu-mono">{workflow.workflowId}</span> with the origin
            Mock URL, listed in Runs.
          </p>
        </div>

        <div className="wf-mu-field">
          <label htmlFor="workflow-mock-url">Mock URL</label>
          <div className="wf-mu-row">
            <MethodTag method={data.method} className="wf-mu-method" />
            <input id="workflow-mock-url" type="text" readOnly value={data.url} className="wf-mu-input" />
            <Button size="sm" className="wf-mu-copy" aria-label={`Copy the Mock URL of ${workflow.workflowId}`} onClick={() => copy('url', data.url)}>
              {copied === 'url' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <span className="wf-mu-help">
            <span className="wf-mu-mono">/arazzo/{'{title}'}/{'{version}'}/{'{workflowId}'}</span>, encoded like the Mock URLs of APIs.
          </span>
        </div>

        <div className="wf-mu-boxes">
          <div className="wf-mu-box" data-size="curl">
            <div className="wf-mu-box-head">
              <span className="wf-mu-box-title">
                curl <span className="wf-mu-box-sub">· inputs of {firstExample ? `the example ${firstExample}` : 'the workflow examples'}</span>
              </span>
              <Button size="sm" className="wf-mu-box-btn" aria-label={`${copied === 'curl' ? 'Copied' : 'Copy curl'} of ${workflow.workflowId}`} onClick={() => copy('curl', data.curl)}>
                {copied === 'curl' ? 'Copied' : 'Copy curl'}
              </Button>
            </div>
            <pre className="wf-mu-pre" data-tone="secondary">
              {data.curl}
            </pre>
          </div>
          <div className="wf-mu-box">
            <div className="wf-mu-box-head">
              <span className="wf-mu-box-title">Response</span>
              <span className="wf-mu-code" data-tone="success">
                200 OK
              </span>
            </div>
            <pre className="wf-mu-pre">{JSON.stringify(sample, null, 2)}</pre>
          </div>
        </div>

        <div className="wf-mu-last">
          {data.lastCall ? (
            <>
              <span className="wf-mu-last-text">
                Last call: run #{data.lastCall.runNumber} · {relative(data.lastCall.at)}
              </span>
              {lastMockRun ? (
                <span className="wf-mu-verdict" data-tone={lastMockRun.status === 'SUCCESS' ? 'success' : 'danger'}>
                  <Icon name={lastMockRun.status === 'SUCCESS' ? 'check-circle' : 'x-circle'} size={13} strokeWidth={2.2} />
                  {lastMockRun.status === 'SUCCESS' ? 'Passed' : 'Failed'}
                </span>
              ) : null}
              {lastMockRun ? (
                <span className="wf-mu-muted">
                  answered {lastMockRun.status === 'SUCCESS' ? 200 : 409} in {formatDuration(callTotals(lastMockRun).ms)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="wf-mu-muted">Never called.</span>
          )}
          {onShowRuns ? (
            <Button size="sm" className="wf-mu-runs" onClick={onShowRuns}>
              Show the Mock URL runs
            </Button>
          ) : (
            <Button asChild size="sm" className="wf-mu-runs">
              <Link to={runsLink}>Show the Mock URL runs</Link>
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="wf-ans-title" className="wf-mu-panel" data-size="narrow">
        <h2 id="wf-ans-title">Possible answers</h2>
        <div role="group" aria-label="Choose an answer" className="wf-mu-answers">
          {list.map((a) => (
            <button key={a.code} type="button" className="wf-mu-answer" aria-pressed={a.code === chosen.code} onClick={() => setPick(a.code)}>
              <span className="wf-mu-code" data-tone={a.tone}>
                {a.code}
              </span>
              <span className="wf-mu-answer-text">
                <span className="wf-mu-answer-title">{a.title}</span>
                <span className="wf-mu-answer-when">{a.when}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="wf-mu-box">
          <div className="wf-mu-box-head" data-kind="mono">
            {chosen.head}
          </div>
          <pre className="wf-mu-pre">{JSON.stringify(chosen.body, null, 2)}</pre>
        </div>
        <span className="wf-mu-note">
          Every answer but a refusal carries the header <span className="wf-mu-mono">X-Microcks-Arazzo-Run-Id</span>, so the caller can open the run.
        </span>
      </section>
    </div>
  );
}
