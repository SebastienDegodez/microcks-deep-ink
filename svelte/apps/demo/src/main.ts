import { mount } from 'svelte';
import '@microcks/deep-ink/styles.css';
import './demo.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing demo mount point');
mount(App, { target });
