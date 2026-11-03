import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createComposition } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createAppRouter } from '@/ui/app/router';
import { restoreTheme } from '@/ui/components/ui/theme-toggle.theme';
import '@/ui/app/app.css';

// Design-system styles copied by the CLI (`deep-ink init` writes src/ui/styles/index.css).
// The glob keeps the build working before the copy; once the file exists it is bundled.
import.meta.glob('./ui/styles/index.css', { eager: true });

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
