import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { CopyButton } from '@microcks-deep-ink/registry/react/copy-button';
import { itemParams } from './_meta';

export default {
  title: 'Components/Copy button',
  parameters: itemParams(['copy-button'], 'Copies a value, then says so twice: the label switches for 2 seconds and a visually hidden polite live region announces "Copied" (or "Copy failed").'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => <CopyButton value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />,
};

export const IconOnly: StoryObj = {
  name: 'Icon only',
  render: () => <CopyButton iconOnly label="Copy mock URL" value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />,
};
