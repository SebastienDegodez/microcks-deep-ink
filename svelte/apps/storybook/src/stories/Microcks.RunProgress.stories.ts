import LabelAndGapExample from './Microcks.RunProgress/LabelAndGap.svelte';
import PausedNoteFirstExample from './Microcks.RunProgress/PausedNoteFirst.svelte';
import RunningExample from './Microcks.RunProgress/Running.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';


import { RunProgress } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunProgress',
  component: RunProgress,
  parameters: itemParams(['run-progress', 'button'], 'Progress of a running test: the count done as text, a bar named by the count, the current step in a polite live region, and the counts by result.'),
} satisfies Meta<typeof RunProgress>;

export const Running: StoryObj = {
  render: () => ({ Component: RunningExample, props: {} }),
};

/** Paused: the note is read before "Step forward" (it comes first in the DOM) and is still shown under the counts. */
export const PausedNoteFirst: StoryObj = {
  name: 'Paused (note read before the action)',
  render: () => ({ Component: PausedNoteFirstExample, props: {} }),
};

/** A custom `label` for the progress bar and a `gap` between the segments. */
export const LabelAndGap: StoryObj = {
  name: 'Label and gap',
  render: () => ({ Component: LabelAndGapExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunProgress> = {
  args: {
    label: 'Progress', busy: false, done: 7, total: 12, caption: '7 of 12 operations', nowLabel: 'Now', now: 'PATCH /pastries/{name}',
    segments: ['done', 'done', 'done', 'failed', 'done', 'warn', 'done', 'current', 'queued', 'queued', 'queued', 'queued'],
    counts: [{ kind: 'pass', text: '5 passed' }, { kind: 'fail', text: '1 failed' }, { kind: 'warn', text: '1 warning' }, { kind: 'pending', text: '5 pending' }],
    note: 'Started 09:10.', gap: undefined,
  },
};
