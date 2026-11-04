import type { HTMLAttributes, ReactNode } from 'react';

export interface StepperStep {
  label: ReactNode;
  /** `progress` only. Default `upcoming`. */
  state?: 'done' | 'current' | 'upcoming';
  /** Shown number; defaults to the position (1, 2, 3). */
  n?: ReactNode;
  id?: string;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  /** Accessible name of the list ("Progress", "Before you paste"). Optional: leave it out when the heading above names the list. */
  label?: string;
  steps: StepperStep[];
  /** `progress` (default): numbered dots. `list`: numbered instructions. */
  variant?: 'progress' | 'list';
  /** `progress` only: stack the steps. */
  direction?: 'horizontal' | 'vertical';
  /** Hidden word read after a done step (default "done"). */
  doneLabel?: string;
  /** `list` only. `number` (default): a mono "1.". `circle`: the number in a 22px ring (--stepper-marker, default --proto-rest), 10px gap, 6px rows, the text stacked in a column in the inherited font (WorkflowRun plan). */
  marker?: 'number' | 'circle';
}

/** Numbered steps in an `<ol>`; the current step has `aria-current="step"`. */
export function Stepper({ label, steps, variant = 'progress', direction = 'horizontal', doneLabel = 'done', marker = 'number', className, ...rest }: StepperProps) {
  return (
    <ol
      {...rest}
      aria-label={label}
      className={['stepper', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-direction={direction === 'vertical' ? 'vertical' : undefined}
      data-marker={variant === 'list' && marker === 'circle' ? 'circle' : undefined}
    >
      {steps.map((s, i) => {
        const n = s.n ?? i + 1;
        if (variant === 'list') {
          return (
            <li key={s.id ?? i}>
              <span className="stepper-n" aria-hidden="true">{n}{marker === 'circle' ? null : '.'}</span>
              <span>{s.label}</span>
            </li>
          );
        }
        const state = s.state ?? 'upcoming';
        return (
          <li key={s.id ?? i} data-state={state === 'done' ? 'done' : undefined} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="stepper-dot">{n}</span>
            {s.label}
            {state === 'done' ? <span className="sr-only">, {doneLabel}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
