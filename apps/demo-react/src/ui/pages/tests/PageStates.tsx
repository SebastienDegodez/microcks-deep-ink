import './page-kit.css';
import { NotFoundError } from '@/application/shared';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Skeleton } from '@/ui/components/ui/skeleton';

/** Loading placeholder: `aria-busy`, and a polite status for assistive technology. */
export function LoadingBlock({ label, lines = 5 }: { label: string; lines?: number }) {
  return (
    <div aria-busy="true" className="demo-loading">
      <p role="status" className="sr-only">
        Loading {label}
      </p>
      <Skeleton lines={lines} />
    </div>
  );
}

/** Error state with a retry. An unknown entity gets its own wording. */
export function ErrorBlock({ error, what, onRetry }: { error: Error; what: string; onRetry?: () => void }) {
  if (error instanceof NotFoundError) {
    return (
      <EmptyState title={`${what} not found`} headingLevel={2}>
        <p>{error.message}.</p>
      </EmptyState>
    );
  }
  return (
    <Callout
      tone="danger"
      title={`${what} could not be loaded`}
      live="assertive"
      actions={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}
    >
      <p>{error.message}</p>
    </Callout>
  );
}
