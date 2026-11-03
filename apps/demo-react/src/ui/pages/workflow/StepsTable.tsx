import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { actionLabel, actionsOf, describeAction, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { StepChecks, StepStatus } from '@/ui/components/ui/step-status';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { buildLoomProps, effectiveDependencies, expressionsOf, type LoomStep } from './loom-model';
import type { ArazzoDocument } from '@/domain/arazzo';

interface Row {
  n: number;
  step: Workflow['steps'][number];
  loom: LoomStep;
  depends: string[];
}

export interface StepsTableProps {
  workflow: Workflow;
  document: ArazzoDocument;
  run?: WorkflowRun;
  /** Link "On the loom" per row. */
  loomLink?: (stepId: string) => string;
  /** Caption; the table is the text equivalent of the Loom. */
  caption?: ReactNode;
}

/**
 * The Steps table: the accessible equivalent of the Loom. Same columns as the Loom's own table toggle
 * (#, Step, Source, Operation, Depends on, Status, Checks, Actions) plus the data each step reads and keeps.
 */
export function StepsTable({ workflow, document, run, loomLink }: StepsTableProps) {
  const loom = buildLoomProps(workflow, document, run, undefined);
  const deps = effectiveDependencies(workflow.steps);
  const rows: Row[] = workflow.steps.map((step, i) => ({ n: i + 1, step, loom: loom.steps[i] as LoomStep, depends: deps[i] ?? [] }));
  const declared = workflow.steps.some((s) => s.dependsOn?.length);
  const sourceOf = (name: string) => {
    const s = document.sources.find((x) => x.name === name);
    return `${name} · ${s?.type ?? 'openapi'}${s?.link.status === 'not-linked' ? ' · not linked' : ''}`;
  };

  const columns: DataTableColumn<Row>[] = [
    { key: 'n', header: '#', align: 'end' },
    {
      key: 'step',
      header: 'Step',
      render: ({ step }) => (
        <span className="wf-cell-stack wf-cell-wide">
          <code>{step.stepId}</code>
          <span className="wf-small wf-muted">{step.description}</span>
        </span>
      ),
    },
    { key: 'source', header: 'Source', render: ({ step }) => <span className="wf-cell-stack">{sourceOf(step.sourceName)}</span> },
    {
      key: 'op',
      header: 'Operation',
      render: ({ step }) => (
        <span className="wf-cell-stack">
          <span className="wf-row">
            <MethodTag method={step.method} protocol={document.sources.find((s) => s.name === step.sourceName)?.type === 'asyncapi' ? 'EVENT' : 'REST'} />
            <code>{step.path}</code>
          </span>
          <span className="wf-small wf-muted">{step.operationId}</span>
        </span>
      ),
    },
    {
      key: 'depends',
      header: 'Depends on',
      render: ({ depends }) => (
        <span className="wf-cell-stack">{depends.length ? depends.join(', ') : declared ? 'none, starts at once' : 'none, first step'}</span>
      ),
    },
    {
      key: 'status',
      header: run ? `Status in run #${run.number}` : 'Status',
      render: ({ loom: l }) =>
        l.status ? (
          <StepStatus status={l.status} attempts={l.attempts} />
        ) : (
          <span className="wf-small wf-muted">No run selected</span>
        ),
    },
    {
      key: 'checks',
      header: 'Checks',
      render: ({ loom: l }) =>
        l.checks ? <StepChecks successCriteria={l.checks.successCriteria} schemaValidation={l.checks.schemaValidation} /> : <span className="wf-small wf-muted">—</span>,
    },
    {
      key: 'criteria',
      header: 'Success criteria',
      render: ({ step }) => (
        <ul className="wf-list wf-cell-wide">
          {step.successCriteria.map((c) => (
            <li key={c.condition}>
              <code>{c.condition}</code> {c.type === 'regex' ? <span className="wf-small wf-muted">(regex on {c.context})</span> : null}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: ({ step, loom: l }) => {
        const all = actionsOf(step);
        if (all.length === 0) return <span className="wf-small wf-muted">none</span>;
        return (
          <ul className="wf-list wf-cell-wide">
            {all.map(({ when, action }) => {
              const state = l.actions?.find((a) => a.name === action.name);
              const happened = state && ('taken' in state ? state.taken : (state as { applied?: boolean }).applied);
              return (
                <li key={`${when}-${action.name}`}>
                  <span className="wf-small wf-muted">{when}</span> <code>{actionLabel(action)}</code>
                  <span className="wf-small wf-muted"> · {describeAction(action)}</span>
                  {happened ? <strong> · {action.type === 'retry' ? 'applied' : 'taken'}</strong> : null}
                </li>
              );
            })}
          </ul>
        );
      },
    },
    {
      key: 'data',
      header: 'Data read and kept',
      render: ({ step }) => {
        const reads = expressionsOf(step);
        return (
          <span className="wf-cell-stack wf-cell-wide">
            {reads.length ? (
              <span>
                <span className="wf-small wf-muted">reads </span>
                {reads.map((r) => (
                  <code key={r} className="wf-expr">
                    {r}
                  </code>
                ))}
              </span>
            ) : null}
            {step.outputs.length ? (
              <span>
                <span className="wf-small wf-muted">keeps </span>
                {step.outputs.map((o) => o.name).join(', ')}
              </span>
            ) : null}
            {!reads.length && !step.outputs.length ? <span className="wf-small wf-muted">—</span> : null}
          </span>
        );
      },
    },
  ];
  if (loomLink) {
    columns.push({
      key: 'inspect',
      header: 'Inspect',
      render: ({ step }) => (
        <RouterLink className="di-link" to={loomLink(step.stepId)} aria-label={`Inspect ${step.stepId} on the loom`}>
          On the loom
        </RouterLink>
      ),
    });
  }

  return (
    <DataTable<Row>
      caption={`${workflow.steps.length} steps of ${workflow.workflowId}${run ? `, results of run #${run.number}` : ', definition only'}`}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.step.stepId}
    />
  );
}

