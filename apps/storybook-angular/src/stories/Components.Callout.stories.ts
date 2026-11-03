import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CalloutComponent, CalloutActionsDirective } from '@microcks-deep-ink/registry/angular/callout';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Callout',
  decorators: [moduleMetadata({ imports: [CalloutComponent, CalloutActionsDirective, ButtonDirective] })],
  parameters: itemParams(['callout', 'button'], "Tone is carried by an icon and a title as well as color. Use `live` only for a message that appears after an action; a static callout is not announced."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="di-stack" style="max-width:640px">
        <mk-callout tone="info" title="Contract imported">3 operations and 9 examples were created.</mk-callout>
        <mk-callout tone="success" title="Test passed">All 12 operations conform.</mk-callout>
        <mk-callout tone="warning" title="Schema drift">The response has a field the contract does not declare.</mk-callout>
        <mk-callout tone="danger" title="Test failed">patchPastry returned price as a string.</mk-callout>
      </div>
    `,
  }),
};

export const AI: StoryObj = {
  name: "AI generated",
  render: () => ({
    template: `
      <div style="max-width:640px">
        <mk-callout tone="ai">
          3 examples were suggested from the contract. Nothing is saved until you accept.
          <button mkCalloutActions mkButton size="sm">Review</button>
        </mk-callout>
      </div>
    `,
  }),
};

export const Live: StoryObj = {
  name: "Announced",
  render: () => ({
    template: `
      <div style="max-width:640px">
        <mk-callout tone="danger" live="assertive" title="Import failed">The file is not valid OpenAPI.</mk-callout>
      </div>
    `,
  }),
};
