import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommandBarDirective } from '@microcks-deep-ink/registry/angular/command-bar';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Elements/Command bar',
  decorators: [moduleMetadata({ imports: [CommandBarDirective, ButtonDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: itemParams(['command-bar'], "A search field and a list of commands (ARIA 1.2 combobox): arrows move, Enter runs, Escape closes, Ctrl/\u2318K opens it from anywhere. In modal mode it uses a native `<dialog>` and returns focus to the opener. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`."),
};
export default meta;

export const Inline: StoryObj = {
  render: () => ({
    props: { commands: COMMANDS, last: 'none' },
    template: `
      <div style="max-width:560px">
        <command-bar inline [items]="commands" placeholder="Search services, operations and commands" (command)="last = $event.label"></command-bar>
        <p role="status" class="sb-note">Last command: {{ last }}</p>
      </div>
    `,
  }),
};

export const Modal: StoryObj = {
  render: () => ({
    props: { commands: COMMANDS, open: false },
    template: `
      <button mkButton variant="primary" (click)="open = true">Open the command bar</button>
      <command-bar [items]="commands" [open]="open" [globalShortcut]="false" (command)="open = false" (closed)="open = false"></command-bar>
    `,
  }),
};
