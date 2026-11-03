import type { HTMLAttributes } from 'react';

export type RunOriginKind = 'ui' | 'api' | 'mock-url' | 'session';

export interface RunOriginProps extends HTMLAttributes<HTMLSpanElement> {
  origin: RunOriginKind;
  /** Shown with the session origin, e.g. "s-7f3a2c91". */
  sessionId?: string;
}

const WORD = { ui: 'UI', api: 'API', 'mock-url': 'Mock URL', session: 'Session' } as const;

/** Where a run was launched from. */
export function RunOrigin({ origin, sessionId, className, ...rest }: RunOriginProps) {
  return (
    <span {...rest} className={['di-run-origin', className].filter(Boolean).join(' ')} data-origin={origin}>
      {WORD[origin]}
      {origin === 'session' && sessionId ? <code>{sessionId}</code> : null}
    </span>
  );
}
