import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from './icon';
import { getTheme, restoreTheme, setTheme } from './theme-toggle.theme';

export { THEME_EVENT, THEME_STORAGE_KEY, getTheme, restoreTheme, setTheme } from './theme-toggle.theme';
export type { Theme } from './theme-toggle.theme';

/**
 * Toggle button for the light theme: `<button mkThemeToggle></button>`.
 * The label stays "Light theme"; `aria-pressed` tells whether it is on.
 */
@Component({
  selector: 'button[mkThemeToggle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    type: 'button',
    class: 'button theme-toggle',
    'data-variant': 'secondary',
    'data-size': 'md',
    'data-icon-only': '',
    'aria-label': 'Light theme',
    '[attr.aria-pressed]': "light() ? 'true' : 'false'",
    '(click)': 'toggle()',
    '(document:microcks-theme-change)': 'light.set(isLight())',
  },
  template: `<svg mkIcon name="moon" [size]="18"></svg>`,
})
export class ThemeToggleComponent {
  protected readonly light = signal(this.isLight());

  constructor() {
    // Applies the saved preference once; the event it dispatches updates `light`.
    afterNextRender(() => {
      restoreTheme();
      this.light.set(this.isLight());
    });
  }

  protected isLight(): boolean {
    return getTheme() === 'light';
  }

  protected toggle(): void {
    setTheme(this.isLight() ? 'dark' : 'light');
  }
}
