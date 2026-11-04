import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ProjectionPill } from '@microcks-deep-ink/registry/react/projection-pill';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ProjectionPill',
  parameters: itemParams(['projection-pill'], 'Marks a proposed feature that does not exist in Microcks today. The visible words carry the meaning; the title only adds detail.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <ProjectionPill title="A2A does not exist in Microcks today: this screen projects a protocol module for v2" />
      <ProjectionPill>Projection · proposed CLI</ProjectionPill>
    </div>
  ),
};
