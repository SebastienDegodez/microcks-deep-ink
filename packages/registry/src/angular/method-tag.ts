import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct' };

/** The verb is the text, so color is never the only signal: `<span mkMethodTag method="GET"></span>`. */
@Component({
  selector: 'span[mkMethodTag]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'di-method', '[attr.data-method]': 'method()', '[attr.data-protocol]': 'protocolAttr()' },
  template: `{{ method() }}`,
})
export class MethodTagComponent {
  /** GET/POST... for REST, SUBSCRIBE/PUBLISH for EVENT, the RPC name for gRPC, QUERY/MUTATION for GraphQL. */
  readonly method = input.required<string>();
  readonly protocol = input<Protocol>('REST');

  protected protocolAttr(): string {
    return PROTOCOL_ATTR[this.protocol()];
  }
}
