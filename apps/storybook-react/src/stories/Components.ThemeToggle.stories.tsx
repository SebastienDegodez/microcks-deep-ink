import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ThemeToggle } from '@microcks-deep-ink/registry/react/theme-toggle';
import { itemParams } from './_meta';

export default {
  title: 'Components/ThemeToggle',
  parameters: itemParams(['theme-toggle', 'button', 'icon'], 'An icon-only `aria-pressed` button named "Light theme". It sets `data-theme` on `<html>`, remembers the choice (`microcks-theme`) and dispatches `microcks-theme-change`.'),
} satisfies Meta;

export const Default: StoryObj = { render: () => <ThemeToggle /> };
