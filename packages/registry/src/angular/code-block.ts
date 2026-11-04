import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { CopyButtonComponent } from './copy-button';

export interface CodeLine {
  text: string;
  /** Marks the line with a visible ✕ and a visible note. */
  bad?: boolean;
  /** Inline note written after the text, on the same row ("schema: number"). */
  note?: string;
  /** Highlights the line (selected block). */
  selected?: boolean;
}

export interface CodeTab {
  id: string;
  label: string;
}

/**
 * Code in a `<figure>`. The scroll container is focusable and named (WCAG 2.1.1). A bad line has a
 * visible ✕ marker and note, not color alone. Use `code` for plain text or `lines` for markers.
 * Keep the `<pre>` template on one line: whitespace inside `<pre>` is preserved.
 */
@Component({
  selector: 'figure[mkCodeBlock]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyButtonComponent],
  host: {
    class: 'code',
    '[attr.data-language]': 'language() || null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-numbered]': "lineNumbers() ? '' : null",
  },
  template: `
    @if (header()) {
      <figcaption>
        @if (tabs()?.length) {
          <span class="code-tabs" role="group" [attr.aria-label]="tabsLabel()">
            @for (t of tabs(); track t.id) {
              <button type="button" [attr.aria-pressed]="t.id === tab()" (click)="tab.set(t.id)">{{ t.label }}</button>
            }
          </span>
        }
        <span class="code-caption" [id]="captionId">{{ caption() ?? '' }}</span>
        @if (copy()) {
          <mk-copy-button class="code-copy" [value]="value()" />
        }
      </figcaption>
    }
    <pre tabindex="0" role="region" [attr.aria-label]="name()" [style.max-height]="maxHeight() ?? null"><code [class]="language() ? 'language-' + language() : ''">@if (rows(); as ls) {@for (line of ls; track $index) {<span class="code-line" [attr.data-bad]="line.bad ? '' : null" [attr.data-selected]="line.selected ? '' : null">@if (lineNumbers()) {<span class="code-ln" aria-hidden="true">{{ startLine() + $index }}</span>}@if (line.bad) {<span class="code-mark" aria-hidden="true">✕</span><span class="sr-only">Problem: </span>}<span class="code-text">{{ line.text }}</span>@if (line.note) {<span class="code-note">{{ line.note }}</span>}</span>}} @else {{{ code() }}}</code></pre>
  `,
})
export class CodeBlockComponent {
  /** Plain text. Use `lines` for per-line markers. */
  readonly code = input<string>();
  readonly lines = input<CodeLine[]>();
  readonly language = input<string>();
  readonly caption = input<string>();
  /** Show the copy button. */
  readonly copy = input(true, { transform: booleanAttribute });
  readonly maxHeight = input<string>();
  /** `plain`: just the bordered code, no header (no caption, tabs or copy). */
  readonly variant = input<'framed' | 'plain'>('framed');
  /** Format switch in the header (curl, HTTPie, MCP tool call): toggle buttons with aria-pressed. */
  readonly tabs = input<CodeTab[]>();
  readonly tab = model<string>();
  /** Accessible name of the tab group. */
  readonly tabsLabel = input('Format');
  /** Numbers the lines in a gutter (with `lines`, or `code` split on newlines). */
  readonly lineNumbers = input(false, { transform: booleanAttribute });
  /** Number of the first line. */
  readonly startLine = input(1);

  protected readonly rows = computed<CodeLine[] | undefined>(() => {
    const ls = this.lines();
    if (ls) return ls;
    const c = this.code();
    return this.lineNumbers() && c !== undefined ? c.split('\n').map((text) => ({ text })) : undefined;
  });
  protected header(): boolean {
    return this.variant() !== 'plain' && Boolean(this.caption() || this.copy() || this.tabs()?.length);
  }

  private static nextId = 0;
  protected readonly captionId = `mk-code-caption-${++CodeBlockComponent.nextId}`;

  protected value(): string {
    return this.code() ?? (this.lines() ?? []).map((l) => l.text).join('\n');
  }
  protected name(): string {
    const tabLabel = this.tabs()?.find((t) => t.id === this.tab())?.label;
    return this.caption() ?? (tabLabel ? `${tabLabel} code` : this.language() ? `${this.language()} code` : 'Code');
  }
}
