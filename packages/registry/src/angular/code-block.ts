import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CopyButtonComponent } from './copy-button';

export interface CodeLine {
  text: string;
  /** Marks the line with a visible ✕ and a visible note. */
  bad?: boolean;
  note?: string;
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
  host: { class: 'di-code', '[attr.data-language]': 'language() || null' },
  template: `
    @if (caption() || copy()) {
      <figcaption>
        <span class="di-code-caption" [id]="captionId">{{ caption() ?? '' }}</span>
        @if (copy()) {
          <mk-copy-button [value]="value()" />
        }
      </figcaption>
    }
    <pre tabindex="0" role="region" [attr.aria-label]="name()" [style.max-height]="maxHeight() ?? null"><code [class]="language() ? 'language-' + language() : ''">@if (lines(); as ls) {@for (line of ls; track $index) {<span class="di-code-line" [attr.data-bad]="line.bad ? '' : null">@if (line.bad) {<span class="di-code-mark" aria-hidden="true">✕</span><span class="di-sr-only">Problem:</span> }{{ line.text }}@if (line.note) {<span class="di-code-note">{{ line.note }}</span>}</span>}} @else {{{ code() }}}</code></pre>
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

  private static nextId = 0;
  protected readonly captionId = `mk-code-caption-${++CodeBlockComponent.nextId}`;

  protected value(): string {
    return this.code() ?? (this.lines() ?? []).map((l) => l.text).join('\n');
  }
  protected name(): string {
    return this.caption() ?? (this.language() ? `${this.language()} code` : 'Code');
  }
}
