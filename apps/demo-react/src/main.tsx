import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createComposition } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createAppRouter } from '@/ui/app/router';
import { restoreTheme } from '@/ui/components/ui/theme-toggle.theme';
// Design-system styles first (tokens, base and every component, layered), then the demo shell's own CSS.
import '@microcks/deep-ink/styles.css';
import '@/ui/app/app.css';

restoreTheme();

const { useCases, clock } = createComposition();
const router = createAppRouter();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <UseCasesProvider useCases={useCases} clock={clock}>
      <RouterProvider router={router} />
    </UseCasesProvider>
  </StrictMode>,
);
