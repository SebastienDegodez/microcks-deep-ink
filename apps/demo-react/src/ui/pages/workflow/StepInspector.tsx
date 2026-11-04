import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { criteriaText, stoppedStep, type Action, type ArazzoDocument, type Step, type StepResult, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { formatDuration } from '@/domain/shared/time';
import { STATUS_ICON } from '@/ui/app/outcomes';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { bodyPointer, expressionsOf, formatValue, stepResultLine, threadsOf, valueIn, wrongValue } from './loom-model';
import { httpLine, originWord, runNoun, stepChecksOf, stepStatusOf, type Tone } from './run-facts';

export interface StepInspectorProps {
  workflow: Workflow;
  document: ArazzoDocument;
  run?: WorkflowRun;
  step?: Step;
  failedStepId?: string;
  /** Service names by id ("pastry2" → "API Pastry 2.0"). */
  serviceLabel?: (serviceId: string) => string | undefined;
  /** Thread currently traced by the lens. */
  lens?: string;
  onTrace: (expression: string) => void;
  onSelectFailed: () => void;
  onClose: () => void;
}


/** A circled status icon and a word, coloured by tone (the word carries the state). */
function Verdict({ tone, children, size = 13 }: { tone: Tone; children: ReactNode; size?: number }) {
  return (
    <span className="wf-ins-verdict" data-tone={tone}>
      <Icon name={STATUS_ICON[tone]} size={size} strokeWidth={2.2} />
      {children}
    </span>
  );
}

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

/** Side panel of the Loom: operation, result in the selected run, parameters, body, criteria, actions, outputs. */
export function StepInspector({ workflow, document, run, step, failedStepId, serviceLabel, lens, onTrace, onSelectFailed, onClose }: StepInspectorProps) {
  if (!step) {
    return (
      <aside aria-label="Step inspector" className="wf-inspector-empty">
        <span className="wf-inspector-empty-title">No step selected</span>
        <span>
          Select a step on the loom to inspect its operation, parameters, criteria, actions and outputs
          {run ? `, with the values resolved in run #${run.number}` : ''}.
        </span>
        {failedStepId && run ? (
          <Button size="sm" onClick={onSelectFailed}>
            Inspect the failed step of #{run.number}
          </Button>
        ) : null}
      </aside>
    );
  }

  const index = workflow.steps.indexOf(step) + 1;
  const result = run?.steps.find((r) => r.stepId === step.stepId);
  const source = document.sources.find((s) => s.name === step.sourceName);
  const linked = source?.link.status === 'linked' ? source.link : undefined;
  const service = linked ? serviceLabel?.(linked.serviceId) : undefined;
  const validate = run?.options.validateSchemas === true;
  const notRun = result?.status === 'not-run';
  const session = run?.origin.kind === 'session';
  const wrong = wrongValue(result);
  const box = result && run ? failureBox(step, result, run) : undefined;
  const threads = threadsOf(workflow, run);
  const attempts = result?.attempts ?? [];
  const { tone: status, word: statusWord } = stepStatusOf(result);
  const checks = run ? stepChecksOf(result, run) : [];

  const paramValue = (expr: string, name: string): { lead: string; text: string; tone?: 'bad' | 'idle' } => {
    if (!run || !result) return { lead: '', text: 'no run selected', tone: 'idle' };
    if (notRun) return { lead: '', text: 'not resolved: step not run', tone: 'idle' };
    const v = valueIn(expr, run);
    const shown = v === undefined ? (expr.startsWith('$') ? 'not resolved' : expr) : formatValue(v);
    if (wrong && wrong.param === name && wrong.expression === expr) return { lead: 'received', text: `"${wrong.got}" · expected ${shown}`, tone: 'bad' };
    return { lead: session ? 'received' : 'resolved', text: shown };
  };

  const bodyExprs = step.requestBody ? expressionsOf({ ...step, parameters: [] }) : [];
  const sent = result?.request?.body
    ? pretty(result.request.body)
    : step.requestBody && run && !notRun
      ? pretty(step.requestBody.replace(/"\{(\$[^}]+)\}"/g, (_, e: string) => JSON.stringify(valueIn(e, run) ?? null)))
      : undefined;
  const producedWhy = result?.status === 'failed' ? `not produced: ${step.stepId} failed${session ? ' the verification' : ''}` : notRun ? 'not run' : '';

  return (
    <aside aria-label="Step inspector" className="wf-step-inspector">
      <div className="wf-ins-head">
        <div className="wf-ins-title">
          <span className="wf-ins-n" aria-hidden="true">
            {index}
          </span>
          <h2 id="wf-ins-title" tabIndex={-1}>
            <span className="sr-only">Step {index}, </span>
            {step.stepId}
          </h2>
          <Button size="sm" iconOnly icon="close" aria-label="Close step inspector" className="wf-ins-close" onClick={onClose} />
        </div>
        <p className="wf-ins-desc">{step.description}</p>
        {linked ? (
          <Link to={`/services/${linked.serviceId}`} className="wf-ins-op">
            <MethodTag size="sm" method={step.method} protocol={linked.protocol} />
            <span className="wf-ins-path">{step.path}</span>
            {service ? <span className="wf-ins-service">{service}</span> : null}
          </Link>
        ) : (
          <span className="wf-ins-op">
            <MethodTag size="sm" method={step.method} protocol={source?.type === 'asyncapi' ? 'EVENT' : 'REST'} />
            <span className="wf-ins-path">{step.path}</span>
          </span>
        )}
        <span className="wf-ins-opref">
          operationId: $sourceDescriptions.{step.sourceName}.{step.operationId}
        </span>
      </div>

      <section className="wf-ins-section" aria-labelledby="wf-ins-result">
        <h3 id="wf-ins-result">
          Result{run ? <span className="wf-ins-meta"> · {runNoun(run)} · {originWord(run)}</span> : null}
        </h3>
        {!run ? (
          <p className="wf-ins-text">No run selected: the loom shows the definition only.</p>
        ) : (
          <>
            <span className="wf-ins-status">
              <Verdict tone={status} size={16}>
                {statusWord}
              </Verdict>
              {result && !notRun ? <span className="wf-ins-res">{stepResultLine(result)}</span> : null}
            </span>
            {checks.length ? (
              <div className="wf-ins-checks">
                {checks.map((c) => (
                  <span key={c.label} className="wf-ins-check">
                    <Icon name={STATUS_ICON[c.tone]} size={15} strokeWidth={2.2} data-tone={c.tone} />
                    <span>{c.label}</span>
                    <strong data-tone={c.tone}>{c.word}</strong>
                  </span>
                ))}
              </div>
            ) : null}
            {box ? (
              <div className="wf-ins-alert">
                <span className="wf-ins-alert-title">{box.title}</span>
                <span className="wf-ins-alert-detail">{box.detail}</span>
                {box.note ? <span className="wf-ins-alert-note">{box.note}</span> : null}
              </div>
            ) : null}
            {attempts.length > 1 ? (
              <ol aria-label="Attempts" className="wf-ins-attempts">
                {attempts.map((a) => (
                  <li key={a.n}>
                    <span className="wf-ins-attempt-n">
                      attempt {a.n} of {attempts.length}
                    </span>
                    <span className="wf-ins-attempt-when">{a.when}</span>
                    <span className="wf-ins-attempt-http">
                      {a.httpStatus} · {formatDuration(a.ms)}
                    </span>
                    {result?.status === 'failed' && result.schema.state === 'fail' ? (
                      <span className="wf-ins-attempt-verdict">
                        <Verdict tone="fail" size={12}>
                          criteria held · schema failed
                        </Verdict>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {notRun ? <p className="wf-ins-text">{notRunText(run)}</p> : null}
            {result ? <span className="wf-ins-http">{httpLine(step, result, run, wrong ? { [wrong.param]: wrong.got } : undefined)}</span> : null}
          </>
        )}
      </section>

      <section className="wf-ins-section" aria-labelledby="wf-ins-params">
        <h3 id="wf-ins-params" className="wf-ins-code-h">
          parameters <span className="wf-ins-count">{step.parameters.length}</span>
        </h3>
        {step.parameters.map((p) => {
          const v = paramValue(p.value, p.name);
          return (
            <div key={p.name} className="wf-ins-param">
              <span className="wf-ins-param-name">
                <span className="wf-ins-name">{p.name}</span>
                <span className="wf-ins-tag">in: {p.in}</span>
              </span>
              {p.value.startsWith('$') ? (
                <button type="button" className="wf-ins-expr" aria-pressed={lens === p.value} onClick={() => onTrace(p.value)} aria-label={`Trace ${p.value}`}>
                  {p.value}
                </button>
              ) : null}
              <span className="wf-ins-value" data-tone={v.tone}>
                {v.lead ? <span className="wf-ins-lead">{v.lead} </span> : null}
                {v.text}
              </span>
            </div>
          );
        })}
      </section>

      {step.requestBody ? (
        <section className="wf-ins-section" aria-labelledby="wf-ins-body">
          <h3 id="wf-ins-body" className="wf-ins-code-h">
            requestBody <span className="wf-ins-count">application/json</span>
          </h3>
          <div className="wf-ins-bodies">
            <div>
              <span className="wf-ins-lead">payload</span>
              <pre className="wf-ins-pre" data-tone="template">
                {pretty(step.requestBody)}
              </pre>
            </div>
            {sent && run ? (
              <div>
                <span className="wf-ins-lead">{session ? `sent by ${run.origin.kind === 'session' ? run.origin.app : ''} in ${attempts[0]?.when ?? 'its call'}` : `sent in run #${run.number}`}</span>
                <pre className="wf-ins-pre">{sent}</pre>
              </div>
            ) : null}
          </div>
          {bodyExprs.map((e) => (
            <span key={e} className="wf-ins-replace">
              <span className="wf-ins-lead">replacement</span>
              <span className="wf-ins-mono">{bodyPointer(step, e) ?? 'requestBody'}</span>
              <span className="wf-ins-lead">replaced by</span>
              <button type="button" className="wf-ins-expr" aria-pressed={lens === e} onClick={() => onTrace(e)} aria-label={`Trace ${e}`}>
                {e}
              </button>
            </span>
          ))}
        </section>
      ) : null}

      <section className="wf-ins-section" aria-labelledby="wf-ins-criteria">
        <h3 id="wf-ins-criteria" className="wf-ins-code-h">
          successCriteria <span className="wf-ins-count">{step.successCriteria.length}</span>
        </h3>
        {step.successCriteria.map((c) => {
          const ev = result?.criteria.find((x) => x.condition === c.condition);
          const tone: Tone = !ev ? 'off' : ev.held ? 'pass' : 'fail';
          return (
            <div key={c.condition} className="wf-ins-criterion">
              <span className="wf-ins-type">{c.type}</span>
              <span className="wf-ins-cond">{c.condition}</span>
              {run ? (
                <Verdict tone={tone} size={13}>
                  {!ev ? 'not evaluated' : ev.held ? 'held' : 'did not hold'}
                </Verdict>
              ) : null}
              {c.type === 'regex' ? <span className="wf-ins-context">context: {c.context}</span> : null}
            </div>
          );
        })}
        {validate && result?.status === 'failed' && result.schema.state === 'fail' && result.criteria.every((c) => c.held) ? (
          <span className="wf-ins-note">Every criterion held. The step failed on schema validation, which run #{run?.number} turned on.</span>
        ) : null}
      </section>

      <section className="wf-ins-section" aria-labelledby="wf-ins-actions">
        <h3 id="wf-ins-actions" className="wf-ins-code-h">
          onSuccess · onFailure
        </h3>
        {actionRows(workflow, step, result, run).map((a, i) => (
          <div key={i} className="wf-ins-action">
            <span className="wf-ins-action-line">
              <span className="wf-ins-lead">{a.when}</span>
              <span className="wf-ins-kind">{a.type}</span>
              <span>{a.text}</span>
            </span>
            {a.crit ? <span className="wf-ins-context">when {a.crit}</span> : null}
            {a.note ? (
              <span className="wf-ins-action-note" data-tone={a.noteTone}>
                {a.note}
              </span>
            ) : null}
          </div>
        ))}
      </section>

      <section className="wf-ins-section" aria-labelledby="wf-ins-outputs">
        <h3 id="wf-ins-outputs" className="wf-ins-code-h">
          outputs
        </h3>
        {step.outputs.length === 0 ? <span className="wf-ins-note">No output declared.</span> : null}
        {step.outputs.map((o) => {
          const expr = `$steps.${step.stepId}.outputs.${o.name}`;
          const value = result?.outputs[o.name];
          const missing = run !== undefined && value === undefined;
          const traced = threads.some((t) => t.expression === expr);
          return (
            <div key={o.name} className="wf-ins-output">
              <span className="wf-ins-name">{o.name}</span>
              <span className="wf-ins-oexpr">{o.expression}</span>
              <span className="wf-ins-output-row">
                <span className="wf-ins-value" data-tone={missing ? 'bad' : undefined}>
                  <span className="wf-ins-lead">resolved </span>
                  {!run ? 'no run selected' : missing ? `— ${producedWhy || 'not resolved'}` : formatValue(value)}
                </span>
                {traced ? (
                  <button type="button" className="wf-ins-trace" aria-pressed={lens === expr} onClick={() => onTrace(expr)}>
                    <Icon name="search" size={12} />
                    {lens === expr ? 'Tracing' : 'Trace on the loom'}
                  </button>
                ) : (
                  <span className="wf-ins-note">Not consumed by another step or output.</span>
                )}
              </span>
            </div>
          );
        })}
      </section>
    </aside>
  );
}
