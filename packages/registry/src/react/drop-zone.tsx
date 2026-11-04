import { useEffect, useId, useRef, useState, type ChangeEvent, type HTMLAttributes } from 'react';
import { Icon } from './icon';

export interface DropZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  heading: string;
  hint: string;
  /** Passed to the native input as a picker hint. Validate files in your application. */
  accept?: string;
  multiple?: boolean;
  /** Visible label of the file picker button ("Browse"). */
  chooseLabel?: string;
  onFiles: (files: File[]) => void;
}

export function filesReadyMessage(count: number): string {
  return `${count} ${count === 1 ? 'file' : 'files'} ready`;
}

/**
 * A real file input (visually hidden, still focusable) named by a visible "Choose files" label.
 * Drag and drop is an enhancement: every function works with the keyboard.
 */
export function DropZone({ heading, hint, accept, multiple = true, chooseLabel = 'Choose files', onFiles, className, ...rest }: DropZoneProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');

  const take = (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    setMessage(filesReadyMessage(files.length));
    onFiles(files);
  };

  // Drag and drop is an enhancement, attached as DOM listeners: the zone itself is not an interactive
  // control (the file input is), so it carries no JSX event handlers.
  const zoneRef = useRef<HTMLDivElement>(null);
  const takeRef = useRef(take);
  useEffect(() => {
    takeRef.current = take;
  });
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const over = (e: Event) => {
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: Event) => {
      if (!zone.contains((e as DragEvent).relatedTarget as Node | null)) setDragging(false);
    };
    const drop = (e: Event) => {
      e.preventDefault();
      setDragging(false);
      takeRef.current((e as DragEvent).dataTransfer?.files ?? null);
    };
    zone.addEventListener('dragover', over);
    zone.addEventListener('dragleave', leave);
    zone.addEventListener('drop', drop);
    return () => {
      zone.removeEventListener('dragover', over);
      zone.removeEventListener('dragleave', leave);
      zone.removeEventListener('drop', drop);
    };
  }, []);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    take(e.target.files);
    e.target.value = '';
  };

  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={`${id}-heading`}
      className={['drop-zone', className].filter(Boolean).join(' ')}
      data-dragging={dragging ? '' : undefined}
      ref={zoneRef}
    >
      <span className="drop-zone-icon" aria-hidden="true">
        <Icon name="upload" size={24} />
      </span>
      <p className="drop-zone-heading" id={`${id}-heading`}>
        {heading}
      </p>
      <p className="drop-zone-hint" id={`${id}-hint`}>
        {hint}
      </p>
      <input
        id={id}
        type="file"
        className="drop-zone-input sr-only"
        accept={accept}
        multiple={multiple}
        aria-describedby={`${id}-heading ${id}-hint`}
        onChange={onChange}
      />
      <label htmlFor={id} className="button drop-zone-choose" data-variant="primary">
        {chooseLabel}
      </label>
      <p className="drop-zone-status" role="status" data-empty={message ? undefined : ''}>
        {message}
      </p>
    </div>
  );
}
