import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createComposition, parseBackend } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createAppRouter } from '@/ui/app/router';
import { restoreTheme } from '@microcks/deep-ink';
// Design-system styles first (tokens, base and every component, layered), then the demo shell's own CSS.
import '@microcks/deep-ink/styles.css';
import '@/ui/app/app.css';

restoreTheme();

// `http` (answered by the MSW worker) unless the build sets VITE_DEMO_BACKEND=memory.
const backend = parseBackend(import.meta.env.VITE_DEMO_BACKEND, 'http');

async function boot(): Promise<void> {
  // With `http`, the first render waits for the mock worker: no `/api/` request may leave before it intercepts.
  // The test reads the env value itself (not `backend`) so Vite folds it and the `memory` build drops MSW entirely.
  if (import.meta.env.VITE_DEMO_BACKEND !== 'memory') {
    const { startWorker } = await import('@/infrastructure/msw/browser');
    await startWorker();
  }
  const { useCases, clock } = createComposition({ backend });
  const router = createAppRouter();

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <UseCasesProvider useCases={useCases} clock={clock}>
        <RouterProvider router={router} />
      </UseCasesProvider>
    </StrictMode>,
  );
}

void boot();
