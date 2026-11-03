import { Component, Host, Prop, h } from '@stencil/core';
import { OperationResult, parseJson } from '../../utils/types';

/** Conformance score broken down by operation: one cell per operation. */
@Component({
  tag: 'mk-conformance-band',
  shadow: true,
  styles: `
    :host { display: block; max-width: 420px; }
    .band { display: flex; gap: 3px; height: 28px; }
    :host([size="mini"]) .band { height: 12px; gap: 2px; }
    .band i { flex: 1; border-radius: 2px; }
    .pass { background: var(--success); } .fail { background: var(--danger); } .untested { background: var(--border); }
    .f { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; }
    .n { font: var(--type-display); font-size: 40px; line-height: 44px; }
    .c { font: var(--type-small); color: var(--text-muted); }
  `,
})
export class MkConformanceBand {
  /** One entry per operation, as an array or JSON string. */
  @Prop() outcomes: OperationResult[] | string = [];
  /** `full` shows the big score; `mini` is the catalogue-row version. */
  @Prop({ reflect: true }) size: 'full' | 'mini' = 'full';

  render() {
    const r = parseJson<OperationResult[]>(this.outcomes, []);
    const pass = r.filter((x) => x === 'pass').length;
    const fail = r.filter((x) => x === 'fail').length;
    const untested = r.length - pass - fail;
    const score = r.length ? Math.round((pass / r.length) * 100) : 0;
    const color = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
    const aria = `${score}% conformance: ${pass} conformant, ${fail} failed, ${untested} not tested`;
    return (
      <Host role="img" aria-label={aria}>
        <div class="band" aria-hidden="true">
          {r.map((x) => (
            <i class={x} />
          ))}
        </div>
        {this.size === 'full' && (
          <div class="f" aria-hidden="true">
            <span class="n" style={{ color: `var(--${color})` }}>
              {score}%
            </span>
            <span class="c">
              {pass} / {r.length} operations conformant
            </span>
          </div>
        )}
      </Host>
    );
  }
}
