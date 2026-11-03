import { Component, Host, Prop, h } from '@stencil/core';
import { PROTOCOL_TOKEN, Protocol } from '../../utils/types';

/**
 * Operation verb on the service's protocol color.
 * REST: GET/POST…, EVENT: SUBSCRIBE/PUBLISH, gRPC: RPC name, GraphQL: QUERY/MUTATION.
 */
@Component({
  tag: 'mk-method-tag',
  shadow: true,
  styles: `
    :host { display: inline-flex; }
    span {
      font: var(--type-badge); color: var(--on-proto);
      border-radius: var(--radius-control); padding: 3px 7px;
      min-width: 44px; text-align: center; box-sizing: border-box; white-space: nowrap;
    }
  `,
})
export class MkMethodTag {
  @Prop() method = 'GET';
  @Prop() protocol: Protocol = 'REST';

  render() {
    return (
      <Host>
        <span style={{ background: `var(--${PROTOCOL_TOKEN[this.protocol]})` }}>{this.method}</span>
      </Host>
    );
  }
}
