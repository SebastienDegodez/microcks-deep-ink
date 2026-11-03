// Deep Ink · kbd@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd {...rest} className={['kbd', className].filter(Boolean).join(' ')} />;
}
