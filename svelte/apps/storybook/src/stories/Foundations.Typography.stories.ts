import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { itemParams } from './_meta';
import Composition from './Foundations/Typography.svelte';

export default {
  title: 'Foundations/Typography',
  parameters: itemParams(['tokens'], 'Type roles are CSS shorthands (`font: var(--type-body)`). Sizes are in px for the specimen; use rem in product code so the text follows the user setting.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = { render: () => ({ Component: Composition, props: {} }) };
