import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  /** Called when the dialog asks to close: Escape, the close button or a backdrop click. Set `open` to false. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, aligned to the end. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Close on a click on the backdrop. Off by default so a stray click never loses typed data. */
  closeOnBackdrop?: boolean;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog on the native `<dialog>` element. `showModal()` provides the focus trap,
 * the inert background and Escape. Focus returns to the opener when the dialog closes.
 *
 * Initial focus: an element with `data-autofocus`, otherwise the first focusable control of the
 * body or footer, otherwise the close button. (React's `autoFocus` does not set the HTML attribute.)
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', closeOnBackdrop = false, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = description ? `${uid}-desc` : undefined;

  useEffect(() => {
    openRef.current = open;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const preferred =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(`.dialog-body ${FOCUSABLE.split(', ').join(', .dialog-body ')}`) ??
        dialog.querySelector<HTMLElement>(`.dialog-footer ${FOCUSABLE.split(', ').join(', .dialog-footer ')}`);
      preferred?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Optional light dismiss: a click that lands on the dialog element itself is a click on the backdrop.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !closeOnBackdrop) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) onCloseRef.current();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, [closeOnBackdrop]);

  // Restore focus when the dialog is closed, whatever closed it (Escape, button, prop).
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onNativeClose = () => {
      const target = opener.current;
      opener.current = null;
      target?.focus();
      // Escape closes natively: tell the owner so it can set open=false.
      if (openRef.current) onCloseRef.current();
    };
    dialog.addEventListener('close', onNativeClose);
    return () => dialog.removeEventListener('close', onNativeClose);
  }, []);

  return (
    <dialog
      ref={ref}
      className={['dialog', className].filter(Boolean).join(' ')}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {open ? (
        <>
          <div className="dialog-header">
            <h2 className="dialog-title" id={titleId}>
              {title}
            </h2>
            <Button variant="ghost" size="sm" iconOnly icon="close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="dialog-body">
            {description ? (
              <p className="dialog-description" id={descId}>
                {description}
              </p>
            ) : null}
            {children}
          </div>
          {footer ? <div className="dialog-footer">{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}
