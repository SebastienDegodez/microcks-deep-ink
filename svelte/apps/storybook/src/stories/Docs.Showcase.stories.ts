import exampleSource0 from './Docs.Showcase/Colours.svelte?raw';
import exampleSource1 from './Docs.Showcase/Frame.svelte?raw';
import exampleSource2 from './Docs.Showcase/Swatch.svelte?raw';
import exampleSource3 from './Docs.Showcase/Typography.svelte?raw';
import exampleSource4 from './Docs.Showcase/ShapesAndDepth.svelte?raw';
import exampleSource5 from './Docs.Showcase/TokenValue.svelte?raw';
import exampleSource6 from './Docs.Showcase/ApiBadges.svelte?raw';
import exampleSource7 from './Docs.Showcase/Actions.svelte?raw';
import exampleSource8 from './Docs.Showcase/CommandBarShowcase.svelte?raw';
import exampleSource9 from './Docs.Showcase/DomainComponents.svelte?raw';
import exampleSource10 from '../usage/natural-form.example.svelte?raw';
import exampleSource11 from '../usage/natural-callout.example.svelte?raw';
import exampleSource12 from '../usage/microcks-header.example.svelte?raw';
import exampleSource13 from '../usage/microcks-operations.example.svelte?raw';
import exampleSource14 from '../usage/elements-loom.example.svelte?raw';
import exampleSource15 from '../usage/elements-slot.example.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import ColoursBlock from './Docs.Showcase/Colours.svelte';
import TypographyBlock from './Docs.Showcase/Typography.svelte';
import ShapesAndDepthBlock from './Docs.Showcase/ShapesAndDepth.svelte';
import ApiBadgesBlock from './Docs.Showcase/ApiBadges.svelte';
import ActionsBlock from './Docs.Showcase/Actions.svelte';
import CommandBarShowcaseBlock from './Docs.Showcase/CommandBarShowcase.svelte';
import DomainComponentsBlock from './Docs.Showcase/DomainComponents.svelte';
import ImportFromUrlBlock from '../usage/natural-form.example.svelte';
import UnsavedChangesBlock from '../usage/natural-callout.example.svelte';
import ServiceHeaderBlock from '../usage/microcks-header.example.svelte';
import OperationsBlock from '../usage/microcks-operations.example.svelte';
import UpdatePriceBlock from '../usage/elements-loom.example.svelte';
import ServicePanelsBlock from '../usage/elements-slot.example.svelte';

export default { title: 'Docs/Showcase', tags: ['!dev', '!autodocs'], parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta;
export const Colours: StoryObj<typeof ColoursBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/Colours.svelte -->", exampleSource0, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1, "<!-- Docs.Showcase/Swatch.svelte -->", exampleSource2].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: ColoursBlock, props: {} }) };
export const Typography: StoryObj<typeof TypographyBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/Typography.svelte -->", exampleSource3, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: TypographyBlock, props: {} }) };
export const ShapesAndDepth: StoryObj<typeof ShapesAndDepthBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/ShapesAndDepth.svelte -->", exampleSource4, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1, "<!-- Docs.Showcase/TokenValue.svelte -->", exampleSource5].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: ShapesAndDepthBlock, props: {} }) };
export const ApiBadges: StoryObj<typeof ApiBadgesBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/ApiBadges.svelte -->", exampleSource6, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: ApiBadgesBlock, props: {} }) };
export const Actions: StoryObj<typeof ActionsBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/Actions.svelte -->", exampleSource7, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: ActionsBlock, props: {} }) };
export const CommandBarShowcase: StoryObj<typeof CommandBarShowcaseBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/CommandBarShowcase.svelte -->", exampleSource8, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: CommandBarShowcaseBlock, props: {} }) };
export const DomainComponents: StoryObj<typeof DomainComponentsBlock> = {
  parameters: { docs: { source: { code: ["<!-- Docs.Showcase/DomainComponents.svelte -->", exampleSource9, "<!-- Docs.Showcase/Frame.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, render: () => ({ Component: DomainComponentsBlock, props: {} }) };
export const ImportFromUrl: StoryObj<typeof ImportFromUrlBlock> = {
  parameters: { docs: { source: { code: exampleSource10, language: 'svelte', type: 'code' } } }, render: () => ({ Component: ImportFromUrlBlock, props: {} }) };
export const UnsavedChanges: StoryObj<typeof UnsavedChangesBlock> = {
  parameters: { docs: { source: { code: exampleSource11, language: 'svelte', type: 'code' } } }, render: () => ({ Component: UnsavedChangesBlock, props: {} }) };
export const ServiceHeader: StoryObj<typeof ServiceHeaderBlock> = {
  parameters: { docs: { source: { code: exampleSource12, language: 'svelte', type: 'code' } } }, render: () => ({ Component: ServiceHeaderBlock, props: {} }) };
export const Operations: StoryObj<typeof OperationsBlock> = {
  parameters: { docs: { source: { code: exampleSource13, language: 'svelte', type: 'code' } } }, render: () => ({ Component: OperationsBlock, props: {} }) };
export const UpdatePrice: StoryObj<typeof UpdatePriceBlock> = {
  parameters: { docs: { source: { code: exampleSource14, language: 'svelte', type: 'code' } } }, render: () => ({ Component: UpdatePriceBlock, props: {} }) };
export const ServicePanels: StoryObj<typeof ServicePanelsBlock> = {
  parameters: { docs: { source: { code: exampleSource15, language: 'svelte', type: 'code' } } }, render: () => ({ Component: ServicePanelsBlock, props: {} }) };
