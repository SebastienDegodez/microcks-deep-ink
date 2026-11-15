import { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import type { ButtonProps } from './button';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children' | 'icon' | 'asChild' | 'loading'> {
  /** Text copied to the clipboard. */
  value: string;
  /** Idle label. With `iconOnly` it becomes the accessible name. */
  label?: string;
  /** Label shown for 2 seconds after a successful copy. */
  copiedLabel?: string;
  /** Announced when the copy fails. */
  failedLabel?: string;
  /** Writes the text and resolves to `true` on success. Defaults to `writeClipboard`. */
  copy?: (text: string) => Promise<boolean>;
  /** Called after each attempt with its result. */
  onCopied?: (ok: boolean) => void;
}

type CopyState = 'idle' | 'copied' | 'failed';

/** Default `copy`: the async Clipboard API, then a hidden-textarea fallback. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.insetBlockStart = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Copies `value` to the clipboard. A visually hidden polite live region announces
 * "Copied" or "Copy failed", so the result is never visual only.
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  failedLabel = 'Copy failed',
  copy: write = writeClipboard,
  onCopied,
  size = 'sm',
  variant = 'secondary',
  iconOnly,
  className,
  ...rest
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await write(value).catch(() => false);
    setState(ok ? 'copied' : 'failed');
    onCopied?.(ok);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };

  const text = state === 'copied' ? copiedLabel : label;
  const message = state === 'copied' ? copiedLabel : state === 'failed' ? failedLabel : '';
  const name = iconOnly ? { 'aria-label': text } : {};

  return (
    <>
      <Button
        {...rest}
        {...name}
        size={size}
        variant={variant}
        iconOnly={iconOnly}
        icon={state === 'copied' ? 'check' : 'copy'}
        className={['copy-button', className].filter(Boolean).join(' ')}
        data-state={state === 'idle' ? undefined : state}
        onClick={copy}
      >
        {iconOnly ? null : text}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
    </>
  );
}
