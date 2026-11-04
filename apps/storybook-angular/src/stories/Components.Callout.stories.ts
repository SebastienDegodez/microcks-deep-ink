import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CalloutComponent, CalloutActionsDirective } from '@microcks-deep-ink/registry/angular/callout';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Callout',
  argTypes: argTypesFor('callout', ['CalloutComponent']),
  decorators: [moduleMetadata({ imports: [CalloutComponent, CalloutActionsDirective, ButtonDirective] })],
  parameters: itemParams(['callout', 'button'], "Tone is carried by an icon and a title as well as color. Use `live` only for a message that appears after an action; a static callout is not announced."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:640px">
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

export const Outline: StoryObj = {
  name: 'Outline note',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 560px">
        <mk-callout tone="ai" variant="outline" title="">Proposed by AI from the contract's <code>Pastry</code> schema. The mock only serves it once accepted.</mk-callout>
        <mk-callout tone="warning" variant="outline">The secondary artifact needs API Pastry 2.0 in Microcks first: install the main package, then come back.</mk-callout>
        <div style="max-width: 360px"><mk-callout tone="warning" variant="outline" size="sm">The token shown here is masked: paste the real secret in your CI settings.</mk-callout></div>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('callout', 'CalloutComponent', { tone: 'info', title: 'Contract imported', variant: 'filled', size: 'md', live: false }, '12 operations were found in the OpenAPI file.');
