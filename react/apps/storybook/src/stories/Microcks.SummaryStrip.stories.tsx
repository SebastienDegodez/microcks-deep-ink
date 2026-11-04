import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SummaryStrip, SummaryStripSep } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/SummaryStrip',
  component: SummaryStrip,
  parameters: itemParams(['summary-strip'], 'Key facts in one bordered row, separated by decorative 1px rules. The words carry the meaning; add role="note" for a page summary.'),
} satisfies Meta<typeof SummaryStrip>;

export const Saved: StoryObj = {
  render: () => (
    <SummaryStrip
      role="note"
      aria-label="Saved behaviour"
      style={{ maxWidth: 900 }}
      parts={[
        { text: 'Saved', kind: 'label' },
        { text: 'URI_PARTS · rule: name' },
        { text: 'delay 0 ms fixed', sep: true },
        { text: '2 constraints', sep: true },
        { text: '3 examples · dispatcher inferred from the OpenAPI path parameter', kind: 'label', sep: true },
      ]}
    />
  ),
};

export const Dispatcher: StoryObj = {
  name: 'Dispatcher summary (values in text)',
  render: () => (
    <SummaryStrip gap="roomy" values="text" style={{ maxWidth: 900 }} parts={[{ text: 'Dispatcher', kind: 'label' }, { text: 'URI_PARTS' }, { text: 'name', sep: true }]}>
      <a href="#/behavior">Edit the behaviour</a>
    </SummaryStrip>
  ),
};

export const Canvas: StoryObj = {
  name: 'Canvas (Agent test setup)',
  render: () => (
    <SummaryStrip role="note" aria-label="Test setup" variant="canvas" style={{ maxWidth: 900 }} parts={[{ text: 'Setup', kind: 'label' }, { text: 'https://agents.acme.io/concierge' }, { text: 'JSON-RPC 2.0', sep: true }]} />
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SummaryStrip> = {
  args: {
    gap: 'normal', values: 'secondary', variant: 'default',
    parts: [{ text: '12', kind: 'value' }, { text: 'operations', kind: 'label' }, { text: '', sep: true }, { text: '3', kind: 'value' }, { text: 'failing', kind: 'label' }],
  },
  argTypes: { gap: { control: 'inline-radio', options: ['normal', 'roomy'] }, values: { control: 'inline-radio', options: ['secondary', 'text'] }, variant: { control: 'inline-radio', options: ['default', 'canvas'] } },
};

export const FromContent: StoryObj = {
  name: 'Built from content',
  render: () => (
    <SummaryStrip style={{ maxWidth: 900 }}>
      <span className="summary-strip-label">Saved</span>
      <span className="summary-strip-value">URI_PARTS · rule: name</span>
      <SummaryStripSep />
      <span className="summary-strip-value">delay 0 ms fixed</span>
      <SummaryStripSep />
      <a href="#/behavior">Edit the behaviour</a>
    </SummaryStrip>
  ),
};
