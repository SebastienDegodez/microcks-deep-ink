import { defineConfig } from 'vitest/config';

// Build and CSS checks (node). The React specs run in react/packages/deep-ink.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
