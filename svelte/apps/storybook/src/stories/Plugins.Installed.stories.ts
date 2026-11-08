import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import Installed from './Plugins.Installed.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Plugins/Installed plugins', parameters: itemParams(['plugin-slot', 'panel', 'api-badge', 'code-block'], 'The plugin host lives on `globalThis`, so the shell and every plugin bundle share one registry. This view lists what is registered, with the manifest of the demo plugin.'), loaders: [async () => ({ ready: await registerDemoPlugin() })] } satisfies Meta;
export default meta;
export const Default: StoryObj<typeof meta> = { render: (() => ({ Component: Installed })) as never };
