import type { ReactNode } from 'react';

/** One numbered fieldset of the test form: "01 Target", "02 Test runner"… */
export function FormSection({ step, title, hint, gap, children }: { step: string; title: string; hint?: string; gap?: '12'; children: ReactNode }) {
  return (
    <fieldset className="tc-section" data-gap={gap}>
      <legend>
        <span className="tc-step">{step}</span>
        {title}
        {hint ? <span className="tc-legend-hint">{hint}</span> : null}
      </legend>
      {children}
    </fieldset>
  );
}
