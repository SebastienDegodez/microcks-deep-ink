// A demo plugin, written as a plain Web Component, registered into the shared host.
// It proves the contract is framework-agnostic: the same plugin renders in both Storybooks.
// Since <plugin-slot> renders in light DOM, the plugin styles itself with the  CSS API
// and the HTML recipes of the registry (live-indicator, api-badge): no shadow DOM, no mk-* tags.
import { definePlugin, getPluginHost, type SlotContext } from '@microcks-deep-ink/plugin-sdk';
import { SAMPLE_MANIFEST } from './fixtures';

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

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
    // HTML recipes: live-indicator and api-badge (packages/registry/src/html).
    this.innerHTML = `
      <div class="stack" style="--gap: var(--space-2, 8px)">
        <div class="inline">
          <strong>Kafka Replay</strong>
          <span class="live"><span class="live-dot" aria-hidden="true"></span>recording</span>
        </div>
        <span style="color: var(--text-secondary)">
          ${svc ? `Replaying traffic of ${esc(svc.name)} ${esc(svc.version)}` : 'No service in context'}
        </span>
        <span class="api-badge">
          <span class="api-badge-type">replayed</span>
          <span class="api-badge-name">1,204 msgs</span>
        </span>
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
