import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { EmptyStateComponent, EmptyActionsDirective } from '@microcks-deep-ink/registry/angular/empty-state';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/EmptyState',
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
