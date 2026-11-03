import { actionLabel, actionsOf, describeAction, type ArazzoDocument, type Step, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { StepChecks, StepStatus } from '@/ui/components/ui/step-status';
import { PageLink } from '../workflows/shared';
import { lensOf } from './loom-model';

export interface StepInspectorProps {
  workflow: Workflow;
  document: ArazzoDocument;
  run?: WorkflowRun;
  step?: Step;
  failedStepId?: string;
  onTrace: (expression: string) => void;
  onSelectFailed: () => void;
  onClose: () => void;
}

/** Side panel of the Loom: operation, result in the selected run, parameters, criteria, actions, outputs. */
export function StepInspector({ workflow, document, run, step, failedStepId, onTrace, onSelectFailed, onClose }: StepInspectorProps) {
  if (!step) {
    return (
      <Panel title="Step inspector" headingLevel={2}>
        <div className="wf-inspector">
          <p>
            No step selected. Select a step on the loom to inspect its operation, parameters, criteria, actions and outputs
            {run ? `, with the values resolved in run #${run.number}` : ''}.
          </p>
          {failedStepId ? (
            <div>
              <Button size="sm" onClick={onSelectFailed}>
                Inspect the failed step of #{run?.number}
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>
    );
  }

  const index = workflow.steps.indexOf(step) + 1;
  const result = run?.steps.find((r) => r.stepId === step.stepId);
  const source = document.sources.find((s) => s.name === step.sourceName);
  const validate = run?.options.validateSchemas === true;
  const last = result?.attempts[result.attempts.length - 1];
  const used = (expression: string) => lensOf(expression, workflow, run).uses.length > 0;

  return (
    <Panel
      title={`Step ${index}, ${step.stepId}`}
      headingLevel={2}
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close inspector
        </Button>
      }
    >
      <div className="wf-inspector">
        <div className="wf-section">
          <p style={{ margin: 0 }}>{step.description}</p>
          <div className="wf-row">
            <MethodTag method={step.method} protocol={source?.type === 'asyncapi' ? 'EVENT' : 'REST'} />
            {source?.link.status === 'linked' ? (
              <PageLink to={`/services/${source.link.serviceId}`}>
                <code>{step.path}</code>
              </PageLink>
            ) : (
              <code>{step.path}</code>
            )}
          </div>
          <span className="wf-small wf-muted">
            operationId: <code>{step.operationId}</code> · source {step.sourceName}
          </span>
        </div>

        <div className="wf-section">
          <h3 className="wf-h3">Result{run ? <span className="wf-muted"> · run #{run.number}</span> : null}</h3>
          {!run ? (
            <p className="wf-muted" style={{ margin: 0 }}>
              No run selected: the loom shows the definition only.
            </p>
          ) : result && result.status !== 'not-run' ? (
            <>
              <div className="wf-row">
                <StepStatus status={result.status} attempts={result.attempts.length} />
                {last ? (
                  <span className="wf-small wf-muted">
                    {last.httpStatus} · {last.ms} ms
                  </span>
                ) : null}
              </div>
              <StepChecks
                successCriteria={result.criteria.every((c) => c.held) ? 'passed' : 'failed'}
                schemaValidation={validate ? (result.schema.state === 'pass' ? 'passed' : result.schema.state === 'fail' ? 'failed' : 'not-evaluated') : undefined}
              />
              {result.schema.state === 'fail' ? (
                <Callout tone="danger" title="Schema validation failed">
                  <span className="wf-mono">{result.schema.message}</span>
                  <br />
                  Its success criteria held, but a response that breaks its schema fails the step.
                </Callout>
              ) : null}
              {result.attempts.length > 1 ? (
                <ol className="wf-attempts" aria-label="Attempts">
                  {result.attempts.map((a) => (
                    <li key={a.n}>
                      <strong>
                        attempt {a.n} of {result.attempts.length}
                      </strong>
                      <span className="wf-muted">{a.when}</span>
                      <span>{a.httpStatus}</span>
                      <span className="wf-muted">{a.ms} ms</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </>
          ) : (
            <p className="wf-muted" style={{ margin: 0 }}>
              Not run: {result ? 'the run ended before this step.' : 'this step is not part of the run.'}
            </p>
          )}
        </div>

        {step.parameters.length ? (
          <div className="wf-section">
            <h3 className="wf-h3">Parameters</h3>
            <ul className="wf-list">
              {step.parameters.map((p) => (
                <li key={p.name}>
                  <div className="wf-row">
                    <code>{p.name}</code>
                    <span className="wf-small wf-muted">in: {p.in}</span>
                  </div>
                  {p.value.startsWith('$') ? (
                    <Button size="sm" variant="ghost" onClick={() => onTrace(p.value)} aria-label={`Trace ${p.value}`}>
                      <code>{p.value}</code>
                    </Button>
                  ) : (
                    <code className="wf-expr">{p.value}</code>
                  )}
                  {result?.request?.params[p.name] ? <span className="wf-small wf-muted"> = {result.request.params[p.name]}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step.requestBody ? (
          <div className="wf-section">
            <h3 className="wf-h3">
              requestBody <span className="wf-small wf-muted">application/json</span>
            </h3>
            <pre className="wf-pre" aria-label="Payload template">
              {step.requestBody}
            </pre>
            {result?.request?.body ? (
              <pre className="wf-pre" aria-label={`Sent in run ${run?.number}`}>
                {result.request.body}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div className="wf-section">
          <h3 className="wf-h3">Success criteria</h3>
          <ul className="wf-list">
            {step.successCriteria.map((c) => {
              const ev = result?.criteria.find((x) => x.condition === c.condition);
              return (
                <li key={c.condition}>
                  <span className="wf-small wf-muted">{c.type}</span> <code>{c.condition}</code>
                  {c.type === 'regex' ? <span className="wf-small wf-muted"> on {c.context}</span> : null}
                  {ev ? (
                    <strong className="wf-small">
                      {' '}
                      · {ev.held ? 'held' : 'did not hold'} ({ev.evaluation})
                    </strong>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="wf-section">
          <h3 className="wf-h3">onSuccess · onFailure</h3>
          {actionsOf(step).length === 0 ? (
            <p className="wf-muted" style={{ margin: 0 }}>
              No action: a failure ends the run here.
            </p>
          ) : (
            <ul className="wf-list">
              {actionsOf(step).map(({ when, action }) => (
                <li key={`${when}-${action.name}`}>
                  <span className="wf-small wf-muted">{when}</span> <code>{actionLabel(action)}</code>
                  <br />
                  <span className="wf-small">{describeAction(action)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="wf-section">
          <h3 className="wf-h3">Outputs</h3>
          {step.outputs.length === 0 ? (
            <p className="wf-muted" style={{ margin: 0 }}>
              No output declared.
            </p>
          ) : (
            <ul className="wf-list">
              {step.outputs.map((o) => {
                const expr = `$steps.${step.stepId}.outputs.${o.name}`;
                const value = result?.outputs[o.name];
                return (
                  <li key={o.name}>
                    <div className="wf-row">
                      <strong>{o.name}</strong>
                      <code className="wf-expr">{o.expression}</code>
                    </div>
                    <div className="wf-row">
                      <span className="wf-small">resolved {value === undefined ? '—' : JSON.stringify(value)}</span>
                      {used(expr) ? (
                        <Button size="sm" variant="ghost" onClick={() => onTrace(expr)}>
                          Trace where it goes
                        </Button>
                      ) : (
                        <span className="wf-small wf-muted">Not consumed by another step or output.</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
