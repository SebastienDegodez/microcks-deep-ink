import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Link } from '@microcks-deep-ink/registry/react/link';
import { itemParams } from './_meta';

export default {
  title: 'Components/Link',
  component: Link,
  parameters: itemParams(['link', 'icon'], 'Always underlined in body text. An external link adds an icon, a hidden "(opens in a new tab)" and `rel="noopener"`.'),
} satisfies Meta<typeof Link>;

export const Default: StoryObj = {
  render: () => (
    <p style={{ margin: 0 }}>
      Read the <Link href="#arazzo">Arazzo specification notes</Link> or the{' '}
      <Link href="https://microcks.io" external>Microcks documentation</Link>.
    </p>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Link> = {
  args: { href: '#docs', children: 'Read the Arazzo guide', external: false },
};
