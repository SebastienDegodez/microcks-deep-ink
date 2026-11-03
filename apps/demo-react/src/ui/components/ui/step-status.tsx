// Deep Ink · step-status@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export type StepOutcome = 'passed' | 'failed' | 'not-run';
export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface StepStatusProps extends HTMLAttributes<HTMLSpanElement> {
  status: StepOutcome;
  attempts?: number;
}

const STEP = {
  passed: { icon: 'check', word: 'Passed' },
  failed: { icon: 'cross', word: 'Failed' },
  'not-run': { icon: 'dash', word: 'Not run' },
} as const;

/** "✓ Passed", "✕ Failed · 3 attempts", "– Not run". */
export function StepStatus({ status, attempts, className, ...rest }: StepStatusProps) {
  const s = STEP[status];
  const showAttempts = attempts !== undefined && attempts > 0 && (attempts > 1 || status === 'failed');
  return (
    <span {...rest} className={['step-status', className].filter(Boolean).join(' ')} data-status={status}>
      <Icon name={s.icon} size={14} />
      <span>{s.word}</span>
      {showAttempts ? (
        <span className="step-status-attempts">
          · {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
        </span>
      ) : null}
    </span>
  );
}

export interface StepChecksProps extends HTMLAttributes<HTMLUListElement> {
  successCriteria: CheckState;
  /** Omit when the run does not validate schemas. */
  schemaValidation?: CheckState;
}

const CHECK = {
  passed: { icon: 'check', word: 'Passed' },
  failed: { icon: 'cross', word: 'Failed' },
  off: { icon: 'dash', word: 'Off' },
  'not-evaluated': { icon: 'circle', word: 'Not evaluated' },
} as const;

function Check({ label, state }: { label: string; state: CheckState }) {
  const c = CHECK[state];
  return (
    <li data-state={state}>
      <span>{label}</span>
      <span className="sr-only">:</span>
      {' '}
      <span className="checks-state">
        <Icon name={c.icon} size={14} />
        {c.word}
      </span>
    </li>
  );
}

/** The two checks of a step, written separately: a 200 that breaks the schema still fails the step. */
export function StepChecks({ successCriteria, schemaValidation, className, ...rest }: StepChecksProps) {
  return (
    <ul {...rest} className={['checks', className].filter(Boolean).join(' ')}>
      <Check label="Success criteria" state={successCriteria} />
      {schemaValidation ? <Check label="Schema validation" state={schemaValidation} /> : null}
    </ul>
  );
}
