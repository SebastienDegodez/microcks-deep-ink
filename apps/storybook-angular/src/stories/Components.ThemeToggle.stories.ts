import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ThemeToggleComponent } from '@microcks-deep-ink/registry/angular/theme-toggle';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/ThemeToggle',
  decorators: [moduleMetadata({ imports: [ThemeToggleComponent] })],
  parameters: itemParams(['theme-toggle', 'button', 'icon'], "An icon-only `aria-pressed` button named \"Light theme\". It sets `data-theme` on `<html>`, remembers the choice (`microcks-theme`) and dispatches `di-theme-change`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
<button mkThemeToggle></button>
    `,
  }),
};
