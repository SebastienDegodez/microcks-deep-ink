import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MethodTag } from '@microcks-deep-ink/registry/react/method-tag';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/MethodTag',
  parameters: itemParams(['method-tag'], 'The operation verb in mono, always written out. The color only speeds up scanning.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <MethodTag key={m} method={m} />)}
      <MethodTag method="SUBSCRIBE" protocol="EVENT" />
      <MethodTag method="PUBLISH" protocol="EVENT" />
    </div>
  ),
};
