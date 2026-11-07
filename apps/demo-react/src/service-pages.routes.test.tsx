import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createTestRouter } from '@/ui/app/router';

function renderAt(path: string) {
  const { useCases, clock } = createComposition();
  return render(
    <UseCasesProvider useCases={useCases} clock={clock}>
      <RouterProvider router={createTestRouter([path])} />
    </UseCasesProvider>,
  );
}

// Event (kafka://) and gRPC (grpc://) mock bases used to crash the Service page: `new URL()` of the Request pane.
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
