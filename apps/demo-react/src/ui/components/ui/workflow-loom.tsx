// The Deep Ink components come from the @microcks/deep-ink package (see vite.config.ts: every
// `@/ui/components/ui/<item>` import resolves to it). This one file stays because LoomHost loads the Loom lazily
// with `import.meta.glob('../../components/ui/workflow-loom.tsx')`, which only matches a real file.
export { WorkflowLoom } from '@microcks/deep-ink';
