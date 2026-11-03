import type { HTMLAttributes } from 'react';

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd {...rest} className={['di-kbd', className].filter(Boolean).join(' ')} />;
}
