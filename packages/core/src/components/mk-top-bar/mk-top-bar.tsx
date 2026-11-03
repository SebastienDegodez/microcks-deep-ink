import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { icon } from '../../utils/icons';

/**
 * Shell top bar: logo, ⌘K trigger, primary action, theme toggle, user.
 * @slot logo - Replaces the default wordmark (use the official Microcks mark here).
 * @slot actions - Extra actions before the theme toggle.
 */
@Component({
  tag: 'mk-top-bar',
  shadow: true,
  styles: `
    :host { display: block; background: var(--canvas); border-bottom: 1px solid var(--border); }
    .bar { display: flex; align-items: center; gap: var(--space-4); height: 56px; padding: 0 var(--space-4); }
    .logo { display: flex; align-items: center; gap: var(--space-2); font: 800 22px/1 var(--font-brand); color: var(--text); letter-spacing: .01em; }
    .logo i { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, var(--brand-cloud), var(--brand-blue)); }
    .search { all: unset; box-sizing: border-box; cursor: pointer; flex: 0 1 420px; display: flex; align-items: center; gap: var(--space-2); height: 36px; padding: 0 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-control); color: var(--text-muted); font: 400 14px/20px var(--font-ui); }
    .search:hover { border-color: var(--border-strong); }
    .search:focus-visible { border-color: var(--action); box-shadow: var(--shadow-focus); }
    kbd { margin-left: auto; font: 400 12px var(--font-mono); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 1px 6px; }
    .right { margin-left: auto; display: flex; align-items: center; gap: var(--space-2); }
    .user { width: 32px; height: 32px; border-radius: 50%; background: var(--raised); color: var(--text-secondary); display: inline-flex; align-items: center; justify-content: center; font: 600 12px var(--font-ui); }
    @media (max-width: 767px) { .search span, kbd { display: none; } .search { flex: 0 0 36px; justify-content: center; padding: 0; } }
  `,
})
export class MkTopBar {
  @Prop() productName = 'Microcks';
  @Prop() primaryActionLabel = 'Import a contract';
  /** User initials shown in the avatar. */
  @Prop() userInitials?: string;

  @Event() mkOpenCommand!: EventEmitter<void>;
  @Event() mkPrimaryAction!: EventEmitter<void>;

  render() {
    return (
      <Host role="banner">
        <div class="bar">
          <slot name="logo">
            <span class="logo">
              <i aria-hidden="true" />
              {this.productName}
            </span>
          </slot>
          <button class="search" onClick={() => this.mkOpenCommand.emit()} aria-label="Open command bar">
            {icon('search', 16)}
            <span>Search services, run actions…</span>
            <kbd>⌘K</kbd>
          </button>
          <div class="right">
            <mk-button variant="primary" size="sm" icon="upload" onMkClick={() => this.mkPrimaryAction.emit()}>
              {this.primaryActionLabel}
            </mk-button>
            <slot name="actions" />
            <mk-theme-toggle />
            {this.userInitials && (
              <span class="user" aria-label="Account">
                {this.userInitials}
              </span>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
