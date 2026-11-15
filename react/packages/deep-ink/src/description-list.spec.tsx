import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { DescriptionList } from './description-list';

describe('DescriptionList', () => {
  it('renders term/value pairs in a native <dl> and marks mono values', async () => {
    const { container } = render(
      <DescriptionList className="extra" items={[{ term: 'Version', value: '1.2.0', mono: true }, { term: 'Owner', value: 'Team A' }]} />,
    );
    const dl = container.querySelector('dl')!;
    expect(dl.className).toBe('dl extra');
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Version', 'Owner']);
    const values = screen.getAllByRole('definition');
    expect(values[0]!.hasAttribute('data-mono')).toBe(true);
    expect(values[1]!.hasAttribute('data-mono')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });
});
