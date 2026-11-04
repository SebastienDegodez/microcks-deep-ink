import { defineConfig } from 'vite';

// Library build: ESM only, one output module per source module (consumers tree-shake by file), React external.
// The element bundles (src/elements/*.js, synced from packages/core) are emitted as dist/elements/*.js.
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    lib: { entry: 'src/index.ts', formats: ['es'] },
    rolldownOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
  },
});
