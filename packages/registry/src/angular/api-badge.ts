import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'action' | 'neutral' | 'muted';

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };
const STATUS_WORD = { success: 'success', danger: 'error', warning: 'warning' } as const;

/**
 * Three segments: type, name, version (or label and value for a proof).
 * The visible text is the accessible name: "REST API Pastry 2.0" or "ARAZZO restock-pastry".
 */
@Component({
  selector: 'span[mkApiBadge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'api-badge',
    '[attr.data-protocol]': 'dataProtocol()',
    '[attr.data-status]': 'isProof() ? status() : null',
    '[attr.data-size]': 'size()',
  },
  template: `<span class="api-badge-type">{{ type() }}</span>&ngsp;@if (main()) {<span class="api-badge-name">{{ main() }}@if (proofIcon(); as p) {&ngsp;<span class="sr-only">({{ wordFor(p) }})</span>}</span>}&ngsp;@if (!isProof() && version()) {<span class="api-badge-version">{{ version() }}</span>}@if (isProof()) {@for (v of values(); track $index) {&ngsp;<span class="api-badge-value" [attr.data-status]="v.status ?? 'neutral'">{{ v.value }}@if (filledFor(v.status); as p) {&ngsp;<span class="sr-only">({{ wordFor(p) }})</span>}</span>}}`,
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
  /** Fill of the proof segment. */
  readonly status = input<ProofStatus>('neutral');
  /** More proof values after `value`, each its own filled segment ("samples │ 7 │ +1 AI"). */
  readonly values = input<ReadonlyArray<{ value: string; status?: ProofStatus }>>([]);
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
  protected proofIcon(): 'success' | 'danger' | 'warning' | undefined {
    const s = this.status();
    return this.isProof() && (s === 'success' || s === 'danger' || s === 'warning') ? s : undefined;
  }
  protected filledFor(s: ProofStatus | undefined): 'success' | 'danger' | 'warning' | undefined {
    return s === 'success' || s === 'danger' || s === 'warning' ? s : undefined;
  }
  protected wordFor(s: 'success' | 'danger' | 'warning') {
    return STATUS_WORD[s];
  }
}
