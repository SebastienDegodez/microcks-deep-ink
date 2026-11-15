import exampleSource0 from './Foundations/Icons.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { itemParams } from './_meta';
import Composition from './Foundations/Icons.svelte';

export default {
  title: 'Foundations/Icons',
  parameters: itemParams(['icon'], 'Inline stroke icons, 2px stroke, `currentColor`. Hidden from assistive technology next to text; pass `label` to make one meaningful. No emoji.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: Composition, props: {} }) };

export const Meaningful: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'With a label', render: () => ({ Component: Composition, props: { meaningful: true } }) };
