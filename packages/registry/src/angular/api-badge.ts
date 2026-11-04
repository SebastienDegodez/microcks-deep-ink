import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from './icon';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
/** `text` / `plain`: unfilled value in --text at 600 / 400; `positive`: unfilled value in --success (the word says it). */
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'action' | 'neutral' | 'muted' | 'text' | 'plain' | 'positive' | 'protocol';

/** One proof value. `icon` leads the value (12px, stroke 3); with `iconLabel` and no `value` the icon stands alone and `iconLabel` is its hidden name. */
export interface ProofValue {
  value?: string;
  status?: ProofStatus;
  icon?: IconName;
  /** Hidden word read with an icon-only value ("supported"). Never rely on the icon or the colour alone. */
  iconLabel?: string;
}

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };
const STATUS_WORD = { success: 'success', danger: 'error', warning: 'warning' } as const;

/**
 * Three segments: type, name, version (or label and value for a proof).
 * The visible text is the accessible name: "REST API Pastry 2.0" or "ARAZZO restock-pastry".
 */
@Component({
  selector: 'span[mkApiBadge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: {
    class: 'api-badge',
    '[attr.data-protocol]': 'dataProtocol()',
    '[attr.data-status]': 'isProof() ? status() : null',
    '[attr.data-size]': 'size()',
    '[attr.data-fill]': 'fill()',
    '[attr.data-version]': 'versionTone() ?? null',
  },
  template: `<span class="api-badge-type">{{ type() }}</span>&ngsp;@if (isProof() && (main() || icon())) {<span class="api-badge-name" [attr.data-icon-only]="icon() && !main() ? '' : null"><ng-container *ngTemplateOutlet="proof; context: { $implicit: mainValue() }" /></span>} @else if (main()) {<span class="api-badge-name">{{ main() }}</span>}&ngsp;@if (!isProof() && version()) {<span class="api-badge-version">{{ version() }}</span>}@if (isProof()) {@for (v of values(); track $index) {&ngsp;<span class="api-badge-value" [attr.data-status]="v.status ?? 'neutral'" [attr.data-icon-only]="v.icon && !v.value ? '' : null"><ng-container *ngTemplateOutlet="proof; context: { $implicit: v }" /></span>}}<ng-template #proof let-v>@if (v.icon) {<svg mkIcon [name]="v.icon" [size]="12"></svg>}{{ v.value }}@if (v.iconLabel) {<span class="sr-only">{{ v.value ? ' ' + v.iconLabel : v.iconLabel }}</span>}@if (filledFor(v.status); as p) {&ngsp;<span class="sr-only">({{ wordFor(p) }})</span>}</ng-template>`,
})
export class ApiBadgeComponent {
  /** Left segment for an API badge. Ignored when `label` or `arazzo` is set. */
  readonly protocol = input<Protocol>();
  /** Renders the inverted ARAZZO workflow segment. */
  readonly arazzo = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly version = input<string>();
  /** Proof badge: metric label (left) and value (right). */
  readonly label = input<string>();
  readonly value = input<string>();
  /** Fill of the proof segment. `protocol`: the fill of `protocol` with --on-proto text ("skills │ 3" on A2A). */
  readonly status = input<ProofStatus>('neutral');
  /** Proof: an icon before the value ("last test │ ✕ 13/15"). Opt-in: proofs have no icon by default. */
  readonly icon = input<IconName>();
  /** Proof: hidden name of an icon-only value (no `value`): "streaming │ ✓" reads "streaming supported". */
  readonly iconLabel = input<string>();
  /** More proof values after `value`, each its own filled segment ("samples │ 7 │ +1 AI"). */
  readonly values = input<ReadonlyArray<ProofValue>>([]);
  /** Version colour: `muted` (default for md, sm), `text` (default for compact and card). */
  readonly versionTone = input<'muted' | 'text'>();
  /** `card`: 13px, for badge walls. `lg` sets the name in the brand font at 17px (beside a page title); `xl` at 30px (the badge is the page title). */
  readonly size = input<'sm' | 'compact' | 'md' | 'card' | 'lg' | 'xl'>('md');

  protected isProof(): boolean {
    return !this.arazzo() && this.label() !== undefined;
  }
  protected type(): string | undefined {
    return this.arazzo() ? 'ARAZZO' : this.isProof() ? this.label() : (this.protocol() ?? 'REST');
  }
  protected dataProtocol(): string | null {
    return this.arazzo() ? 'arazzo' : this.isProof() ? null : PROTOCOL_ATTR[this.protocol() ?? 'REST'];
  }
  protected main(): string | undefined {
    return this.isProof() ? this.value() : this.name();
  }
  protected mainValue(): ProofValue {
    return { value: this.main(), status: this.status(), icon: this.icon(), iconLabel: this.iconLabel() };
  }
  protected fill(): string | null {
    return this.isProof() && this.status() === 'protocol' ? PROTOCOL_ATTR[this.protocol() ?? 'REST'] : null;
  }
  protected filledFor(s: ProofStatus | undefined): 'success' | 'danger' | 'warning' | undefined {
    return s === 'success' || s === 'danger' || s === 'warning' ? s : undefined;
  }
  protected wordFor(s: 'success' | 'danger' | 'warning') {
    return STATUS_WORD[s];
  }
}
