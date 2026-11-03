import { FormsModule } from '@angular/forms';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { fn } from 'storybook/test';
import { DEEP_INK, MkButton } from '@microcks-deep-ink/angular';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta<MkButton> = {
  title: 'Actions/Button',
  component: MkButton,
  decorators: [moduleMetadata({ imports: [DEEP_INK, FormsModule] })],
  args: { variant: 'primary', size: 'md', disabled: false, mkClick: fn() as any },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    icon: { control: 'select', options: [undefined, 'upload', 'tests', 'copy', 'spark'] },
  },
  render: (args) => ({
    props: args,
    template: `<mk-button [variant]="variant" [size]="size" [disabled]="disabled" [icon]="icon" (mkClick)="mkClick($event)">Run test</mk-button>`,
  }),
  parameters: {
    docs: { description: { component: 'Sturdy, near-square actions. One primary per task region. 44px for primary actions, 32px in dense toolbars.' } },
  },
};
export default meta;
type S = StoryObj<MkButton>;

export const Playground: S = {};

export const Variants: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-button variant="primary">Run test</mk-button>
        <mk-button variant="secondary" icon="upload">Import</mk-button>
        <mk-button variant="ghost" icon="copy">Copy mock URL</mk-button>
        <mk-button variant="danger">Delete</mk-button>
        <mk-button variant="danger" [confirm]="true">Delete service</mk-button>
        <mk-button variant="primary" [disabled]="true">Disabled</mk-button>
      </div>`,
  }),
};

export const DenseToolbar: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-button size="sm" variant="primary">Run test</mk-button>
        <mk-button size="sm">Edit</mk-button>
        <mk-button size="sm" variant="ghost">Copy</mk-button>
      </div>`,
  }),
};

export const InputWithNgModel: S = {
  name: 'Input (ngModel)',
  render: () => ({
    props: { url: 'https://raw.githubusercontent.com/microcks/microcks/master/samples/APIPastry-openapi.yaml' },
    template: `
      <div class="di-col" style="max-width:560px">
        <mk-input label="Contract URL" [mono]="true" [(ngModel)]="url" helpText="OpenAPI, AsyncAPI, gRPC, GraphQL, Postman, SoapUI."></mk-input>
        <span class="di-note">ngModel value: <code>{{ url }}</code></span>
        <mk-input label="Service name" value="API Pastry" error="A service with this name and version already exists."></mk-input>
      </div>`,
  }),
};

export const Tabs: S = {
  render: () => ({
    props: { tabs: SERVICE_TABS, active: 'operations' },
    template: `
      <div class="di-col">
        <mk-tabs [tabs]="tabs" [value]="active" (mkChange)="active = $event.detail"></mk-tabs>
        <span class="di-note">Active: {{ active }}</span>
      </div>`,
  }),
};

export const Chips: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-chip labelKey="domain">pastry</mk-chip>
        <mk-chip labelKey="status">GA</mk-chip>
        <mk-chip>team-bakery</mk-chip>
      </div>`,
  }),
};
