import type { ComponentProps } from 'svelte';
import Exchange from './Exchange.svelte';
import ExchangeCard from './ExchangeCard.svelte';
export type ExchangeProps = ComponentProps<typeof Exchange>;
export type ExchangeCardProps = ComponentProps<typeof ExchangeCard>;
export type { ExchangeBlock } from './ExchangeCard.svelte';
