import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import App from '@/ui/app/App.svelte';
import { resetPageFocusState } from '@/ui/app/page-title.svelte.js';
import { createAppRouter } from '@/ui/app/routes';

function renderAt(path: string) {
  window.history.replaceState(null, '', `#${path}`);
  const { useCases, clock } = createComposition();
  const router = createAppRouter();
  return render(App, { props: { useCases, clock, router } });
}

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});

// Event (kafka://) and gRPC (grpc://) mock bases must work in the Request pane too.
describe('service pages of non-HTTP APIs', () => {
  it.each([
    ['usersignedup', /User signed-up API/, 'SUBSCRIBE /user-signedup HTTP/1.1\nHost: microcks-kafka:9092'],
    ['orders', /Pastry orders API/, 'PUBLISH /pastry-orders-events HTTP/1.1\nHost: microcks-kafka:9092'],
    ['hellogrpc', /HelloService/, 'RPC /HelloService/greeting'],
  ])('/services/%s renders its heading, operations and example without error', async (id, name, requestLine) => {
    renderAt(`/services/${id}`);
    expect(await screen.findByRole('heading', { level: 1, name })).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
    expect(screen.getByRole('tablist', { name: 'Service sections' })).toBeTruthy();
    expect(await screen.findByRole('tab', { name: /^Operations/, selected: true })).toBeTruthy();
    expect(await screen.findByText((_, el) => el?.tagName === 'PRE' && !!el.textContent?.startsWith(requestLine))).toBeTruthy();
  });
});
