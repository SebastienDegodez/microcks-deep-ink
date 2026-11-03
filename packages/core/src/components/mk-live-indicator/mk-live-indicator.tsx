import { Component, Host, Prop, h } from '@stencil/core';

/** Baseline-pink marker of a real-time stream. Not a status: never show it for a finished result. */
@Component({
  tag: 'mk-live-indicator',
  shadow: true,
  styles: `
    :host { display: inline-flex; }
    span {
      display: inline-flex; align-items: center; gap: 8px;
      font: 400 12px/16px var(--font-mono); color: var(--live-text);
      border: 1px solid var(--live); border-radius: var(--radius-pill); padding: 4px 12px;
    }
    i { width: 8px; height: 8px; border-radius: var(--radius-pill); background: var(--live); animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: .35; } }
    @media (prefers-reduced-motion: reduce) { i { animation: none; } }
  `,
})
export class MkLiveIndicator {
  @Prop() label = 'live';

  render() {
    return (
      <Host role="status" aria-live="polite">
        <span>
          <i aria-hidden="true" />
          {this.label}
        </span>
      </Host>
    );
  }
}
