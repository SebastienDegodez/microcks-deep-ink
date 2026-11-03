// A demo plugin, written as a plain Web Component, registered into the shared host.
// It proves the contract is framework-agnostic: the same plugin renders in both Storybooks.
import { definePlugin, getPluginHost, type SlotContext } from '@microcks-deep-ink/plugin-sdk';
import { SAMPLE_MANIFEST } from './fixtures';

class AcmeReplayWidget extends HTMLElement {
  private _ctx?: SlotContext;
  set context(ctx: SlotContext) {
    this._ctx = ctx;
    this.render();
  }
  connectedCallback() {
    this.render();
  }
  private render() {
    const svc = this._ctx?.service;
    this.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;font:var(--type-body);color:var(--text)">
        <div style="display:flex;align-items:center;gap:8px">
          <strong style="font:var(--type-heading)">Kafka Replay</strong>
          <mk-live-indicator label="recording"></mk-live-indicator>
        </div>
        <span style="font:var(--type-small);color:var(--text-muted)">
          ${svc ? `Replaying traffic of ${svc.name} ${svc.version}` : 'No service in context'}
        </span>
        <mk-api-badge label="replayed" value="1,204 msgs" status="info"></mk-api-badge>
      </div>`;
  }
}

if (!customElements.get('acme-replay-widget')) customElements.define('acme-replay-widget', AcmeReplayWidget);

export const demoPlugin = definePlugin({
  manifest: SAMPLE_MANIFEST,
  activate(api) {
    api.contribute('nav.items', { id: 'replay', title: 'Kafka Replay', element: 'acme-replay-widget' });
    api.contribute('service.tabs', {
      id: 'replay-tab',
      title: 'Replay',
      element: 'acme-replay-widget',
      when: (ctx) => ctx.service?.protocol === 'EVENT',
    });
    api.contribute('cockpit.widgets', { id: 'replay-widget', element: 'acme-replay-widget' });
  },
});

let registered: Promise<void> | undefined;
export function registerDemoPlugin(): Promise<void> {
  const host = getPluginHost();
  if (host.list().some((m) => m.id === SAMPLE_MANIFEST.id)) return Promise.resolve();
  return (registered ??= host.register(demoPlugin));
}
