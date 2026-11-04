import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

/** The verb is the text, so color is never the only signal: `<span mkMethodTag method="GET"></span>`. */
@Component({
  selector: 'span[mkMethodTag]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'method',
    '[attr.data-method]': 'method()',
    '[attr.data-protocol]': 'protocolAttr()',
    '[style.--method-min-width]': "minWidth() ? minWidth() + 'px' : null",
  },
  template: `{{ method() }}`,
})
export class MethodTagComponent {
  /** GET/POST... for REST, SUBSCRIBE/PUBLISH for EVENT, the RPC name for gRPC, QUERY/MUTATION for GraphQL. */
  readonly method = input.required<string>();
  readonly protocol = input<Protocol>('REST');
  /** Fixed minimum width in px, so tags line up in a list (Import 52, Service 48, Usage 46, Traces 44). */
  readonly minWidth = input<number>();

  protected protocolAttr(): string {
    return PROTOCOL_ATTR[this.protocol()];
  }
}
