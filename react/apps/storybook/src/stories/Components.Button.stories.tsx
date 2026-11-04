import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button, ButtonLink } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: itemParams(['button'], 'A sturdy, near-square native `<button>`. One primary per task region. The medium size is 40px high, large 44px (form footers); small (32px) and compact (34px) are never used for the primary action of a page.'),
} satisfies Meta<typeof Button>;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <Button variant="primary">Run test</Button>
      <Button>Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="link" icon="copy">Copy</Button>
      <Button variant="dashed" icon="plus">Add header</Button>
      <Button variant="danger">Delete service</Button>
    </div>
  ),
};

export const FormFooter: StoryObj = {
  name: 'Form footer, inline delete',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <div className="inline">
        <Button variant="outline" size="lg">Cancel</Button>
        <Button variant="primary" size="lg" icon="play">Launch test</Button>
        <Button variant="primary" size="lg" icon="play" disabled>Launch test</Button>
      </div>
      <div className="inline">
        <Button variant="dashed" size="compact" icon="plus">Add header</Button>
        <Button variant="ghost" size="sm" tone="danger" icon="trash">Delete</Button>
      </div>
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="inline">
      <Button size="lg">Large (44px)</Button>
      <Button size="md">Medium (40px)</Button>
      <Button size="tile">Tile (36px)</Button>
      <Button size="compact">Compact (34px)</Button>
      <Button size="sm">Small (32px)</Button>
    </div>
  ),
};

export const WithIcon: StoryObj = {
  name: 'Icons',
  render: () => (
    <div className="inline">
      <Button variant="primary" icon="play">Run test</Button>
      <Button icon="upload">Import</Button>
      <Button iconOnly icon="trash" aria-label="Delete example" />
    </div>
  ),
};

export const States: StoryObj = {
  render: () => (
    <div className="inline">
      <Button disabled>Disabled</Button>
      <Button loading>Running</Button>
      <Button variant="danger" confirm>
        Confirm delete
      </Button>
    </div>
  ),
};

export const AsLink: StoryObj = {
  name: 'As a link',
  render: () => <ButtonLink href="#service" variant="primary">Open service</ButtonLink>,
};

export const CardFooter: StoryObj = {
  name: 'Card footer (tile, 36px)',
  render: () => (
    <div className="inline">
      <Button variant="primary" size="tile" icon="download">Install</Button>
      <ButtonLink size="tile" href="#">View in catalogue</ButtonLink>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Button> = {
  args: { children: 'Run test', variant: 'primary', size: 'md', icon: undefined, iconOnly: false, loading: false, confirm: false, disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'compact', 'tile', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: [undefined, 'danger'] },
  },
};
