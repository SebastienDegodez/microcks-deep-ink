import '@microcks/demo-styles/app/StepStrip.css';
import type { StepStatus } from '@/domain/arazzo';
import { stepStripAlt } from '@/domain/arazzo';

const GLYPH: Record<StepStatus, string> = { passed: '✓', failed: '✕', 'not-run': '–' };

/**
 * Mini strip of the steps of a run: one cell per step with a glyph, so the status is never color only.
 * The whole strip is one image with a text alternative ("4 steps: passed, passed, failed, not run").
 */
export function StepStrip({ statuses, count, never }: { statuses?: readonly StepStatus[]; count: number; never?: boolean }) {
  const list = statuses ?? Array.from({ length: count }, () => 'not-run' as const);
  const alt = never ? `${count} ${count === 1 ? 'step' : 'steps'}, never run` : stepStripAlt(list);
  return (
    <span role="img" aria-label={alt} className="wf-strip" data-never={never ? '' : undefined}>
      {list.map((status, i) => (
        <span key={i} className="wf-strip-cell" data-status={never ? 'never' : status} aria-hidden="true">
          {never ? '' : GLYPH[status]}
        </span>
      ))}
    </span>
  );
}
