import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Segmented } from './segmented';

describe('Segmented options', () => {
  it('colours and sizes the icons, and exposes the fill, size and spacing hooks', async () => {
    const { container } = render(
      <Segmented
        label="Status"
        value="imported"
        onChange={() => {}}
        pressedFill="selected"
        iconSize={13}
        spacing="wide"
        options={[{ id: 'all', label: 'All' }, { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success' }]}
      />,
    );
    const group = screen.getByRole('group', { name: 'Status' });
    expect(group.getAttribute('data-pressed-fill')).toBe('selected');
    expect(group.getAttribute('data-spacing')).toBe('wide');
    const icon = screen.getByRole('button', { name: 'Imported' }).querySelector('svg')!;
    expect(icon.getAttribute('width')).toBe('13');
    expect(icon.getAttribute('data-tone')).toBe('success');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has a compact joined size', () => {
    render(<Segmented label="Script language" variant="joined" size="sm" value="g" onChange={() => {}} options={[{ id: 'g', label: 'Groovy' }, { id: 'j', label: 'JavaScript' }]} />);
    expect(screen.getByRole('group', { name: 'Script language' }).getAttribute('data-size')).toBe('sm');
  });
});
