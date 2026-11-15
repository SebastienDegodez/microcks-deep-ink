import { mount } from 'svelte';
import { restoreTheme } from '@microcks/deep-ink';
// Design-system styles first (tokens, base and every component, layered), then the demo shell's own CSS.
import '@microcks/deep-ink/styles.css';
import '@microcks/demo-styles/app/app.css';
import App from './ui/app/App.svelte';
import { createComposition } from './composition-root';
import { createAppRouter } from './ui/app/routes';

restoreTheme();

const { useCases, clock } = createComposition();

mount(App, { target: document.getElementById('root') as HTMLElement, props: { useCases, clock, router: createAppRouter() } });
