import { addons } from 'storybook/manager-api';
import { registerCopyPanel } from './copy-panel/register';
import { theme } from './theme';

addons.setConfig({ theme, selectedPanel: 'deep-ink/copy' });
registerCopyPanel({ framework: 'react' });
