import { Link } from 'react-router';
import { criteriaText, type ArazzoDocument, type Action, type Step, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { STATUS_ICON } from '@/ui/app/outcomes';
import { Button, Icon, MethodTag, DataTable, type DataTableColumn } from '@microcks/deep-ink';
import { effectiveDependencies, stepResultLine } from './loom-model';
import { stepChecksOf, stepStatusOf } from './run-facts';

interface Row {
  n: number;
  step: Step;
  depends: string[];
}

export interface StepsTableProps {
  workflow: Workflow;
  document: ArazzoDocument;
  run?: WorkflowRun;
  /** Link "On the loom" per row. */
  loomLink?: (stepId: string) => string;
}


const describe = (a: Action) => (a.type === 'retry' ? `retry every ${a.retryAfter} s, up to ${a.retryLimit} ${a.retryLimit === 1 ? 'time' : 'times'}` : 'end the workflow');

/** The actions of a step in words, as the Steps table writes them. */
function actionTexts(step: Step): { text: string; muted?: boolean }[] {
  const out = [
    ...step.onSuccess.map((a) => ({ text: `On success: ${describe(a)}${a.criteria?.length ? ` when ${criteriaText(a.criteria)}` : ''}` })),
    ...step.onFailure.map((a) => ({ text: `On failure: ${describe(a)}${a.criteria?.length ? ` when ${criteriaText(a.criteria)}` : ''}` })),
  ];
  return out.length ? out : [{ text: 'Next step · ends the run on failure', muted: true }];
}

/**
 * The Steps table: the accessible equivalent of the Loom (n°, stepId, Operation, Success criteria, Actions,
 * Outputs, Result in the selected run, On the loom). dependsOn is shown only when a step declares it.
 */
export function StepsTable({ workflow, document, run, loomLink }: StepsTableProps) {
  const deps = effectiveDependencies(workflow.steps);
  const declared = workflow.steps.some((s) => s.dependsOn?.length);
  const rows: Row[] = workflow.steps.map((step, i) => ({ n: i + 1, step, depends: deps[i] ?? [] }));
  const opRef = (step: Step) => `$sourceDescriptions.${step.sourceName}.${step.operationId}`;

  const columns: DataTableColumn<Row>[] = [
    { key: 'n', header: 'n°', mono: true, render: ({ n }) => <span className="wf-st-strong">{n}</span> },
    {
      key: 'step',
      header: 'stepId',
      render: ({ step, depends }) => (
        <span className="wf-st-stack">
          <span className="wf-st-id">{step.stepId}</span>
          <span className="wf-st-desc">{step.description}</span>
          {declared ? <span className="wf-st-desc">dependsOn: {depends.length ? depends.join(', ') : 'none, starts at once'}</span> : null}
        </span>
      ),
    },
    {
      key: 'op',
      header: 'Operation',
      render: ({ step }) => {
        const src = document.sources.find((s) => s.name === step.sourceName);
        const link = src?.link.status === 'linked' ? src.link : undefined;
        return (
          <span className="wf-st-stack">
            <span className="wf-st-op">
              <MethodTag size="xs" method={step.method} protocol={link?.protocol ?? (src?.type === 'asyncapi' ? 'EVENT' : 'REST')} />
              {link ? (
                <Link to={`/services/${link.serviceId}`} className="wf-st-path">
                  {step.path}
                </Link>
              ) : (
                <span className="wf-st-path">{step.path}</span>
              )}
            </span>
            <span className="wf-st-opref">{opRef(step)}</span>
          </span>
        );
      },
    },
    {
      key: 'criteria',
      header: 'Success criteria',
      render: ({ step }) => (
        <span className="wf-st-stack">
          {step.successCriteria.map((c) => (
            <span key={c.condition} className="wf-st-crit">
              {c.condition}
              {c.type === 'regex' ? <span className="wf-st-muted"> (regex on {c.context})</span> : null}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: ({ step }) => (
        <span className="wf-st-stack">
          {actionTexts(step).map((a) => (
            <span key={a.text} className="wf-st-act" data-muted={a.muted ? '' : undefined}>
              {a.text}
            </span>
          ))}
        </span>
      ),
    },
    { key: 'outputs', header: 'Outputs', render: ({ step }) => <span className="wf-st-outs">{step.outputs.length ? step.outputs.map((o) => o.name).join(', ') : '—'}</span> },
    {
      key: 'result',
      header: run ? `Result in #${run.number}` : 'Result',
      render: ({ step }) => {
        if (!run) return <span className="wf-st-muted">No run selected</span>;
        const result = run.steps.find((r) => r.stepId === step.stepId);
        const status = stepStatusOf(result);
        return (
          <span className="wf-st-stack">
            <span className="wf-st-status" data-tone={status.tone}>
              <Icon name={STATUS_ICON[status.tone]} size={13} strokeWidth={2.2} />
              {status.word}
            </span>
            {stepChecksOf(result, run).map((c) => (
              <span key={c.label} className="wf-st-check">
                <Icon name={STATUS_ICON[c.tone]} size={12} strokeWidth={2.2} data-tone={c.tone} />
                {c.label} <span data-tone={c.tone}>{c.word}</span>
              </span>
            ))}
            {result && result.status !== 'not-run' ? <span className="wf-st-res">{stepResultLine(result)}</span> : null}
          </span>
        );
      },
    },
  ];
  if (loomLink) {
    columns.push({
      key: 'inspect',
      header: 'Inspect',
      headerHidden: true,
      align: 'end',
      render: ({ step }) => (
        <Button asChild size="sm" className="wf-st-inspect">
          <Link to={loomLink(step.stepId)} aria-label={`Show ${step.stepId} on the loom`}>
            On the loom
          </Link>
        </Button>
      ),
    });
  }

  return (
    <div className="wf-st-scroll">
      <DataTable<Row>
        caption={`${workflow.steps.length} steps of ${workflow.workflowId}${run ? `, results of run #${run.number}` : ', definition only'}`}
        captionHidden
        headerCase="sentence"
        rowTone={({ step }) => {
          const st = run?.steps.find((r) => r.stepId === step.stepId)?.status;
          return st === 'failed' ? 'failed' : st === 'not-run' ? 'idle' : undefined;
        }}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.step.stepId}
      />
    </div>
  );
}
