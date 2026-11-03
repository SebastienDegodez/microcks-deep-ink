import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WorkflowLoomDirective } from '@microcks-deep-ink/registry/angular/workflow-loom';
import { ApiBadgeComponent } from '@microcks-deep-ink/registry/angular/api-badge';
import { StatusBadgeComponent } from '@microcks-deep-ink/registry/angular/status-badge';
import { RunTargetComponent } from '@microcks-deep-ink/registry/angular/run-target';
import { RunOriginComponent } from '@microcks-deep-ink/registry/angular/run-origin';
import { CalloutComponent, CalloutActionsDirective } from '@microcks-deep-ink/registry/angular/callout';
import { CodeBlockComponent } from '@microcks-deep-ink/registry/angular/code-block';
import { PanelComponent, PanelActionsDirective } from '@microcks-deep-ink/registry/angular/panel';
import { StepStatusComponent, StepChecksComponent } from '@microcks-deep-ink/registry/angular/step-status';
import { LOOM_RESTOCK_RUN14, RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Patterns/Workflow run #14',
  decorators: [moduleMetadata({ imports: [WorkflowLoomDirective, ApiBadgeComponent, StatusBadgeComponent, RunTargetComponent, RunOriginComponent, CalloutComponent, CalloutActionsDirective, CodeBlockComponent, PanelComponent, PanelActionsDirective, StepStatusComponent, StepChecksComponent], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: itemParams(['workflow-loom', 'step-status', 'api-badge', 'status-badge', 'callout', 'code-block', 'run-target', 'run-origin', 'panel'], "Run #14 of `restock-pastry`: the loom shows a retry loop, an end branch that was not taken and a step that never ran. Below it, the failing response with the offending line marked in text."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { s: LOOM_RESTOCK_RUN14, failure: RUN14_FAILURE },
    template: `
      <div class="sb-col" style="max-width:1100px">
        <header class="sb-col">
          <h1 style="font:var(--type-section);margin:0">restock-pastry · run #14</h1>
          <div class="inline">
            <span mkApiBadge arazzo name="restock-pastry"></span>
            <span mkStatusBadge status="failed" label="Failed at patchPastry"></span>
            <span mkRunTarget target="mocks"></span>
            <span mkRunOrigin origin="ui"></span>
          </div>
        </header>
        <mk-callout tone="danger" title="Schema validation failed">{{ failure.summary }}</mk-callout>
        <workflow-loom [label]="s.label" [sources]="s.sources" [steps]="s.steps" [threads]="s.threads" [inputs]="s.inputs ?? []" [outputs]="s.outputs ?? []" validatesSchemas selectedStep="patchPastry"></workflow-loom>
        <section mkPanel title="patchPastry" [headingLevel]="2">
          <div class="sb-col">
            <span mkStepStatus status="failed" [attempts]="3"></span>
            <ul mkStepChecks successCriteria="passed" schemaValidation="failed"></ul>
            <figure mkCodeBlock [caption]="failure.request + ' · response'" language="json" [lines]="failure.response"></figure>
          </div>
        </section>
      </div>
    `,
  }),
};
