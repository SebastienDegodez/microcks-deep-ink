import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { CopyButton } from '@microcks-deep-ink/registry/react/copy-button';
import { itemParams } from './_meta';

export default {
  title: 'Components/Copy button',
  component: CopyButton,
  parameters: itemParams(['copy-button'], 'Copies a value, then says so twice: the label switches for 2 seconds and a visually hidden polite live region announces "Copied" (or "Copy failed").'),
} satisfies Meta<typeof CopyButton>;

export const Default: StoryObj = {
  render: () => <CopyButton value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />,
};

/** `size` and `variant` come from the button; `copiedLabel` is the label after a successful copy. */
export const SizesAndVariants: StoryObj = {
  name: 'Sizes and variants',
  render: () => (
    <div className="inline">
      <CopyButton value="microcks test" size="sm" variant="ghost" />
      <CopyButton value="microcks test" size="compact" variant="outline" label="Copy command" copiedLabel="Command copied" />
      <CopyButton value="microcks test" size="lg" variant="primary" />
    </div>
  ),
};

export const IconOnly: StoryObj = {
  name: 'Icon only',
  render: () => <CopyButton iconOnly label="Copy mock URL" value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />,
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof CopyButton> = {
  args: { value: 'http://localhost:8080/rest/API+Pastry/2.0.0', label: 'Copy URL', copiedLabel: 'Copied', size: 'md', variant: 'secondary' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'compact', 'tile', 'md', 'lg'] },
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
  },
};
