import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Exchange, ExchangeCard } from './exchange-card';

describe('ExchangeCard', () => {
  it('names each card and block, writes the status and hides the separator', async () => {
    const { container } = render(
      <main>
        <h3>Eclair Cafe</h3>
        <Exchange>
          <ExchangeCard title="Request" label="Request of Eclair Cafe" meta="Eclair Cafe" blocks={[{ label: 'Request line', text: 'GET /pastries/Eclair%20Cafe', tone: 'secondary' }, { label: 'Parameters', text: 'name = Eclair Cafe', tone: 'params' }]} />
          <ExchangeCard title="Response" label="Response of Eclair Cafe" status="404 Not Found" statusTone="warning" blocks={[{ label: 'Response body', text: '{}', grow: true }]} />
        </Exchange>
      </main>,
    );
    const req = screen.getByRole('region', { name: 'Request of Eclair Cafe' });
    expect(req.querySelectorAll('pre')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Parameters' }).getAttribute('data-tone')).toBe('params');
    expect(screen.getByRole('region', { name: 'Response body' }).tabIndex).toBe(0);
    expect(screen.getByText('404 Not Found').getAttribute('data-tone')).toBe('warning');
    expect(screen.getByRole('heading', { level: 4, name: 'Response' })).toBeTruthy();
    expect(container.querySelector('.exchange-sep')?.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });
});
