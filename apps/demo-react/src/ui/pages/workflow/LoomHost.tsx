import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { LoadingBlock } from '../workflows/shared';
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
type WrapperProps = LoomProps & { onStepSelect?: (event: unknown) => void };

const loaders = import.meta.glob('../../components/ui/workflow-loom.tsx') as Record<string, () => Promise<{ WorkflowLoom: ComponentType<WrapperProps> }>>;
const loader = Object.values(loaders)[0];
const RemoteLoom = loader ? lazy(() => loader().then((m) => ({ default: m.WorkflowLoom }))) : undefined;

export const LOOM_AVAILABLE = RemoteLoom !== undefined;

function stepIdOf(event: unknown): string | undefined {
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

export interface LoomHostProps extends LoomProps {
  onSelectStep: (stepId: string) => void;
  /** Accessible equivalent shown when the Loom is not available. */
  fallback: ReactNode;
}

export function LoomHost({ onSelectStep, fallback, ...props }: LoomHostProps) {
  if (!RemoteLoom) return <>{fallback}</>;
  return (
    <LoomBoundary fallback={fallback}>
      <Suspense fallback={<LoadingBlock label="Loading the loom" rows={1} />}>
        <RemoteLoom
          {...props}
          onStepSelect={(event) => {
            const id = stepIdOf(event);
            if (id) onSelectStep(id);
          }}
        />
      </Suspense>
    </LoomBoundary>
  );
}
