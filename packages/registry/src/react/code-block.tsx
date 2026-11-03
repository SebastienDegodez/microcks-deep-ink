import { useId, type HTMLAttributes } from 'react';
import { CopyButton } from './copy-button';

export interface CodeLine {
  text: string;
  /** Marks the line with a visible ✕ and a visible note. */
  bad?: boolean;
  note?: string;
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Plain text. Use `lines` for per-line markers. */
  code?: string;
  lines?: CodeLine[];
  language?: string;
  caption?: string;
  /** Show the copy button. */
  copy?: boolean;
  maxHeight?: string | number;
}

export function CodeBlock({ code, lines, language, caption, copy = true, maxHeight, className, ...rest }: CodeBlockProps) {
  const captionId = useId();
  const value = code ?? (lines ?? []).map((l) => l.text).join('\n');
  const label = caption ?? (language ? `${language} code` : 'Code');
  return (
    <figure {...rest} className={['code', className].filter(Boolean).join(' ')} data-language={language}>
      {caption || copy ? (
        <figcaption>
          <span className="code-caption" id={captionId}>
            {caption ?? ''}
          </span>
          {copy ? <CopyButton value={value} /> : null}
        </figcaption>
      ) : null}
      {/* The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named. */}
      <pre tabIndex={0} role="region" aria-label={label} style={maxHeight !== undefined ? { maxHeight } : undefined}>
        <code className={language ? `language-${language}` : undefined}>
          {lines
            ? lines.map((line, i) => (
                <span className="code-line" data-bad={line.bad ? '' : undefined} key={i}>
                  {line.bad ? (
                    <>
                      <span className="code-mark" aria-hidden="true">
                        ✕
                      </span>
                      <span className="sr-only">Problem:</span>
                      {' '}
                    </>
                  ) : null}
                  {line.text}
                  {line.note ? <span className="code-note">{line.note}</span> : null}
                </span>
              ))
            : code}
        </code>
      </pre>
    </figure>
  );
}
