import type { WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { RunPicker } from '../RunPicker';
import { StepsTable } from '../StepsTable';
import { originWord } from '../run-facts';
import '@microcks/demo-styles/pages/workflow/tabs/steps.css';

export interface StepsTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  run?: WorkflowRun;
  onPickRun: (number: number) => void;
  inspectLink: (stepId: string) => string;
}

/** The Steps tab: the accessible table that carries the same information as the Loom. */
export function StepsTab({ detail, runs, run, onPickRun, inspectLink }: StepsTabProps) {
  const { workflow, document } = detail;
  const declared = workflow.steps.some((s) => s.dependsOn?.length);
  return (
    <section aria-labelledby="wf-steps-title" className="wf-steps-panel">
      <div className="wf-steps-head">
        <div className="wf-steps-title">
          <h2 id="wf-steps-title">{workflow.steps.length} steps</h2>
          <span className="wf-steps-sub">{run ? `Results from run #${run.number} · ${originWord(run)}` : 'Definition only, no run selected'}</span>
        </div>
        <RunPicker runs={runs} run={run} onPick={onPickRun} label="Show results from a run" />
      </div>
      <StepsTable workflow={workflow} document={document} run={run} loomLink={inspectLink} />
      <p className="wf-steps-foot">
        Steps run in list order
        {declared ? (
          <>
            , unless a step declares <code>dependsOn</code>: then the independent steps run in parallel and join at the step that depends on them
          </>
        ) : null}
        . An <code>onSuccess</code> <code>end</code> whose criteria hold ends the run early, with success. A failed step applies its first <code>onFailure</code> action
        whose criteria hold; when it still fails, the run ends and the later steps are not run. With "Validate each response against its OpenAPI schema" on, a
        response that does not conform to its schema fails the step even when its criteria hold.
      </p>
    </section>
  );
}
