// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { axeViolations } from '../test/axe';
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
    expect(input.className).toContain('sr-only');
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
    const zone = container.querySelector('.drop-zone') as HTMLElement;
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

  it('small size: secondary Choose, rich hint and extra actions, single file', async () => {
    const { container } = render(
      <DropZone size="sm" heading="Drop a snapshot here" hint={<>A <code>microcks-repository.json</code> exported from any Microcks instance</>} chooseLabel="Choose a file" multiple={false} accept=".json" onFiles={() => {}}>
        <button type="button" className="button" data-variant="link">Use a sample snapshot</button>
      </DropZone>,
    );
    const zone = screen.getByRole('group', { name: 'Drop a snapshot here' });
    expect(zone.getAttribute('data-size')).toBe('sm');
    expect(screen.getByText('Choose a file').getAttribute('data-variant')).toBe('secondary');
    expect(screen.getByRole('button', { name: 'Use a sample snapshot' })).toBeTruthy();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.multiple).toBe(false);
    expect(screen.getByLabelText('Choose a file')).toBe(input);
    expect(container.querySelector('.drop-zone-icon svg')?.getAttribute('width')).toBe('28');
    expect(await axeViolations(container)).toEqual([]);
  });
});
