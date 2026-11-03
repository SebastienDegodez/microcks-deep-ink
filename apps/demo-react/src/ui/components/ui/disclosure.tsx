// Deep Ink · disclosure@0.2.0 · copied from packages/registry. You own this file.
import type { DetailsHTMLAttributes, ReactNode } from 'react';

export interface DisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'open' | 'summary'> {
  summary: ReactNode;
  defaultOpen?: boolean;
}

/** Native <details>. Open state is exposed by the browser, so no ARIA is added. */
export function Disclosure({ summary, defaultOpen, className, children, ...rest }: DisclosureProps) {
  return (
    <details {...rest} className={['di-disclosure', className].filter(Boolean).join(' ')} open={defaultOpen || undefined}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
