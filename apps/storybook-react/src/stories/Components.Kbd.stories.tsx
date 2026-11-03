import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Kbd } from '@microcks-deep-ink/registry/react/kbd';
import { itemParams } from './_meta';

export default {
  title: 'Components/Kbd',
  parameters: itemParams(['kbd'], 'The native `<kbd>` element for key names. Write the key in words where a symbol is ambiguous.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <p style={{ margin: 0 }}>
      Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to open the command bar, <Kbd>Esc</Kbd> to close it.
    </p>
  ),
};
