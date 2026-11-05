// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatusBadge, type Outcome } from './status-badge';
import { axeViolations } from '../test/axe';

afterEach(cleanup);

const WORDS: Record<Outcome, string> = {
  conformant: 'Conformant',
  failed: 'Failed',
  partial: 'Partial',
  running: 'Running',
  never: 'Never tested',
};

describe('StatusBadge', () => {
  it.each(Object.entries(WORDS))('renders the word for %s', (status, word) => {
    render(<StatusBadge status={status as Outcome} />);
    expect(screen.getByText(word)).toBeTruthy();
  });

  it('keeps the icon decorative', () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lets the label replace the word but never removes it', () => {
    render(<StatusBadge status="partial" label="2 of 3 pass" />);
    expect(screen.getByText('2 of 3 pass')).toBeTruthy();
  });

  it('rings summary icons and dashes "never tested"', () => {
    const { container } = render(<StatusBadge status="never" />);
    expect(container.querySelector('.status')?.getAttribute('data-shape')).toBe('circled');
    expect(container.querySelector('path[stroke-dasharray]')).toBeTruthy();
  });

  it('draws a bare check for step outcomes', () => {
    const { container } = render(<StatusBadge status="conformant" shape="bare" />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12l5 5 9-11');
  });

  it('accepts a rich label and reads it as one phrase inside the status region', () => {
    render(
      <StatusBadge status="running" shape="bare" role="status" label={<>Retrying · attempt <strong>2</strong> of 3</>} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Retrying · attempt 2 of 3');
  });

  it('draws the lg size with a 15px icon whatever the shape', () => {
    const { container } = render(
      <>
        <StatusBadge size="lg" status="conformant" />
        <StatusBadge size="lg" shape="bare" status="running" label="Running · step 2 of 5" />
      </>,
    );
    const badges = container.querySelectorAll('.status[data-size="lg"]');
    expect(badges).toHaveLength(2);
    badges.forEach((b) => expect(b.querySelector('svg')?.getAttribute('width')).toBe('15'));
    expect(screen.getByText('Running · step 2 of 5')).toBeTruthy();
  });

  it('keeps md as the default size', () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.querySelector('.status')?.getAttribute('data-size')).toBe('md');
  });

  it('has no axe violations in every size, with a rich label', async () => {
    const { container } = render(
      <div>
        <StatusBadge size="sm" status="conformant" />
        <StatusBadge status="failed" />
        <StatusBadge size="lg" shape="bare" status="running" role="status" label={<>Retrying · attempt <strong>2</strong> of 3</>} />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it.each([
    ['false', false],
    ['null', null],
    ['an empty string', ''],
    ['a blank string', '   '],
    ['an empty fragment', <></>],
    ['a fragment of nothing', <>{false}{null}</>],
    ['an empty array', []],
  ])('falls back to the status word when the label is %s', (_, label) => {
    render(<StatusBadge status="running" role="status" label={label} />);
    expect(screen.getByRole('status').textContent).toBe('Running');
  });

  it('keeps a label with content as-is, including 0', () => {
    render(<StatusBadge status="failed" role="status" label={0} />);
    expect(screen.getByRole('status').textContent).toBe('0');
  });
});
