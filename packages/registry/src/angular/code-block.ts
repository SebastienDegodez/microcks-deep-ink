import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CopyButtonComponent } from './copy-button';
import { IconComponent } from './icon';

export interface CodeLine {
  text: string;
  /** Marks the line with a visible cross (11px icon) and a hidden "Problem: " prefix; add a `note`. */
  bad?: boolean;
  /** Inline note written after the text, on the same row ("schema: number"). */
  note?: string;
  /** Highlights the line (selected block). */
  selected?: boolean;
  /**
   * Marks a changed line of a diff (CI snippet): a visible "+" in a 22px mark column, the selected fill and a hidden
   * "Changed: " prefix. When one line is changed, every line keeps the empty column so the text stays aligned.
   */
  changed?: boolean;
}

export interface CodeTab {
  id: string;
  label: string;
}

/**
 * Code in a `<figure>`. The scroll container is focusable and named (WCAG 2.1.1). A bad line has a
 * visible cross marker and note, not color alone. Use `code` for plain text or `lines` for markers.
 * With `focusable="overflow"` the `<pre>` is focusable and named only while it actually scrolls (RGAA 7.3).
 * Keep the `<pre>` template on one line: whitespace inside `<pre>` is preserved.
 */
@Component({
  selector: 'figure[mkCodeBlock]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyButtonComponent, IconComponent],
  host: {
    class: 'code',
    '[attr.data-language]': 'language() || null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-numbered]': "lineNumbers() ? '' : null",
    '[attr.data-gutter]': "lineNumbers() && gutter() === 'narrow' ? 'narrow' : null",
    '[attr.data-tone]': 'tone() ?? null',
    '[attr.data-header-tone]': 'header() && headerTone() ? headerTone() : null',
    '[attr.data-diff]': "diff() ? '' : null",
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
        <span class="code-caption" [id]="captionId" [attr.data-title]="source() ? '' : null">{{ caption() ?? '' }}</span>
        @if (source()) {
          <span class="code-source">{{ source() }}</span>
        }
        @if (copy()) {
          <mk-copy-button class="code-copy" variant="link" [value]="value()" />
        }
      </figcaption>
    }
    <pre #pre [attr.tabindex]="region() ? 0 : null" [attr.role]="region() ? 'region' : null" [attr.aria-label]="region() ? name() : null" [style.max-height]="maxHeight() ?? null"><code [class]="language() ? 'language-' + language() : ''">@if (rows(); as ls) {@for (line of ls; track $index) {<span class="code-line" [attr.data-bad]="line.bad ? '' : null" [attr.data-selected]="line.selected ? '' : null" [attr.data-changed]="line.changed ? '' : null">@if (lineNumbers()) {<span class="code-ln" aria-hidden="true">{{ startLine() + $index }}</span>}@if (diff()) {<span class="code-mark" data-kind="changed" aria-hidden="true">{{ line.changed ? '+' : '' }}</span>@if (line.changed) {<span class="sr-only">Changed: </span>}}@if (line.bad) {<span class="code-mark" aria-hidden="true"><svg mkIcon name="close" [size]="11"></svg></span><span class="sr-only">Problem: </span>}<span class="code-text">{{ line.text }}</span>@if (line.note) {<span class="code-note">{{ line.note }}</span>}</span>}} @else {{{ code() }}}</code></pre>
  `,
})
export class CodeBlockComponent {
  /** Plain text. Use `lines` for per-line markers. */
  readonly code = input<string>();
  readonly lines = input<CodeLine[]>();
  readonly language = input<string>();
  readonly caption = input<string>();
  /**
   * Accessible name of the code region when the caption alone is not unique. It must contain the visible
   * caption (RGAA 6.1): write it as caption + suffix, "SendMessage · curl, JSON-RPC binding".
   */
  readonly label = input<string>();
  /** Show the copy button. */
  readonly copy = input(true, { transform: booleanAttribute });
  readonly maxHeight = input<string>();
  /**
   * `plain`: just the bordered code, no header (no caption, tabs or copy).
   * `bare`: no frame, no header and no padding, for a `<pre>` inside a card that already draws the frame.
   */
  readonly variant = input<'framed' | 'plain' | 'bare'>('framed');
  /** Source written at the end of the header (mono), next to the caption shown as an uppercase title. */
  readonly source = input<string>();
  /** `raised`: the header on the raised fill (--raised). */
  readonly headerTone = input<'raised'>();
  /**
   * `always` (default): the `<pre>` is always a focusable named region. `overflow`: it is focusable and named
   * (role="region" + aria-label) only while its content actually scrolls (RGAA 7.3); otherwise it is plain text.
   */
  readonly focusable = input<'always' | 'overflow'>('always');
  /** Format switch in the header (curl, HTTPie, MCP tool call): toggle buttons with aria-pressed. */
  readonly tabs = input<CodeTab[]>();
  readonly tab = model<string>();
  /** Accessible name of the tab group. */
  readonly tabsLabel = input('Format');
  /** Numbers the lines in a gutter (with `lines`, or `code` split on newlines). */
  readonly lineNumbers = input(false, { transform: booleanAttribute });
  /** Number of the first line. */
  readonly startLine = input(1);
  /** Line-number gutter: `wide` is 44px (default), `narrow` 28px with 6px before the marker column. */
  readonly gutter = input<'wide' | 'narrow'>('wide');
  /** `danger`: the frame in the danger colour (the whole block failed, e.g. a schema mismatch). */
  readonly tone = input<'danger'>();

  protected readonly rows = computed<CodeLine[] | undefined>(() => {
    const ls = this.lines();
    if (ls) return ls;
    const c = this.code();
    return this.lineNumbers() && c !== undefined ? c.split('\n').map((text) => ({ text })) : undefined;
  });
  protected readonly diff = computed(() => this.rows()?.some((l) => l.changed) ?? false);
  protected header(): boolean {
    return this.variant() === 'framed' && Boolean(this.caption() || this.copy() || this.tabs()?.length || this.source());
  }

  private readonly pre = viewChild<ElementRef<HTMLPreElement>>('pre');
  private readonly overflows = signal(true);
  protected readonly region = computed(() => this.focusable() !== 'overflow' || this.overflows());

  constructor() {
    let ro: ResizeObserver | undefined;
    inject(DestroyRef).onDestroy(() => ro?.disconnect());
    afterRenderEffect(() => {
      const el = this.pre()?.nativeElement;
      this.code();
      this.lines();
      this.maxHeight();
      ro?.disconnect();
      ro = undefined;
      if (this.focusable() !== 'overflow' || !el) return;
      const measure = () => this.overflows.set(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      ro = new ResizeObserver(measure);
      ro.observe(el);
    });
  }

  private static nextId = 0;
  protected readonly captionId = `mk-code-caption-${++CodeBlockComponent.nextId}`;

  protected value(): string {
    return this.code() ?? (this.lines() ?? []).map((l) => l.text).join('\n');
  }
  protected name(): string {
    const tabLabel = this.tabs()?.find((t) => t.id === this.tab())?.label;
    return this.label() ?? this.caption() ?? (tabLabel ? `${tabLabel} code` : this.language() ? `${this.language()} code` : 'Code');
  }
}
