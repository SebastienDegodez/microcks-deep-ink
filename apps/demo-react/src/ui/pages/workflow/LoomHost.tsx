import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { LoadingBlock } from '@/ui/app/states';
import type { LoomProps } from './loom-model';

/**
 * The only door to the `WorkflowLoom` element wrapper, loaded lazily from the `@microcks/deep-ink/workflow-loom` subpath
 * (its own chunk with the `<workflow-loom>` Web Component; `import('@microcks/deep-ink')` would not split, the barrel is
 * imported statically). While it loads the page shows a loading block; if it fails to load or render, the `fallback`
 * (the accessible steps table).
 *
 * Plan 3.4 API: props `sources, steps, threads, inputs, outputs, validatesSchemas, selectedStep, label` and the
 * event `onStepSelect`. The handler is tolerant to receive `{ stepId }`, a bare id or a CustomEvent.
 */
type WrapperProps = LoomProps & { onStepSelect?: (event: unknown) => void; onLensSelect?: (event: unknown) => void };

const RemoteLoom = lazy(() =>
  import('@microcks/deep-ink/workflow-loom').then((m) => ({ default: m.WorkflowLoom as ComponentType<WrapperProps> })),
);

/** The stepId of a select event; `{ stepId: undefined }` (the selected step pressed again) gives undefined. */
export function stepIdOf(event: unknown): string | undefined {
  if (typeof event === 'string') return event;
  const direct = (event as { stepId?: unknown } | null)?.stepId;
  if (typeof direct === 'string') return direct;
  const detail = (event as { detail?: { stepId?: unknown } } | null)?.detail?.stepId;
  return typeof detail === 'string' ? detail : undefined;
}

class LoomBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WorkflowLoom failed to render, showing the steps table instead.', error, info.componentStack);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function lensIdOf(event: unknown): string | undefined {
  const direct = event as { id?: unknown; detail?: { id?: unknown } } | null;
  const id = direct?.id ?? direct?.detail?.id;
  return typeof id === 'string' ? id : undefined;
}

export interface LoomHostProps extends LoomProps {
  /** Called with the selected stepId, or undefined when the selected step is pressed again. */
  onSelectStep: (stepId: string | undefined) => void;
  /** Called with the traced thread id (its expression), or undefined when the lens is cleared. */
  onSelectLens?: (id: string | undefined) => void;
  /** Accessible equivalent shown when the Loom is not available. */
  fallback: ReactNode;
}

export function LoomHost({ onSelectStep, onSelectLens, fallback, ...props }: LoomHostProps) {
  return (
    <LoomBoundary fallback={fallback}>
      <Suspense fallback={<LoadingBlock label="the loom" rows={1} />}>
        <RemoteLoom
          {...props}
          onStepSelect={(event) => onSelectStep(stepIdOf(event))}
          onLensSelect={(event) => onSelectLens?.(lensIdOf(event))}
        />
      </Suspense>
    </LoomBoundary>
  );
}
