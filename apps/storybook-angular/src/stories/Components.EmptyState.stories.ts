import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { EmptyStateComponent, EmptyActionsDirective } from '@microcks-deep-ink/registry/angular/empty-state';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/EmptyState',
  argTypes: argTypesFor('empty-state', ['EmptyStateComponent']),
  decorators: [moduleMetadata({ imports: [EmptyStateComponent, EmptyActionsDirective, ButtonDirective] })],
  parameters: itemParams(['empty-state', 'button'], "Says what is missing and offers the next step. The title is a heading: choose its level with `headingLevel`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <section mkEmptyState title="No services yet">
        Import an OpenAPI, AsyncAPI, gRPC or GraphQL contract to create your first mock.
        <button mkEmptyActions mkButton variant="primary" icon="upload">Import a contract</button>
      </section>
    `,
  }),
};

export const NoResults: StoryObj = {
  name: "No results (icon)",
  render: () => ({
    template: `
      <section mkEmptyState title="No service matches" icon="search-x">
        <p>None of the 11 services matches: “zzz”. Remove a filter or reset the selection.</p>
        <div mkEmptyActions><button mkButton variant="primary" icon="reset">Reset filters</button></div>
      </section>
    `,
  }),
};
