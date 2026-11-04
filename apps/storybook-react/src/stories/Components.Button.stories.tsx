import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button, ButtonLink } from '@microcks-deep-ink/registry/react/button';
import { itemParams } from './_meta';

export default {
  title: 'Components/Button',
  parameters: itemParams(['button'], 'A sturdy, near-square native `<button>`. One primary per task region. The medium size is 44px high; the small size (32px) is never used for the primary action of a page.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <Button variant="primary">Run test</Button>
      <Button>Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="link" icon="copy">Copy</Button>
      <Button variant="danger">Delete service</Button>
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="inline">
      <Button size="md">Medium (44px)</Button>
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
