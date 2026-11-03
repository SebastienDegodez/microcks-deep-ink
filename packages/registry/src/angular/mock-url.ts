import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, signal } from '@angular/core';
import { CopyButtonComponent } from './copy-button';
import { MethodTagComponent } from './method-tag';
import { SegmentedComponent } from './segmented';

export type MockUrlFormat = 'url' | 'curl' | 'httpie' | 'mcp';

export function snippetFor(format: MockUrlFormat, url: string, method: string, mcpTool?: string): string {
  switch (format) {
    case 'curl':
      return method === 'GET' ? `curl ${url}` : `curl -X ${method} ${url}`;
    case 'httpie':
      return `http ${method} ${url}`;
    case 'mcp':
      return JSON.stringify({ tool: mcpTool, arguments: {} });
    default:
      return url;
  }
}

/** A mock endpoint with its method, a format switch (URL, curl, HTTPie, MCP tool) and a copy button. */
@Component({
  selector: 'mk-mock-url',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyButtonComponent, MethodTagComponent, SegmentedComponent],
  styles: [':host { display: contents; }'],
  template: `
    @if (!bare()) {
      <mk-segmented label="Snippet format" [options]="options()" [value]="format()" (valueChange)="chosen.set($any($event))" />
    }
    <div class="di-mock-url">
      <span mkMethodTag [method]="method()"></span>
      <code>{{ text() }}</code>
      <mk-copy-button [value]="text()" [label]="copyLabel()" />
    </div>
  `,
})
export class MockUrlComponent {
  readonly url = input.required<string>();
  readonly method = input('GET');
  /** MCP tool name: adds the "MCP tool" format for agent-ready services. */
  readonly mcpTool = input<string>();
  /** Only the URL, the method tag and the copy button (no format group). */
  readonly bare = input(false, { transform: booleanAttribute });

  protected readonly chosen = signal<MockUrlFormat>('url');
  protected readonly format = computed<MockUrlFormat>(() => (this.bare() || (this.chosen() === 'mcp' && !this.mcpTool()) ? 'url' : this.chosen()));
  protected readonly text = computed(() => snippetFor(this.format(), this.url(), this.method(), this.mcpTool()));
  protected readonly options = computed(() => [
    { id: 'url', label: 'URL' },
    { id: 'curl', label: 'curl' },
    { id: 'httpie', label: 'HTTPie' },
    ...(this.mcpTool() ? [{ id: 'mcp', label: 'MCP tool' }] : []),
  ]);
  protected readonly copyLabel = computed(() => (this.format() === 'url' ? 'Copy URL' : `Copy ${this.options().find((o) => o.id === this.format())?.label ?? ''}`));
}
