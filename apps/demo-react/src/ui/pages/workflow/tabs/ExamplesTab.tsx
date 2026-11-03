import { useState } from 'react';
import type { WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { ButtonRouterLink, ErrorBlock, LoadingBlock, PageLink, ResultWord, RunTargetOf, runPath, runSetupPath } from '../../workflows/shared';
import type { WorkflowExample } from '@/domain/arazzo';

export interface ExamplesTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  examples: WorkflowExample[];
}

export function ExamplesTab({ detail, runs, examples }: ExamplesTabProps) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const { document, workflow } = detail;
  const overlay = useQuery(() => uc.arazzo.getDocumentOverlay(document.id), [document.id]);
  const [showOverlay, setShowOverlay] = useState(false);

  if (examples.length === 0) {
    return (
      <div className="wf-section">
        <h2 className="wf-h2">No recorded example</h2>
        <p className="wf-lead">
          Examples come from an ArazzoSources overlay: they give the inputs of a run and what it must show. {document.overlay ? '' : `${document.file} has no overlay yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="wf-section">
      <div className="wf-row-between">
        <div>
          <h2 className="wf-h2">
            {examples.length} recorded {examples.length === 1 ? 'example' : 'examples'}
          </h2>
          <p className="wf-lead">
            From the ArazzoSources overlay <code>{document.overlay}</code>, identified by {document.title} {document.version}. An example gives inputs and what
            the run must show: step statuses, where it ends and its outputs. Running an example judges the run against it.
          </p>
        </div>
        <Button aria-expanded={showOverlay} aria-controls="wf-overlay" onClick={() => setShowOverlay((v) => !v)}>
          {showOverlay ? 'Hide the overlay' : 'Show the overlay'}
        </Button>
      </div>
      <div id="wf-overlay" hidden={!showOverlay}>
        {showOverlay ? (
          overlay.status === 'error' ? (
            <ErrorBlock error={overlay.error} onRetry={overlay.reload} />
          ) : overlay.data ? (
            <CodeBlock caption="ArazzoSources overlay" language="yaml" code={overlay.data} maxHeight={420} />
          ) : (
            <LoadingBlock label="Loading the overlay" rows={1} />
          )
        ) : null}
      </div>

      <ul className="wf-list" aria-label="Recorded examples">
        {examples.map((ex) => {
          const judged = runs.find((r) => r.options.example === ex.id);
          const first = Object.keys(ex.inputs)[0];
          return (
            <li key={ex.id}>
              <article aria-labelledby={`wf-ex-${ex.id}`} className="wf-source-card">
                <div className="wf-row-between">
                  <div>
                    <h3 id={`wf-ex-${ex.id}`} className="wf-h3">
                      {ex.id}
                    </h3>
                    <p className="wf-small wf-muted" style={{ margin: 0 }}>
                      {ex.description}
                    </p>
                  </div>
                  <ButtonRouterLink to={`${runSetupPath(document.id, workflow.workflowId)}?example=${ex.id}`} icon="play">
                    Run this example<span className="sr-only"> {ex.id}</span>
                  </ButtonRouterLink>
                </div>
                <dl className="wf-kv">
                  <dt>Inputs</dt>
                  <dd className="wf-chip-line">
                    {first
                      ? Object.entries(ex.inputs).map(([k, v]) => (
                          <Chip key={k} variant="outline">
                            {k} = {String(v)}
                          </Chip>
                        ))
                      : 'none'}
                  </dd>
                  <dt>Expected steps</dt>
                  <dd className="wf-chip-line">
                    {workflow.steps.map((s) => {
                      const exp = ex.steps.find((x) => x.stepId === s.stepId);
                      return (
                        <Chip key={s.stepId} variant={exp ? 'outline' : 'dashed'} tone={exp ? 'neutral' : 'neutral'}>
                          {s.stepId} · {exp ? `${exp.status}${exp.outputs ? ` · ${Object.entries(exp.outputs).map(([k, v]) => `${k} = ${v}`).join(', ')}` : ''}` : 'Not run'}
                        </Chip>
                      );
                    })}
                  </dd>
                  <dt>Expected end</dt>
                  <dd>{ex.stopsAt ? `Stops at ${ex.stopsAt}` : 'Runs to its end'}</dd>
                  <dt>Expected outputs</dt>
                  <dd>{Object.keys(ex.outputs).length ? Object.entries(ex.outputs).map(([k, v]) => `${k} = ${v}`).join(', ') : 'None expected'}</dd>
                  <dt>Last judged</dt>
                  <dd className="wf-row">
                    {judged ? (
                      <>
                        <ResultWord result={judged.status === 'SUCCESS' ? 'passed' : 'failed'} />
                        <PageLink to={runPath(judged.id)}>
                          Run #{judged.number} · {relative(judged.startedAt)}
                        </PageLink>
                        <RunTargetOf run={judged} />
                      </>
                    ) : (
                      <span className="wf-muted">Not run yet</span>
                    )}
                  </dd>
                </dl>
              </article>
            </li>
          );
        })}
      </ul>
      {overlay.data ? (
        <p className="wf-small wf-muted" style={{ margin: 0 }}>
          The overlay also links the source descriptions: {document.sources.map((s) => s.name).join(', ')}. The Mock URL curl uses the inputs of the first example.
        </p>
      ) : null}
    </div>
  );
}
