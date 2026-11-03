import { addons } from 'storybook/manager-api';
import { registerCopyPanel } from '@microcks-deep-ink/storybook-shared/copy-panel';
import { theme } from './theme';

addons.setConfig({ theme, selectedPanel: 'deep-ink/copy' });
registerCopyPanel({ framework: 'react' });
