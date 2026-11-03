import { Component, Event, EventEmitter, Host, Listen, State, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { Theme, getTheme, restoreTheme, setTheme } from '../../utils/theme';

/** Switches Deep Ink (dark) and Paper (light) by setting data-theme on <html>. */
@Component({
  tag: 'mk-theme-toggle',
  shadow: true,
  styles: `
    :host { display: inline-flex; }
    button { all: unset; cursor: pointer; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-control); color: var(--text-secondary); }
    button:hover { background: var(--raised); color: var(--text); }
    button:focus-visible { box-shadow: var(--shadow-focus); }
  `,
})
export class MkThemeToggle {
  @State() theme: Theme = 'dark';

  @Event() mkThemeChange!: EventEmitter<Theme>;

  componentWillLoad() {
    this.theme = restoreTheme();
  }

  @Listen('mkThemeChange', { target: 'document' })
  sync() {
    this.theme = getTheme();
  }

  private toggle = () => {
    const next: Theme = this.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    this.theme = next;
  };

  render() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    return (
      <Host>
        <button onClick={this.toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
          {icon(this.theme === 'dark' ? 'sun' : 'moon', 18)}
        </button>
      </Host>
    );
  }
}
