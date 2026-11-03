import { createContext, useContext, type ReactNode } from 'react';
import type { Clock } from '@/application/ports/shared';
import type { UseCases } from '@/application/use-cases';
import { formatRelative } from '@/domain/shared';

interface Services {
  useCases: UseCases;
  clock: Clock;
}

const ServicesContext = createContext<Services | null>(null);

/** Provides the use cases and the clock built by the composition root (`main.tsx`). */
export function UseCasesProvider({ useCases, clock, children }: Services & { children: ReactNode }) {
  return <ServicesContext.Provider value={{ useCases, clock }}>{children}</ServicesContext.Provider>;
}

function useServices(): Services {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('useUseCases() must be used inside <UseCasesProvider>');
  return value;
}

/** The only door from the UI to the application layer. */
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
