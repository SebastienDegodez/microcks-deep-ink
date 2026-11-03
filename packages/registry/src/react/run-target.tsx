import type { HTMLAttributes } from 'react';
import { Chip } from './chip';

export type RunTargetKind = 'mocks' | 'implementations' | 'mixed';

export interface RunTargetProps extends HTMLAttributes<HTMLSpanElement> {
  target: RunTargetKind;
}

const WORD = { mocks: 'Mocks', implementations: 'Implementations', mixed: 'Mixed' } as const;

/** What a workflow run calls. Mixed is a proposal beyond the POC and says so. */
export function RunTarget({ target, className, ...rest }: RunTargetProps) {
  return (
    <span {...rest} className={['run-target', className].filter(Boolean).join(' ')} data-target={target}>
      {WORD[target]}
      {target === 'mixed' ? (
        <Chip tone="warning" variant="dashed">
          Proposed · beyond POC
        </Chip>
      ) : null}
    </span>
  );
}
