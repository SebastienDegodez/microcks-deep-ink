import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Segmented } from '@microcks-deep-ink/registry/react/segmented';
import { itemParams } from './_meta';

export default {
  title: 'Components/Segmented',
  parameters: itemParams(['segmented'], 'A group of toggle buttons with `aria-pressed`, for filters such as All, Passed and Failed. Announce the result count elsewhere with a live region.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [v, setV] = useState('all');
    return (
      <Segmented
        label="Filter test results"
        value={v}
        onChange={setV}
        options={[
          { id: 'all', label: 'All', count: 27 },
          { id: 'passed', label: 'Passed', count: 25 },
          { id: 'failed', label: 'Failed', count: 2 },
        ]}
      />
    );
  },
};
