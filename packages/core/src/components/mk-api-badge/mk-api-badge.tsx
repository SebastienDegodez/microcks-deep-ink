import { Component, Host, Prop, h } from '@stencil/core';
import { PROTOCOL_TOKEN, ProofStatus, Protocol } from '../../utils/types';

/**
 * Signature component: a two-segment shield.
 * Left = what (protocol, metric label, or ARAZZO). Right = who (name + version) or proof (status fill).
 * @part what - Left segment.
 * @part who - Right segment.
 */
@Component({
  tag: 'mk-api-badge',
  shadow: true,
  styles: `
    :host { display: inline-flex; vertical-align: middle; }
    .b {
      display: inline-flex; overflow: hidden;
      font: var(--type-badge); font-weight: 400;
      border: 1px solid var(--border); border-radius: var(--radius-badge);
      white-space: nowrap;
    }
    .b > span { padding: 5px 9px; }
    .what { font-weight: 600; color: var(--on-proto); }
    .what.metric { background: var(--raised); color: var(--text-secondary); font-weight: 400; }
    .what.arazzo { background: var(--text); color: var(--bg); }
    .who { background: var(--surface); color: var(--text); }
    .who.proof { font-weight: 600; color: var(--on-status); }
    .proof.success { background: var(--success); }
    .proof.danger { background: var(--danger); }
    .proof.warning { background: var(--warning); }
    .proof.info { background: var(--link); color: var(--on-action); }
    .proof.neutral { background: var(--surface); color: var(--text-secondary); font-weight: 400; }
    :host([size="sm"]) .b > span { padding: 2px 6px; font-size: 11px; }
  `,
})
export class MkApiBadge {
  /** Protocol shown in the left segment. Ignored when `label` or `arazzo` is set. */
  @Prop() protocol?: Protocol;
  /** Metric label for proof badges (conformance, last test, mcp, samples). */
  @Prop() label?: string;
  /** Renders the inverted ARAZZO workflow segment. */
  @Prop() arazzo = false;
  /** Service or workflow name. */
  @Prop() name?: string;
  @Prop() version?: string;
  /** Proof value, used with `label`. */
  @Prop() value?: string;
  /** Fill of the proof segment. */
  @Prop() status: ProofStatus = 'neutral';
  @Prop({ reflect: true }) size: 'md' | 'sm' = 'md';

  render() {
    const isProof = !!this.label && !this.arazzo;
    const leftText = this.arazzo ? 'ARAZZO' : isProof ? this.label : this.protocol ?? 'REST';
    const leftStyle =
      !isProof && !this.arazzo
        ? { background: `var(--${PROTOCOL_TOKEN[(this.protocol ?? 'REST') as Protocol]})` }
        : {};
    const right = isProof ? this.value : [this.name, this.version].filter(Boolean).join(' ');
    const aria = isProof ? `${this.label}: ${this.value}` : `${leftText} ${right}`;
    return (
      <Host role="img" aria-label={aria}>
        <span class="b" aria-hidden="true">
          <span part="what" class={{ what: true, metric: isProof, arazzo: this.arazzo }} style={leftStyle}>
            {leftText}
          </span>
          {right && (
            <span part="who" class={{ who: true, proof: isProof, [this.status]: isProof }}>
              {right}
            </span>
          )}
        </span>
      </Host>
    );
  }
}
