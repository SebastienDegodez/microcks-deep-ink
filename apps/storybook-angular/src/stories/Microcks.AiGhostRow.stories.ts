import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { AiGhostRowComponent } from '@microcks-deep-ink/registry/angular/ai-ghost-row';
import { MethodTagComponent } from '@microcks-deep-ink/registry/angular/method-tag';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/AiGhostRow',
  argTypes: argTypesFor('ai-ghost-row', ['AiGhostRowComponent']),
  decorators: [moduleMetadata({ imports: [AiGhostRowComponent, MethodTagComponent] })],
  parameters: itemParams(['ai-ghost-row', 'button', 'icon', 'method-tag'], "A suggestion that is not saved until accepted. The group is named \"AI suggestion: <name>\" and each button repeats the name for screen readers (\"Accept getPastry example\")."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { msg: '', body: '{ "name": "Eclair" }' },
    template: `
      <div class="stack" style="max-width:720px">
        <mk-ai-ghost-row name="getPastry example" (accept)="msg = 'Accepted'" (edit)="msg = 'Editing'" (reject)="msg = 'Rejected'">
          <span mkMethodTag method="GET"></span>&ngsp;<code>/pastries/Eclair</code> → 200 <code>{{ body }}</code>
        </mk-ai-ghost-row>
        <p role="status" class="sb-note">{{ msg }}</p>
      </div>
    `,
  }),
};

export const Busy: StoryObj = {
  render: () => ({
    template: `
      <div style="max-width:720px">
        <mk-ai-ghost-row name="postPastry example" busy><span mkMethodTag method="POST"></span>&ngsp;<code>/pastries</code> → 201</mk-ai-ghost-row>
      </div>
    `,
  }),
};
