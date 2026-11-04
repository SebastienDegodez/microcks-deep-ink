import './states.css';
import { NotFoundError } from '@/application/shared';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Skeleton } from '@/ui/components/ui/skeleton';

/**
 * Loading placeholder: `aria-busy`, and a polite status "Loading {label}" for assistive technology.
 * `lines` draws one block of lines; `rows` draws that many two-line blocks, spaced (workflow pages).
 */
export function LoadingBlock({ label, lines = 5, rows }: { label: string; lines?: number; rows?: number }) {
  return (
    <div aria-busy="true" className={rows === undefined ? 'demo-loading' : 'wf-loading'}>
      <p role="status" className="sr-only">
        Loading {label}
      </p>
      {rows === undefined ? (
        <Skeleton lines={lines} />
      ) : (
        Array.from({ length: rows }, (_, i) => <Skeleton key={i} lines={2} />)
      )}
    </div>
  );
}

/**
 * Error state. With `what`: "{what} could not be loaded" and a Retry button, and an unknown entity
 * (`NotFoundError`) gets its own wording. With `title` (or neither): that title and a "Try again" button.
 */
export function ErrorBlock({ error, what, title = 'Something went wrong', onRetry }: { error: Error; what?: string; title?: string; onRetry?: () => void }) {
  if (what === undefined) {
    return (
      <Callout
        tone="danger"
        title={title}
        live="assertive"
        actions={onRetry ? <Button size="sm" icon="retry" onClick={onRetry}>Try again</Button> : undefined}
      >
        {error.message}
      </Callout>
    );
  }
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
