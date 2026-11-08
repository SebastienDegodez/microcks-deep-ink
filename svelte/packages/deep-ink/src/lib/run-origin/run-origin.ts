import type { HTMLAttributes } from 'svelte/elements';
import type { NativeHandlers } from '../event-props';
export type RunOriginKind = 'ui' | 'api' | 'mock-url' | 'session';
export type RunOriginProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    NativeHandlers<HTMLSpanElement> & {
    origin: RunOriginKind;
    /** Shown with the session origin, e.g. "s-7f3a2c91". */
    sessionId?: string;
    class?: string;
  };
