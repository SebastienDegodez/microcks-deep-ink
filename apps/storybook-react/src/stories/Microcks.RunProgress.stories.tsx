import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { RunProgress } from '@microcks-deep-ink/registry/react/run-progress';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunProgress',
  parameters: itemParams(['run-progress', 'button'], 'Progress of a running test: the count done as text, a bar named by the count, the current step in a polite live region, and the counts by result.'),
} satisfies Meta;

export const Running: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <RunProgress
        done={5}
        total={7}
        caption="test steps done"
        nowLabel="Now calling"
        now="PATCH /pastries/{name}"
        segments={['done', 'done', 'done', 'failed', 'done', 'current', 'queued']}
        counts={[{ kind: 'pass', text: '4 passed' }, { kind: 'fail', text: '1 failed' }, { kind: 'pending', text: '2 to go' }]}
        action={<Button size="sm" icon="chevron">Step forward</Button>}
        note="The run plays one step at a time; the log follows it."
      />
    </div>
  ),
};
