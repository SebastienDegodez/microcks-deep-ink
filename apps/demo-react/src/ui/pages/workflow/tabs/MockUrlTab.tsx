import { useState } from 'react';
import type { WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { Callout } from '@/ui/components/ui/callout';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { MockUrl } from '@/ui/components/ui/mock-url';
import { Segmented } from '@/ui/components/ui/segmented';
import { ErrorBlock, LoadingBlock, PageLink, ResultWord, workflowPath } from '../../workflows/shared';

const RUN_ID = '6543f0c2a9e1b7d4c3f20a11';

const answers = (outputs: Record<string, unknown>, failed: string) => [
  { code: '200', title: 'The workflow outputs', when: 'The workflow passed on the mocks: the body is exactly its outputs.', head: `200 OK · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: outputs },
  { code: '400', title: 'Refused', when: 'The body is not a JSON object of inputs. No run is created.', head: '400 Bad Request', body: { reason: 'The inputs must be a JSON object' } },
  {
    code: '504', title: 'Timeout', when: 'The run did not end within 30000 ms. It goes on; open it to see how it ends.',
    head: `504 Gateway Timeout · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: { runId: RUN_ID, reason: 'Run did not end within 30000 ms' },
  },
  {
    code: '409', title: 'A step failed', when: 'The status the mock of the failed step answered, else 502, naming the failed step.',
    head: `409 Conflict · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: { runId: RUN_ID, failedStep: failed, reason: `Step ${failed} failed: unmet success criteria $statusCode == 200` },
  },
];

export function MockUrlTab({ detail, runs }: { detail: WorkflowDetail; runs: WorkflowRun[] }) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const { workflow, document } = detail;
  const info = useQuery(() => uc.arazzo.getMockUrl(document.id, workflow.workflowId), [document.id, workflow.workflowId]);
  const [pick, setPick] = useState('200');

  if (!workflow.runnability.runnable) {
    return (
      <Callout tone="warning" title="Mock URL not available">
        {workflow.runnability.message}. Its Mock URL answers once the workflow can run.
      </Callout>
    );
  }
  if (info.status === 'loading' && !info.data) return <LoadingBlock label="Loading the Mock URL" rows={2} />;
  if (info.status === 'error') return <ErrorBlock error={info.error} onRetry={info.reload} />;
  const data = info.data;
  if (!data) return null;

  const lastMockRun = runs.find((r) => r.number === data.lastCall?.runNumber && r.origin.kind === 'mock-url');
  const success = runs.find((r) => r.status === 'SUCCESS' && Object.keys(r.outputs).length > 0);
  const failedStep = runs.flatMap((r) => r.steps).find((s) => s.status === 'failed')?.stepId ?? workflow.steps[workflow.steps.length - 1]?.stepId ?? 'step';
  const list = answers(success?.outputs ?? {}, failedStep);
  const chosen = list.find((a) => a.code === pick) ?? list[0];

  return (
    <div className="wf-section">
      <section aria-labelledby="wf-mu-title" className="wf-section">
        <h2 id="wf-mu-title" className="wf-h2">
          Mock URL
        </h2>
        <p className="wf-lead">
          POST the inputs as JSON: Microcks plays the workflow on its mocks and answers with its outputs. An application can call one business operation
          instead of chaining the {workflow.steps.length} calls itself. Each call is a run of <code>{workflow.workflowId}</code> with the origin Mock URL, listed in
          Runs.
        </p>
        <MockUrl url={data.url} method="POST" bare aria-label={`Mock URL of ${workflow.workflowId}`} />
        <p className="wf-small wf-muted" style={{ margin: 0 }}>
          Shape <code>/arazzo/{'{title}'}/{'{version}'}/{'{workflowId}'}</code>, encoded like the Mock URLs of APIs.
        </p>
        <div className="wf-grid-2">
          <CodeBlock caption="curl · inputs of the first recorded example" language="bash" code={data.curl} />
          <CodeBlock caption="Response · 200 OK" language="json" code={JSON.stringify(success?.outputs ?? {}, null, 2)} />
        </div>
        <p className="wf-row" style={{ margin: 0 }}>
          {data.lastCall ? (
            <>
              <span>
                Last call: run #{data.lastCall.runNumber} · {relative(data.lastCall.at)}
              </span>
              {lastMockRun ? <ResultWord result={lastMockRun.status === 'SUCCESS' ? 'passed' : 'failed'} /> : null}
              <PageLink to={workflowPath(document.id, workflow.workflowId, 'runs', { origin: 'mock-url' })}>Show the Mock URL runs</PageLink>
            </>
          ) : (
            <span className="wf-muted">Never called.</span>
          )}
        </p>
      </section>

      <section aria-labelledby="wf-ans-title" className="wf-section">
        <h2 id="wf-ans-title" className="wf-h2">
          Possible answers
        </h2>
        <Segmented label="Choose an answer" options={list.map((a) => ({ id: a.code, label: `${a.code} ${a.title}` }))} value={chosen?.code ?? '200'} onChange={setPick} />
        {chosen ? (
          <>
            <p style={{ margin: 0 }}>{chosen.when}</p>
            <CodeBlock caption={chosen.head} language="json" code={JSON.stringify(chosen.body, null, 2)} />
          </>
        ) : null}
        <p className="wf-small wf-muted" style={{ margin: 0 }}>
          Every answer but a refusal carries the header <code>X-Microcks-Arazzo-Run-Id</code>, so the caller can open the run.
        </p>
      </section>
    </div>
  );
}
