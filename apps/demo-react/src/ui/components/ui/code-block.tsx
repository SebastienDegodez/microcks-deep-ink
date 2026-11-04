// Deep Ink · code-block@0.2.0 · copied from packages/registry. You own this file.
import { useId, type HTMLAttributes } from 'react';
import { CopyButton } from './copy-button';

export interface CodeLine {
  text: string;
  /** Marks the line with a visible ✕ and a visible note. */
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
  /** Show the copy button. */
  copy?: boolean;
  /** `plain`: just the bordered code, no header (no caption, tabs or copy). */
  variant?: 'framed' | 'plain';
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
  maxHeight?: string | number;
}

export function CodeBlock({
  code,
  lines,
  language,
  caption,
  copy = true,
  variant = 'framed',
  tabs,
  tab,
  onTabChange,
  tabsLabel = 'Format',
  lineNumbers,
  startLine = 1,
  maxHeight,
  className,
  ...rest
}: CodeBlockProps) {
  const captionId = useId();
  const rows: CodeLine[] | undefined = lines ?? (lineNumbers && code !== undefined ? code.split('\n').map((text) => ({ text })) : undefined);
  const value = code ?? (lines ?? []).map((l) => l.text).join('\n');
  const tabLabel = tabs?.find((t) => t.id === tab)?.label;
  const label = caption ?? (tabLabel ? `${tabLabel} code` : language ? `${language} code` : 'Code');
  const diff = rows?.some((l) => l.changed) ?? false;
  const header = variant !== 'plain' && (caption || copy || tabs?.length);
  return (
    <figure
      {...rest}
      className={['code', className].filter(Boolean).join(' ')}
      data-language={language}
      data-variant={variant}
      data-numbered={lineNumbers ? '' : undefined}
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
          <span className="code-caption" id={captionId}>
            {caption ?? ''}
          </span>
          {copy ? <CopyButton value={value} variant="link" className="code-copy" /> : null}
        </figcaption>
      ) : null}
      {/* The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named. */}
      <pre tabIndex={0} role="region" aria-label={label} style={maxHeight !== undefined ? { maxHeight } : undefined}>
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
                        ✕
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
