import exampleSource0 from './Foundations/FocusAndMotion.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { itemParams } from './_meta';
import Composition from './Foundations/FocusAndMotion.svelte';

export default {
  title: 'Foundations/Focus and motion',
  parameters: itemParams(['base'], 'One focus ring for the whole system (`:focus-visible`, action outline plus the focus shadow). Transitions and animations are neutralised under `prefers-reduced-motion: reduce`. Helpers: `.sr-only`, `.skip-link`, `.stack`, `.inline`.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Focus ring', render: () => ({ Component: Composition, props: {} }) };

export const Helpers: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: Composition, props: { helpers: true } }) };
