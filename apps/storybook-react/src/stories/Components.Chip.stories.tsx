import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Chip } from '@microcks-deep-ink/registry/react/chip';
import { itemParams } from './_meta';

export default {
  title: 'Components/Chip',
  parameters: itemParams(['chip'], 'Static labels are a `<span>`. A chip with `pressed` is a toggle `<button aria-pressed>`. A removable chip has a remove button named "Remove <text>".'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="di-inline">
      <Chip>neutral</Chip>
      <Chip tone="info">info</Chip>
      <Chip tone="success">success</Chip>
      <Chip tone="warning">warning</Chip>
      <Chip tone="danger">danger</Chip>
    </div>
  ),
};

export const Variants: StoryObj = {
  render: () => (
    <div className="di-inline">
      <Chip variant="solid" tone="info">solid</Chip>
      <Chip variant="outline" tone="info">outline</Chip>
      <Chip variant="dashed" tone="warning">Proposed · beyond POC</Chip>
      <Chip labelKey="owner">sebastien</Chip>
    </div>
  ),
};

export const Toggle: StoryObj = {
  render: () => {
    const [on, setOn] = useState(false);
    return <Chip pressed={on} onClick={() => setOn(!on)}>REST only</Chip>;
  },
};

export const Removable: StoryObj = {
  render: () => {
    const [tags, setTags] = useState(['pastry', 'bakery', 'v2']);
    return (
      <div className="di-inline">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>{t}</Chip>
        ))}
        {tags.length === 0 ? <span className="sb-note">No tags left.</span> : null}
      </div>
    );
  },
};
