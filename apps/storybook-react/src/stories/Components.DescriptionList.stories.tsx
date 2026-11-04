import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { DescriptionList } from '@microcks-deep-ink/registry/react/description-list';
import { itemParams } from './_meta';

export default {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  parameters: itemParams(['description-list'], 'A native `<dl>`: terms and values are paired for assistive technology.'),
} satisfies Meta<typeof DescriptionList>;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <DescriptionList
        items={[
          { term: 'Service', value: 'API Pastry' },
          { term: 'Version', value: '2.0', mono: true },
          { term: 'Type', value: 'REST' },
          { term: 'Mock URL', value: 'http://microcks.local:8080/rest/API+Pastry/2.0', mono: true },
        ]}
      />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof DescriptionList> = {
  args: {
    items: [
      { term: 'Service', value: 'API Pastry' },
      { term: 'Version', value: '2.0.0', mono: true },
      { term: 'Protocol', value: 'REST' },
    ],
  },
};
