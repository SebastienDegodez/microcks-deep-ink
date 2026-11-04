import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ThemeToggle } from '@microcks-deep-ink/registry/react/theme-toggle';
import { itemParams } from './_meta';

export default {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: itemParams(['theme-toggle', 'button', 'icon'], 'An icon-only `aria-pressed` button named "Light theme". It sets `data-theme` on `<html>`, remembers the choice (`microcks-theme`) and dispatches `microcks-theme-change`.'),
} satisfies Meta<typeof ThemeToggle>;

export const Default: StoryObj = { render: () => <ThemeToggle /> };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ThemeToggle> = {
  args: {},
};
