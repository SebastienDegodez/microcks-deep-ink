import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ConformanceBand } from '@microcks-deep-ink/registry/react/conformance-band';
import { CONFORMANCE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ConformanceBand',
  component: ConformanceBand,
  parameters: itemParams(['conformance-band'], 'One segment per operation. The band is `role="img"` with a sentence ("11 of 12 operations pass, 1 fails"). Failed segments are hatched as well as colored, and the full size writes the summary.'),
} satisfies Meta<typeof ConformanceBand>;

export const Default: StoryObj = {
  render: () => <ConformanceBand outcomes={CONFORMANCE} />,
};

/** `unit` changes the noun in the accessible summary ("3 of 4 conversations passed"). */
export const CustomUnit: StoryObj = {
  name: 'Custom unit',
  render: () => <ConformanceBand outcomes={['pass', 'pass', 'pass', 'fail']} unit="conversation" showSummary />,
};

export const Mini: StoryObj = {
  render: () => (
    <div className="inline">
      <ConformanceBand size="mini" outcomes={CONFORMANCE} />
      <ConformanceBand size="mini" outcomes={['pass', 'pass', 'untested', 'untested']} />
    </div>
  ),
};

export const Failing: StoryObj = {
  render: () => <ConformanceBand outcomes={['pass', 'fail', 'fail', 'pass', 'untested', 'fail']} />,
};

export const Labelled: StoryObj = {
  name: 'Labels under each cell',
  render: () => (
    <ConformanceBand outcomes={['pass', 'pass', 'fail']} labels={['GET /pastries · passed', 'GET /pastries/{name} · passed', 'PATCH /pastries/{name} · failed']} />
  ),
};

export const WithSummary: StoryObj = {
  name: 'With summary',
  render: () => <ConformanceBand outcomes={CONFORMANCE} showSummary />,
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ConformanceBand> = {
  args: { outcomes: ['pass', 'pass', 'fail', 'pass', 'untested', 'pass'], size: 'full', unit: 'operation', showSummary: true },
  argTypes: { size: { control: 'inline-radio', options: ['full', 'mini'] } },
};
