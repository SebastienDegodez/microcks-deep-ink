// The design system is the linked @microcks/deep-ink package, built in another workspace with its own node_modules.
// vite.config.ts dedupes react: a second React would break every hook ("Invalid hook call").
import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CopyButton, WorkflowLoom } from '@microcks/deep-ink';

describe('design system package', () => {
  it('shares the app React: a package component with hooks renders inside an app component with hooks', () => {
    function Host() {
      const [n] = useState(1);
      return <CopyButton value={`copy ${n}`} label="Copy the URL" />;
    }
    render(<Host />);
    expect(screen.getByRole('button', { name: 'Copy the URL' })).toBeTruthy();
  });

  it('resolves the lazy @microcks/deep-ink/workflow-loom subpath (LoomHost) to the package instance', async () => {
    const viaSubpath = await import('@microcks/deep-ink/workflow-loom');
    expect(viaSubpath.WorkflowLoom).toBe(WorkflowLoom);
  });
});
