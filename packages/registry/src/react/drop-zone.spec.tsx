// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DropZone, filesReadyMessage } from './drop-zone';

afterEach(cleanup);

const file = (name: string) => new File(['x'], name, { type: 'application/json' });

describe('DropZone', () => {
  it('exposes a real, labelled file input', () => {
    render(<DropZone heading="Drop a contract" hint="OpenAPI, AsyncAPI" onFiles={() => {}} />);
    const input = screen.getByLabelText('Choose files') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    // Visually hidden but not removed from the tab order.
    expect(input.tabIndex).not.toBe(-1);
    expect(input.className).toContain('di-sr-only');
  });

  it('announces how many files are ready and calls onFiles', () => {
    const onFiles = vi.fn();
    render(<DropZone heading="Drop" hint="hint" onFiles={onFiles} />);
    const input = screen.getByLabelText('Choose files') as HTMLInputElement;
    const files = [file('a.yaml'), file('b.yaml')];
    fireEvent.change(input, { target: { files } });
    expect(onFiles).toHaveBeenCalledWith(files);
    expect(screen.getByRole('status').textContent).toBe('2 files ready');
  });

  it('accepts dropped files', () => {
    const onFiles = vi.fn();
    const { container } = render(<DropZone heading="Drop" hint="hint" onFiles={onFiles} />);
    const zone = container.querySelector('.di-drop-zone') as HTMLElement;
    fireEvent.dragOver(zone);
    expect(zone.hasAttribute('data-dragging')).toBe(true);
    fireEvent.drop(zone, { dataTransfer: { files: [file('c.json')] } });
    expect(zone.hasAttribute('data-dragging')).toBe(false);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('1 file ready');
  });

  it('formats the live message', () => {
    expect(filesReadyMessage(1)).toBe('1 file ready');
    expect(filesReadyMessage(3)).toBe('3 files ready');
  });
});
