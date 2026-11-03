import { Component, Host, Prop, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { Outcome } from '../../utils/types';

const MAP: Record<Outcome, { icon: string; token: string; label: string }> = {
  conformant: { icon: 'check', token: 'success', label: 'Conformant' },
  failed: { icon: 'cross', token: 'danger', label: 'Failed' },
  partial: { icon: 'warning', token: 'warning', label: 'Partial' },
  running: { icon: 'running', token: 'running', label: 'Running' },
  never: { icon: 'circle', token: 'text-muted', label: 'Never tested' },
};

/** An outcome: icon + word + color, never color alone. */
@Component({
  tag: 'mk-status-badge',
  shadow: true,
  styles: `
    :host { display: inline-flex; }
    span { display: inline-flex; align-items: center; gap: 6px; font: 600 14px/20px var(--font-ui); }
    :host([size="sm"]) span { font-size: 12px; gap: 4px; }
    .running svg { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .running svg { animation: none; } }
  `,
})
export class MkStatusBadge {
  @Prop() status: Outcome = 'never';
  /** Overrides the default word. */
  @Prop() label?: string;
  @Prop({ reflect: true }) size: 'md' | 'sm' = 'md';

  render() {
    const s = MAP[this.status] ?? MAP.never;
    return (
      <Host role="status">
        <span class={this.status} style={{ color: `var(--${s.token})` }}>
          {icon(s.icon, this.size === 'sm' ? 14 : 16, 2.5)}
          {this.label ?? s.label}
        </span>
      </Host>
    );
  }
}
