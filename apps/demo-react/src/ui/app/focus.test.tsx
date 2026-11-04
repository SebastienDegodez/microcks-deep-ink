import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAutoFocus, useReturnFocus } from './focus';
import { PAGE_TITLE_ID } from './usePageTitle';

afterEach(cleanup);

function DeleteList() {
  const [rows, setRows] = useState(['a', 'b']);
  const [undo, setUndo] = useState(false);
  const { focusLater } = useReturnFocus();
  return (
    <section aria-label="Rows">
      <ul>
        {rows.map((r) => (
          <li key={r}>
            <button
              type="button"
              onClick={() => {
                setRows((x) => x.filter((y) => y !== r));
                setUndo(true);
                focusLater('[data-undo]');
              }}
            >
              Delete {r}
            </button>
          </li>
        ))}
      </ul>
      {undo ? (
        <button type="button" data-undo>
          Undo
        </button>
      ) : null}
    </section>
  );
}

function InlineForm() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const { focusLater } = useReturnFocus();
  useAutoFocus(form, open);
  return (
    <div>
      {open ? (
        <form ref={form} aria-label="Add header">
          <input aria-label="Name" />
          <input aria-label="Value" data-autofocus />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              focusLater(opener);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" ref={opener} onClick={() => setOpen(true)}>
          Add header
        </button>
      )}
    </div>
  );
}

function Fallbacks({ withRegion }: { withRegion: boolean }) {
  const [shown, setShown] = useState(true);
  const { focusLater } = useReturnFocus();
  const button = shown ? (
    <button
      type="button"
      onClick={() => {
        setShown(false);
        focusLater('#does-not-exist');
      }}
    >
      Dismiss
    </button>
  ) : null;
  return (
    <>
      <h1 id={PAGE_TITLE_ID} tabIndex={-1}>
        Page
      </h1>
      {withRegion ? <section aria-label="Panel">{button}</section> : button}
    </>
  );
}

describe('useReturnFocus', () => {
  it('moves focus to the Undo button that replaces a deleted row', () => {
    render(<DeleteList />);
    const del = screen.getByRole('button', { name: 'Delete a' });
    del.focus();
    act(() => fireEvent.click(del));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Undo' }));
  });

  it('returns focus to the opener when an inline form closes (ref target)', () => {
    render(<InlineForm />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Add header' })));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    cancel.focus();
    act(() => fireEvent.click(cancel));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add header' }));
  });

  it('falls back to the closest region that held the focused control', () => {
    render(<Fallbacks withRegion />);
    const b = screen.getByRole('button', { name: 'Dismiss' });
    b.focus();
    act(() => fireEvent.click(b));
    const region = screen.getByRole('region', { name: 'Panel' });
    expect(document.activeElement).toBe(region);
    expect(region.getAttribute('tabindex')).toBe('-1');
  });

  it('falls back to the page h1 when no region is left', () => {
    render(<Fallbacks withRegion={false} />);
    const b = screen.getByRole('button', { name: 'Dismiss' });
    b.focus();
    act(() => fireEvent.click(b));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });

  it('accepts a function target', () => {
    function Run() {
      const [done, setDone] = useState(false);
      const { focusLater } = useReturnFocus();
      return done ? (
        <h2 id="verdict" tabIndex={-1}>
          Verdict
        </h2>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDone(true);
            focusLater(() => document.getElementById('verdict'));
          }}
        >
          Finish
        </button>
      );
    }
    render(<Run />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Finish' })));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Verdict' }));
  });
});

describe('useAutoFocus', () => {
  it('focuses [data-autofocus] inside the form when it opens', () => {
    render(<InlineForm />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Add header' })));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Value' }));
  });

  it('focuses the first field when nothing is marked', () => {
    function Plain() {
      const ref = useRef<HTMLDivElement>(null);
      useAutoFocus(ref, true);
      return (
        <div ref={ref}>
          <p>Text</p>
          <input aria-label="First" />
          <input aria-label="Second" />
        </div>
      );
    }
    render(<Plain />);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'First' }));
  });

  it('does nothing while closed', () => {
    function Closed() {
      const ref = useRef<HTMLDivElement>(null);
      useAutoFocus(ref, false);
      return (
        <div ref={ref}>
          <input aria-label="Field" />
        </div>
      );
    }
    render(<Closed />);
    expect(document.activeElement).toBe(document.body);
  });
});
