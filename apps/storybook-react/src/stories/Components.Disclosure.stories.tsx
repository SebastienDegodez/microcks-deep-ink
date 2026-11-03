import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Disclosure } from '@microcks-deep-ink/registry/react/disclosure';
import { itemParams } from './_meta';

export default {
  title: 'Components/Disclosure',
  parameters: itemParams(['disclosure'], 'A native `<details>`/`<summary>`: Enter and Space toggle it, the open state is exposed by the browser.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }} className="di-stack">
      <Disclosure summary="Advanced options">
        <p style={{ margin: 0 }}>Dispatcher rules, constraints and delays.</p>
      </Disclosure>
      <Disclosure summary="Already open" defaultOpen>
        <p style={{ margin: 0 }}>Open by default.</p>
      </Disclosure>
    </div>
  ),
};
