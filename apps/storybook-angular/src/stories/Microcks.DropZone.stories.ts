import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DropZoneComponent } from '@microcks-deep-ink/registry/angular/drop-zone';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/DropZone',
  argTypes: argTypesFor('drop-zone', ['DropZoneComponent']),
  decorators: [moduleMetadata({ imports: [DropZoneComponent] })],
  parameters: itemParams(['drop-zone', 'button', 'icon'], "Drag and drop is an enhancement. The zone holds a real `<input type=\"file\">` and a visible \"Choose files\" button, so keyboard and screen reader users upload the same way. A live region announces \"2 files ready\"."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      names: [] as string[],
      onFiles(this: { names: string[] }, files: File[]) {
        this.names = files.map((f) => f.name);
      },
    },
    template: `
      <div class="stack" style="max-width:560px">
        <mk-drop-zone heading="Import a contract" hint="OpenAPI, AsyncAPI, gRPC, GraphQL or Postman" accept=".yaml,.yml,.json,.proto,.graphql" (files)="onFiles($event)" />
        @if (names.length) {
          <p class="sb-note">Selected: {{ names.join(', ') }}</p>
        }
      </div>
    `,
  }),
};

export const Single: StoryObj = {
  name: "Single file",
  render: () => ({
    template: `
      <div style="max-width:560px">
        <mk-drop-zone heading="Replace the contract" hint="One YAML or JSON file" chooseLabel="Browse" [multiple]="false" accept=".yaml,.yml,.json" />
      </div>
    `,
  }),
};

export const Small: StoryObj = {
  name: "Small, in a panel (Admin snapshots)",
  render: () => ({
    template: `
      <div style="max-width:420px">
        <mk-drop-zone size="sm" heading="Drop a snapshot here" chooseLabel="Choose a file" [multiple]="false" accept="application/json,.json">
          <span mkDropZoneHint>A <code>microcks-repository.json</code> exported from any Microcks instance</span>
          <button type="button" class="button" data-variant="link">Use a sample snapshot</button>
        </mk-drop-zone>
      </div>
    `,
  }),
};
