import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WorkflowLoomDirective } from '@microcks-deep-ink/registry/angular/workflow-loom';
import { LOOM_CHECK_MENU, LOOM_RESTOCK_RUN14 } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Elements/Workflow loom',
  decorators: [moduleMetadata({ imports: [WorkflowLoomDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: itemParams(['workflow-loom'], "An Arazzo workflow drawn as a loom: sources as lanes, steps as nodes, `dependsOn` as branches that join, `end` and `retry` actions, and the two checks of each step. Every node is a button reachable with the arrow keys, and \"Show as table\" switches to an equivalent table. The element is self-contained: the registry copies its bundle next to this wrapper. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`."),
};
export default meta;

export const Run14: StoryObj = {
  name: "Run #14 (retry and failed step)",
  render: () => ({
    props: { s: LOOM_RESTOCK_RUN14, sel: 'patchPastry' },
    template: `
      <div style="max-width:1100px">
        <mk-workflow-loom [label]="s.label" [sources]="s.sources" [steps]="s.steps" [threads]="s.threads" [inputs]="s.inputs ?? []" [outputs]="s.outputs ?? []" [validatesSchemas]="!!s.validatesSchemas" [selectedStep]="sel" (stepSelect)="sel = $event.stepId"></mk-workflow-loom>
        <p role="status" class="sb-note">Selected step: {{ sel }}</p>
      </div>
    `,
  }),
};

export const CheckMenu: StoryObj = {
  name: "Parallel branches (check-menu)",
  render: () => ({
    props: { s: LOOM_CHECK_MENU, sel: undefined as string | undefined },
    template: `
      <div style="max-width:1100px">
        <mk-workflow-loom [label]="s.label" [sources]="s.sources" [steps]="s.steps" [threads]="s.threads" [inputs]="s.inputs ?? []" [outputs]="s.outputs ?? []" [validatesSchemas]="!!s.validatesSchemas" [selectedStep]="sel" (stepSelect)="sel = $event.stepId"></mk-workflow-loom>
        <p role="status" class="sb-note">Selected step: {{ sel }}</p>
      </div>
    `,
  }),
};
