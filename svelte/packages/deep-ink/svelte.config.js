// Shared by @sveltejs/package, vite-plugin-svelte (tests), svelte-check and eslint-plugin-svelte. TypeScript in
// <script lang="ts"> is type-only, which Svelte 5 strips natively: no preprocessor.
export default {
  compilerOptions: { runes: true },
};
