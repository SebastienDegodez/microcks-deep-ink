import exampleSource0 from './Components.CommandBar/Default.svelte?raw';
import exampleSource1 from './Components.CommandBar/NoShortcut.svelte?raw';
import exampleSource2 from './Components.CommandBar/Modal.svelte?raw';
import exampleSource3 from './Components.CommandBar/Playground.svelte?raw';
import exampleSource4 from './Components.CommandBar/Inline.svelte?raw';
import DefaultComposition from './Components.CommandBar/Default.svelte';
import NoShortcutComposition from './Components.CommandBar/NoShortcut.svelte';
import ModalComposition from './Components.CommandBar/Modal.svelte';
import PlaygroundComposition from './Components.CommandBar/Playground.svelte';
import InlineComposition from './Components.CommandBar/Inline.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button } from '@microcks/deep-ink';
import { CommandBar } from '@microcks/deep-ink';
import { COMMANDS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';


export default {
  title: 'Components/CommandBar',
  component: CommandBar,
  parameters: itemParams(['command-bar', 'button', 'kbd'], 'An ARIA 1.2 combobox with a listbox: the input keeps focus and `aria-activedescendant` follows the highlighted option. Results are grouped by kind and the count is announced ("5 results"). The modal mode uses a native `<dialog>` and returns focus to the opener. Native Svelte component (no Web Component).'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  name: 'Inline',
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `globalShortcut={false}` turns Ctrl/\u2318K off, for a page that has its own shortcut. */
export const NoShortcut: StoryObj<typeof NoShortcutComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Without the global shortcut',
  render: () => ({ Component: NoShortcutComposition, props: {} })
};

export const Modal: StoryObj<typeof ModalComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: ModalComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  args: { items: COMMANDS, inline: true, label: 'Command bar', placeholder: 'Type a command or a service', globalShortcut: false },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};

export const Inline: StoryObj<typeof InlineComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  name: 'Inline (long placeholder)',
  render: () => ({ Component: InlineComposition, props: {} })
};
