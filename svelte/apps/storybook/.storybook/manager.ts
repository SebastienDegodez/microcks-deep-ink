import { addons } from 'storybook/manager-api';
import { registerCopyPanel } from '@microcks-deep-ink/storybook-shared/copy-panel';
import exports from './copy-panel/exports.generated.json';
import { theme } from './theme';
addons.setConfig({ theme, selectedPanel: 'deep-ink/copy' });
registerCopyPanel({ framework: 'svelte', exports });
