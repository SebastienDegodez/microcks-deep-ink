import exampleSource0 from './Foundations/Colors.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { itemParams } from './_meta';
import Composition from './Foundations/Colors.svelte';

export default {
  title: 'Foundations/Colors',
  parameters: itemParams(['tokens'], 'Every token has a value in both themes. Switch the theme in the toolbar: names stay, values change. Text roles are at least 4.5:1 and control borders at least 3:1 on every ground (enforced by the tokens contrast test).', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: Composition, props: {} }) };
