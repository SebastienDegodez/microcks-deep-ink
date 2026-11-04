import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ICON_NAMES, Icon } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Foundations/Icons',
  parameters: itemParams(['icon'], 'Inline stroke icons, 2px stroke, `currentColor`. Hidden from assistive technology next to text; pass `label` to make one meaningful. No emoji.', { controls: { disable: true } }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <ul className="sb-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {ICON_NAMES.map((n) => (
        <li className="sb-swatch" key={n} style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name={n} size={20} />
          <code>{n}</code>
        </li>
      ))}
    </ul>
  ),
};

export const Meaningful: StoryObj = {
  name: 'With a label',
  render: () => (
    <div className="sb-stack">
      <Icon name="check" size={24} label="Passed" />
      <Icon name="warning" size={24} label="Warning" />
      <span className="sb-note">Icons with a label get <code>role=&quot;img&quot;</code> and <code>aria-label</code>.</span>
    </div>
  ),
};
