import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { LoadingBlock } from '@/ui/app/states';
import type { LoomProps } from './loom-model';

/**
 * The only door to the copied `WorkflowLoom` element wrapper (`src/ui/components/ui/workflow-loom.tsx`).
 *
 * The wrapper is an element item copied by the CLI after the Web Component bundles are built (gate 2).
 * Until it exists, `import.meta.glob` matches nothing and the page shows the `fallback` (the accessible steps
 * table) instead of failing the build. Once the file is copied, the Loom appears with no code change.
 *
 * Plan 3.4 API: props `sources, steps, threads, inputs, outputs, validatesSchemas, selectedStep, label` and the
 * event `onStepSelect`. The handler is tolerant to receive `{ stepId }`, a bare id or a CustomEvent.
 */
type WrapperProps = LoomProps & { onStepSelect?: (event: unknown) => void; onLensSelect?: (event: unknown) => void };

const loaders = import.meta.glob('../../components/ui/workflow-loom.tsx') as Record<string, () => Promise<{ WorkflowLoom: ComponentType<WrapperProps> }>>;
const loader = Object.values(loaders)[0];
const RemoteLoom = loader ? lazy(() => loader().then((m) => ({ default: m.WorkflowLoom }))) : undefined;

export const LOOM_AVAILABLE = RemoteLoom !== undefined;

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
  if (!RemoteLoom) return <>{fallback}</>;
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
