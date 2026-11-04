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

export const DotsAndIcons: StoryObj = {
  name: 'Dots and icons',
  render: () => {
    const [r, setR] = useState('all');
    const [view, setView] = useState('table');
    return (
      <div className="inline">
        <Segmented
          label="Last test"
          value={r}
          onChange={setR}
          options={[
            { id: 'all', label: 'All', count: 11, dot: 'neutral' },
            { id: 'ok', label: 'Conformant', count: 3, dot: 'success' },
            { id: 'ko', label: 'Failing', count: 5, dot: 'danger' },
            { id: 'never', label: 'Never tested', count: 3, dot: 'muted' },
          ]}
        />
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: 'table', label: 'Table', icon: 'list' },
            { id: 'wall', label: 'Badge wall', icon: 'badge-wall' },
          ]}
        />
      </div>
    );
  },
};

export const Joined: StoryObj = {
  render: () => {
    const [v, setV] = useState('groovy');
    return (
      <Segmented
        label="Script language"
        variant="joined"
        value={v}
        onChange={setV}
        options={[
          { id: 'groovy', label: 'Groovy' },
          { id: 'js', label: 'JavaScript' },
        ]}
      />
    );
  },
};

export const JoinedPrimary: StoryObj = {
  name: 'Joined, primary tone',
  render: () => {
    const [v, setV] = useState('primary');
    return <Segmented label="Artifact role" variant="joined" tone="primary" value={v} onChange={setV} options={[{ id: 'primary', label: 'Primary' }, { id: 'secondary', label: 'Secondary' }]} />;
  },
};
