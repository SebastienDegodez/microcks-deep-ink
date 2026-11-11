import { getContext, setContext } from 'svelte';

export type Announce = (message: string) => void;

const ANNOUNCER = Symbol('announcer');
const silent: Announce = () => undefined;

/** Called once by `LiveAnnouncerProvider`. */
export function provideAnnouncer(announce: Announce): void {
  setContext(ANNOUNCER, announce);
}

/** Returns `announce(message)`: a polite announcement through the shell's live region. */
export function useAnnounce(): Announce {
  return getContext<Announce | undefined>(ANNOUNCER) ?? silent;
}
