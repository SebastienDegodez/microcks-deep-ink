import { render } from 'svelte/server';
import { writeFileSync } from 'node:fs';
import Matrix from './Matrix.svelte';
const { body } = render(Matrix);
writeFileSync('.artifacts/svelte.html', `<!doctype html><html lang="en"><head><link rel="stylesheet" href="common.css"></head><body>${body}</body></html>`);
