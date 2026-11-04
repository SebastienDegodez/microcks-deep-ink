import type { WorkflowRun } from '@/domain/arazzo';
import { Icon } from '@/ui/components/ui/icon';
import { runPick } from './loom-model';

const WORD = { SUCCESS: 'Passed', FAILURE: 'Failed', RUNNING: 'Running' } as const;

/** "Results & values from" run picker shared by the Loom and Steps tabs: the last four runs, as pressed buttons. */
export function RunPicker({ runs, run, onPick, label, caption }: { runs: WorkflowRun[]; run?: WorkflowRun; onPick: (n: number) => void; label: string; caption?: string }) {
  if (runs.length === 0) return null;
  const shown = runs.slice(0, 4);
  if (run && !shown.some((r) => r.number === run.number)) shown.push(run);
  return (
    <div role="group" aria-label={label} className="wf-run-picker">
      {caption ? (
        <span className="wf-run-picker-caption" aria-hidden="true">
          {caption}
        </span>
      ) : null}
      {shown.map((r) => {
        const { label: n, target } = runPick(r);
        const on = r.number === run?.number;
        return (
          <button
            key={r.number}
            type="button"
            className="wf-run-pick"
            aria-pressed={on}
            aria-label={`Show run ${n}, ${target}, ${WORD[r.status]}`}
            data-status={r.status}
            onClick={() => onPick(r.number)}
          >
            <Icon name={r.status === 'SUCCESS' ? 'check-circle' : r.status === 'FAILURE' ? 'x-circle' : 'running'} size={13} strokeWidth={2.2} />
            {n}
            <span className="wf-run-pick-target">{target}</span>
          </button>
        );
      })}
    </div>
  );
}
