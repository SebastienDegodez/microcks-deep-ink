import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { ApiBadge } from './api-badge';

describe('ApiBadge sizes and neutral proofs', () => {
  it('has a compact size and a muted proof, with the words as the name', async () => {
    const { container } = render(
      <div>
        <ApiBadge size="compact" protocol="REST" name="API Pastry" version="2.0" />
        <ApiBadge size="compact" label="last import" value="inactive" status="muted" />
      </div>,
    );
    expect(screen.getByText('API Pastry').parentElement?.getAttribute('data-size')).toBe('compact');
    const muted = screen.getByText('inactive').parentElement!;
    expect(muted.getAttribute('data-status')).toBe('muted');
    expect(muted.textContent?.trim()).toBe('last import inactive');
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('ApiBadge unfilled proof values', () => {
  it('keeps the status on the badge and the words as the name', () => {
    render(<ApiBadge size="compact" label="mock url" value="ready" status="positive" />);
    const badge = screen.getByText('ready').parentElement!;
    expect(badge.getAttribute('data-status')).toBe('positive');
    expect(badge.textContent?.trim()).toBe('mock url ready');
  });

  it('proof icon options: leading icon, protocol fill, icon-only with a hidden word', async () => {
    const { container } = render(
      <div>
        <ApiBadge size="compact" label="last test" value="13/15" status="danger" icon="close-sm" />
        <ApiBadge size="compact" label="skills" value="3" status="protocol" protocol="A2A" />
        <ApiBadge size="compact" label="streaming" status="success" icon="check" iconLabel="supported" />
        <ApiBadge size="compact" label="result" value="failed" status="danger" values={[{ value: '92%', status: 'warning', icon: 'warning' }]} />
      </div>,
    );
    const last = screen.getByText('last test').parentElement!;
    expect(last.querySelector('.api-badge-name svg')?.getAttribute('width')).toBe('12');
    expect(last.textContent?.replace(/\s+/g, ' ').trim()).toBe('last test 13/15 (error)');
    const skills = screen.getByText('skills').parentElement!;
    expect(skills.getAttribute('data-status')).toBe('protocol');
    expect(skills.getAttribute('data-fill')).toBe('a2a');
    expect(skills.hasAttribute('data-protocol')).toBe(false);
    const streaming = screen.getByText('streaming').parentElement!;
    expect(streaming.querySelector('[data-icon-only]')).toBeTruthy();
    expect(streaming.textContent?.replace(/\s+/g, ' ').trim()).toBe('streaming supported (success)');
    expect(container.querySelectorAll('.api-badge-value svg')).toHaveLength(1);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('version tone: text colour on request', () => {
    render(<ApiBadge protocol="REST" name="API Pastry" version="2.0" versionTone="text" />);
    expect(screen.getByText('2.0').parentElement!.getAttribute('data-version')).toBe('text');
  });
});
