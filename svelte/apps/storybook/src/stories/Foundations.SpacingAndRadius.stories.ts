import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { itemParams } from './_meta';
import Composition from './Foundations/SpacingAndRadius.svelte';

export default {
  title: 'Foundations/Spacing and radius',
  parameters: itemParams(['tokens'], 'Space follows a 4px rhythm. The shape of a corner has a meaning: controls are near-square, badges are tight, panels and nodes are rounder, only pills are round.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = { render: () => ({ Component: Composition }) };
