import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { RunProgressComponent } from '@microcks-deep-ink/registry/angular/run-progress';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunProgress',
  argTypes: argTypesFor('run-progress', ['RunProgressComponent']),
  decorators: [moduleMetadata({ imports: [RunProgressComponent, ButtonDirective] })],
  parameters: itemParams(['run-progress', 'button'], "Progress of a running test: the count done as text, a bar named by the count, the current step in a polite live region, and the counts by result."),
};
export default meta;

export const Running: StoryObj = {
  render: () => ({
    props: {
      segments: ['done', 'done', 'done', 'failed', 'done', 'current', 'queued'],
      counts: [{ kind: 'pass', text: '4 passed' }, { kind: 'fail', text: '1 failed' }, { kind: 'pending', text: '2 to go' }],
    },
    template: `
      <div style="max-width: 640px">
        <section mkRunProgress [done]="5" [total]="7" caption="test steps done" nowLabel="Now calling" now="PATCH /pastries/{name}" [segments]="segments" [counts]="counts" note="The run plays one step at a time; the log follows it.">
          <button mkRunProgressAction mkButton size="sm" icon="chevron">Step forward</button>
        </section>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('run-progress', 'RunProgressComponent', { label: 'Progress', done: 7, total: 12, caption: '7 of 12 operations', nowLabel: 'Now', now: 'PATCH /pastries/{name}', segments: ['done','done','done','failed','done','warn','done','current','queued','queued','queued','queued'], counts: [{ kind: 'pass', text: '5 passed' }, { kind: 'fail', text: '1 failed' }], note: 'Started 09:10.' }, '');
