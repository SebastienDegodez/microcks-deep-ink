import type { CSSProperties } from 'react';
import type { ArazzoDocument, Workflow, WorkflowRun } from '@/domain/arazzo';
import { thumbnail } from './thumbnail';
export { sourceColor } from './thumbnail';

/**
 * Loom thumbnail of a workflow: one lane per source, one dot per step coloured by the result of the run
 * (passed, failed, not reached, never run). Steps that `dependsOn` earlier steps join parallel branches.
 * Drawn as one image with a text alternative ("4 steps on 1 lane (apiPastry). Run #14: listPastries passed, …").
 */
export function LoomThumb({ workflow, document, run }: { workflow: Workflow; document: ArazzoDocument; run?: WorkflowRun }) {
  const { disabled, lanes, links, dots, width, height, label } = thumbnail(workflow, document, run);

  return (
    <span role="img" aria-label={label} className="wf-loom-thumb" style={{ width, height }}>
      {lanes.map((l, i) => (
        <span
          key={`l${i}`}
          aria-hidden="true"
          className="wf-loom-lane"
          data-dashed={l.dashed ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          style={{ top: l.top, width: l.width, '--lane': l.color } as CSSProperties}
        />
      ))}
      {links.map((l, i) => (
        <span key={`k${i}`} aria-hidden="true" className="wf-loom-link" style={{ left: l.left, top: l.top, height: l.height }} />
      ))}
      {dots.map((d, i) => (
        <span key={`d${i}`} aria-hidden="true" className="wf-loom-dot" data-state={d.state} style={{ left: d.left, top: d.top }} />
      ))}
    </span>
  );
}
