import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SectionLabel } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/SectionLabel',
  component: SectionLabel,
  parameters: itemParams(['section-label'], 'A small uppercase muted label. Use a heading for a section, a label for a field, a span for a caption. The text stays in normal case in the DOM.'),
} satisfies Meta<typeof SectionLabel>;

export const Uses: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <SectionLabel as="h3">Endpoints</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SectionLabel as="label" htmlFor="sl-url">Mock URL</SectionLabel>
        <input id="sl-url" className="input" readOnly value="https://microcks.acme.io/rest/API+Pastry/2.0" />
      </div>
      <SectionLabel as="h2" size="sm">1 · Operation</SectionLabel>
      <SectionLabel size="sm" weight="regular" split>
        <span>3 operations</span>
        <span>calls · 7 d</span>
      </SectionLabel>
      <SectionLabel as="h4" lineHeight="normal">Request</SectionLabel>
      <SectionLabel size="sm" weight="regular" split lineHeight="snug">
        <span>Skills</span>
        <span>4 declared</span>
      </SectionLabel>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SectionLabel> = {
  args: { children: 'Operations', as: 'h3', size: 'md', weight: 'semibold', split: false, lineHeight: 'fixed' },
  argTypes: {
    as: { control: 'select', options: ['h2', 'h3', 'h4', 'h5', 'h6', 'label', 'span', 'p', 'div'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    weight: { control: 'inline-radio', options: ['semibold', 'regular'] },
    lineHeight: { control: 'inline-radio', options: ['fixed', 'normal', 'snug'] },
  },
};
