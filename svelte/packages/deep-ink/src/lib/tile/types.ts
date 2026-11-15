import type { ComponentProps } from 'svelte';
import Tile from './Tile.svelte';
import TileGrid from './TileGrid.svelte';
export type TileProps = ComponentProps<typeof Tile>;
export type TileGridProps = ComponentProps<typeof TileGrid>;
export type { TileActionProps } from './Tile.svelte';
