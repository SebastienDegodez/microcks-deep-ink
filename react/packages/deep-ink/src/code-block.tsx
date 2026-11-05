import { useId, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react';
import { CopyButton } from './copy-button';
import { Icon } from './icon';

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

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Plain text. Use `lines` for per-line markers. */
  code?: string;
  lines?: CodeLine[];
  language?: string;
  caption?: string;
  /**
   * Accessible name of the code region when the caption alone is not unique. It must contain the visible
   * caption (RGAA 6.1): write it as caption + suffix, "SendMessage · curl, JSON-RPC binding".
   */
  label?: string;
  /** Show the copy button. */
  copy?: boolean;
  /**
   * `plain`: just the bordered code, no header (no caption, tabs or copy).
   * `bare`: no frame, no header and no padding, for a `<pre>` inside a card that already draws the frame.
   */
  variant?: 'framed' | 'plain' | 'bare';
  /** Source written at the end of the header (mono), next to the caption shown as an uppercase title. */
  source?: string;
  /** `raised`: the header on the raised fill (--raised). */
  headerTone?: 'raised';
  /**
   * `always` (default): the `<pre>` is always a focusable named region. `overflow`: it is focusable and named
   * (role="region" + aria-label) only while its content actually scrolls (RGAA 7.3); otherwise it is plain text.
   */
  focusable?: 'always' | 'overflow';
  /** Format switch in the header (curl, HTTPie, MCP tool call): toggle buttons with aria-pressed. */
  tabs?: CodeTab[];
  tab?: string;
  onTabChange?: (id: string) => void;
  /** Accessible name of the tab group. */
  tabsLabel?: string;
  /** Numbers the lines in a gutter (with `lines`, or `code` split on newlines). */
  lineNumbers?: boolean;
  /** Number of the first line. */
  startLine?: number;
  /** Line-number gutter: `wide` is 44px (default), `narrow` 28px with 6px before the marker column. */
  gutter?: 'wide' | 'narrow';
  /** `danger`: the frame in the danger colour (the whole block failed, e.g. a schema mismatch). */
  tone?: 'danger';
  maxHeight?: string | number;
}

const scrolls = (el: HTMLElement) => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;

export function CodeBlock({
  code,
  lines,
  language,
  caption,
  label: regionLabel,
  copy = true,
  variant = 'framed',
  tabs,
  tab,
  onTabChange,
  tabsLabel = 'Format',
  lineNumbers,
  startLine = 1,
  gutter = 'wide',
  tone,
  maxHeight,
  source,
  headerTone,
  focusable = 'always',
  className,
  ...rest
}: CodeBlockProps) {
  const captionId = useId();
  const rows: CodeLine[] | undefined = lines ?? (lineNumbers && code !== undefined ? code.split('\n').map((text) => ({ text })) : undefined);
  const value = code ?? (lines ?? []).map((l) => l.text).join('\n');
  const tabLabel = tabs?.find((t) => t.id === tab)?.label;
  const label = regionLabel ?? caption ?? (tabLabel ? `${tabLabel} code` : language ? `${language} code` : 'Code');
  const diff = rows?.some((l) => l.changed) ?? false;
  const header = variant === 'framed' && (caption || copy || tabs?.length || source);
  const preRef = useRef<HTMLPreElement>(null);
  const [overflows, setOverflows] = useState(true);
  // Remeasure on every rendered-content change: notes, markers and the gutter change the width without changing the text.
  useLayoutEffect(() => {
    if (focusable === 'overflow' && preRef.current) setOverflows(scrolls(preRef.current));
  }, [focusable, code, lines, lineNumbers, startLine, gutter, variant, maxHeight]);
  // ...and when the box itself is resized (container width, max height).
  useLayoutEffect(() => {
    const pre = preRef.current;
    if (focusable !== 'overflow' || !pre || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setOverflows(scrolls(pre)));
    ro.observe(pre);
    return () => ro.disconnect();
  }, [focusable]);
  const region = focusable !== 'overflow' || overflows;
  return (
    <figure
      {...rest}
      className={['code', className].filter(Boolean).join(' ')}
      data-language={language}
      data-variant={variant}
      data-numbered={lineNumbers ? '' : undefined}
      data-gutter={lineNumbers && gutter === 'narrow' ? 'narrow' : undefined}
      data-tone={tone}
      data-header-tone={header && headerTone ? headerTone : undefined}
      data-diff={diff ? '' : undefined}
    >
      {header ? (
        <figcaption>
          {tabs?.length ? (
            <span className="code-tabs" role="group" aria-label={tabsLabel}>
              {tabs.map((t) => (
                <button key={t.id} type="button" aria-pressed={t.id === tab} onClick={() => onTabChange?.(t.id)}>
                  {t.label}
                </button>
              ))}
            </span>
          ) : null}
          <span className="code-caption" id={captionId} data-title={source ? '' : undefined}>
            {caption ?? ''}
          </span>
          {source ? <span className="code-source">{source}</span> : null}
          {copy ? <CopyButton value={value} variant="link" className="code-copy" /> : null}
        </figcaption>
      ) : null}
      {/* The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named. */}
      <pre
        ref={preRef}
        {...(region ? { tabIndex: 0, role: 'region', 'aria-label': label } : null)}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <code className={language ? `language-${language}` : undefined}>
          {rows
            ? rows.map((line, i) => (
                <span className="code-line" data-bad={line.bad ? '' : undefined} data-selected={line.selected ? '' : undefined} data-changed={line.changed ? '' : undefined} key={i}>
                  {lineNumbers ? (
                    <span className="code-ln" aria-hidden="true">
                      {startLine + i}
                    </span>
                  ) : null}
                  {diff ? (
                    <>
                      <span className="code-mark" data-kind="changed" aria-hidden="true">
                        {line.changed ? '+' : ''}
                      </span>
                      {line.changed ? <span className="sr-only">Changed: </span> : null}
                    </>
                  ) : null}
                  {line.bad ? (
                    <>
                      <span className="code-mark" aria-hidden="true">
                        <Icon name="close" size={11} />
                      </span>
                      <span className="sr-only">Problem: </span>
                    </>
                  ) : null}
                  <span className="code-text">{line.text}</span>
                  {line.note ? <span className="code-note">{line.note}</span> : null}
                </span>
              ))
            : code}
        </code>
      </pre>
    </figure>
  );
}
