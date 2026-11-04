import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { CommandBar } from '@microcks-deep-ink/registry/react/command-bar';
import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/CommandBar',
  component: CommandBar,
  parameters: itemParams(['command-bar', 'button', 'kbd'], 'An ARIA 1.2 combobox with a listbox: the input keeps focus and `aria-activedescendant` follows the highlighted option. Results are grouped by kind and the count is announced ("5 results"). The modal mode uses a native `<dialog>` and returns focus to the opener. Native React component (no Web Component).'),
} satisfies Meta<typeof CommandBar>;

export const Default: StoryObj = {
  name: 'Inline',
  render: () => {
    const [last, setLast] = useState('');
    return (
      <div className="sb-col" style={{ maxWidth: 560 }}>
        <CommandBar inline items={COMMANDS} label="Command bar" placeholder="Type a command or a service" onCommand={(item) => setLast(item.label)} />
        <p className="sb-note" role="status">{last ? `Ran: ${last}` : 'Press Enter on an option to run it.'}</p>
      </div>
    );
  },
};

/** `globalShortcut={false}` turns Ctrl/\u2318K off, for a page that has its own shortcut. */
export const NoShortcut: StoryObj = {
  name: 'Without the global shortcut',
  render: () => <CommandBar inline globalShortcut={false} items={COMMANDS} label="Local commands" placeholder="Type a command" />,
};

export const Modal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-col">
        <Button variant="primary" icon="search" onClick={() => setOpen(true)}>Open the command bar</Button>
        <p className="sb-note">Or press Ctrl+K (⌘K on macOS) anywhere on the page.</p>
        <CommandBar items={COMMANDS} open={open} onClose={() => setOpen(false)} onCommand={() => setOpen(false)} />
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof CommandBar> = {
  args: { items: COMMANDS, inline: true, label: 'Command bar', placeholder: 'Type a command or a service', globalShortcut: false },
  decorators: [(Story) => <div style={{ maxWidth: 560 }}><Story /></div>],
};

export const Inline: StoryObj = {
  name: 'Inline (long placeholder)',
  render: () => {
    const [last, setLast] = useState('none');
    return (
      <div style={{ maxWidth: 560 }}>
        <CommandBar inline items={COMMANDS} placeholder="Search services, operations and commands" onCommand={(item) => setLast(item.label)} />
        <p role="status" className="sb-note">Last command: {last}</p>
      </div>
    );
  },
};
