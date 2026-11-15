import { getContext, setContext } from 'svelte';
import type { Clock } from '@microcks/demo-core/application/ports';
import type { UseCases } from '@microcks/demo-core/application/use-cases';
import { formatRelative } from '@microcks/demo-core/domain/shared';

export interface Services {
  useCases: UseCases;
  clock: Clock;
}

const SERVICES = Symbol('services');

/** Called once by `UseCasesProvider` with the use cases and the clock of the composition root. */
export function provideServices(services: Services): void {
  setContext(SERVICES, services);
}

function useServices(): Services {
  const value = getContext<Services | undefined>(SERVICES);
  if (!value) throw new Error('useUseCases() must be used inside <UseCasesProvider>');
  return value;
}

/** The only door from the UI to the application layer. Call it while the component initialises. */
export function useUseCases(): UseCases {
  return useServices().useCases;
}

/** `now` of the demo (fixed at 2026-11-03T09:10:04Z). */
export function useClock(): Clock {
  return useServices().clock;
}

/** Returns a `formatRelative(now, date)` formatter bound to the demo clock: "2 h ago". */
export function useRelativeTime(): (date: string | Date) => string {
  const clock = useClock();
  return (date) => formatRelative(clock.now(), date);
}
