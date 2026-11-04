import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WorkflowLoomDirective } from '@microcks-deep-ink/registry/angular/workflow-loom';
import { LOOM_CHECK_MENU, LOOM_RESTOCK_RUN14, LOOM_SESSION_RUN13 } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Elements/Workflow loom',
  argTypes: argTypesFor('workflow-loom', ['WorkflowLoomDirective']),
  decorators: [moduleMetadata({ imports: [WorkflowLoomDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: itemParams(['workflow-loom'], "An Arazzo workflow drawn as a loom: sources as lanes, steps as nodes, `dependsOn` as branches that join, `end` and `retry` actions, and the two checks of each step. Every node is a button reachable with the arrow keys, and \"Show as table\" switches to an equivalent table. The element is self-contained: the registry copies its bundle next to this wrapper. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`."),
};
export default meta;

const TEMPLATE = `
      <div style="max-width:1100px">
        <workflow-loom [label]="s.label" [sources]="s.sources" [steps]="s.steps" [threads]="s.threads" [inputs]="s.inputs ?? []" [outputs]="s.outputs ?? []" [outputNote]="s.outputNote" [validatesSchemas]="!!s.validatesSchemas" [selectedStep]="sel" [lens]="lens" [tableToggle]="toggle" (stepSelect)="sel = $event.stepId" (lensSelect)="lens = $event.id"></workflow-loom>
        <p role="status" class="sb-note">Selected step: {{ sel ?? 'none' }}. Lens: {{ lens ?? 'none' }}.</p>
      </div>
    `;

export const Run14: StoryObj = {
  name: "Run #14 (retry and failed step)",
  render: () => ({
    props: { s: LOOM_RESTOCK_RUN14, sel: 'patchPastry' as string | undefined, lens: undefined as string | undefined, toggle: true },
    template: TEMPLATE,
  }),
};

export const CheckMenu: StoryObj = {
  name: "Parallel branches (check-menu)",
  render: () => ({
    props: { s: LOOM_CHECK_MENU, sel: undefined as string | undefined, lens: undefined as string | undefined, toggle: true },
    template: TEMPLATE,
  }),
};

/** On a page that already has a Steps tab, `[tableToggle]="false"` hides the built-in "Show as table" button. */
export const WithoutTableToggle: StoryObj = {
  name: 'Without the table toggle',
  render: () => ({
    props: { s: LOOM_RESTOCK_RUN14, sel: 'patchPastry' as string | undefined, lens: undefined as string | undefined, toggle: false },
    template: TEMPLATE,
  }),
};

/** A session run: each node lists generic checks (`checks: { label, state }[]`): Call #N, Data passing, Contract. */
export const SessionChecks: StoryObj = {
  name: 'Session run #13 (generic checks)',
  render: () => ({
    props: { s: LOOM_SESSION_RUN13, sel: 'patchPastry' as string | undefined, lens: undefined as string | undefined, toggle: true },
    template: TEMPLATE,
  }),
};
