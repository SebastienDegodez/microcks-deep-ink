import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Segmented } from '@microcks-deep-ink/registry/react/segmented';
import { itemParams } from './_meta';

export default {
  title: 'Components/Segmented',
  component: Segmented,
  parameters: itemParams(['segmented'], 'A group of toggle buttons with `aria-pressed`, for filters such as All, Passed and Failed. Announce the result count elsewhere with a live region.'),
} satisfies Meta<typeof Segmented>;

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

export const StatusIcons: StoryObj = {
  name: 'Toned icons, selected fill (Sources)',
  render: () => {
    const [v, setV] = useState('all');
    return (
      <Segmented
        label="Status"
        value={v}
        onChange={setV}
        pressedFill="selected"
        iconSize={13}
        options={[
          { id: 'all', label: 'All' },
          { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success' },
          { id: 'warnings', label: 'Warnings', icon: 'warning', iconTone: 'warning' },
          { id: 'failing', label: 'Failing', icon: 'cross', iconTone: 'danger' },
          { id: 'inactive', label: 'Inactive', icon: 'pause', iconTone: 'muted' },
        ]}
      />
    );
  },
};

export const Compact: StoryObj = {
  name: 'Joined sm and wide track (Behavior, Usage)',
  render: () => {
    const [lang, setLang] = useState('groovy');
    const [period, setPeriod] = useState('today');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        <Segmented label="Script language" variant="joined" size="sm" value={lang} onChange={setLang} options={[{ id: 'groovy', label: 'Groovy' }, { id: 'js', label: 'JavaScript' }]} />
        <Segmented label="Period" spacing="wide" value={period} onChange={setPeriod} options={[{ id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }]} />
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Segmented> = {
  args: {
    label: 'Status filter', value: 'all', variant: 'track', tone: 'neutral', pressedFill: 'raised', iconSize: 15, size: 'md', spacing: 'normal',
    options: [{ id: 'all', label: 'All', count: 12 }, { id: 'passed', label: 'Passed', count: 9, dot: 'success' }, { id: 'failed', label: 'Failed', count: 3, dot: 'danger' }],
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['track', 'joined'] },
    tone: { control: 'inline-radio', options: ['neutral', 'primary'] },
    pressedFill: { control: 'inline-radio', options: ['raised', 'selected'] },
    iconSize: { control: 'inline-radio', options: [13, 15] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    spacing: { control: 'inline-radio', options: ['normal', 'wide'] },
    onChange: { table: { disable: true } },
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Segmented {...args} value={value} onChange={setValue} />;
  },
};
