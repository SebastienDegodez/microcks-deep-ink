import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ApiBadge } from '@microcks/deep-ink';
import ApiBadgeStory from './Microcks.ApiBadge.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/ApiBadge', component: ApiBadge, parameters: itemParams(['api-badge','icon'], 'Three segments: type, name, version. The visible text is the accessible name ("REST API Pastry 2.0"). The Arazzo variant inverts the left segment and never uses a protocol color.') } satisfies Meta<typeof ApiBadge>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({ render: (() => ({ Component: ApiBadgeStory, props: { variant: 'Default' } })) as never });
/** `versionTone="muted"` lowers the weight of the version next to the name. */
export const MutedVersion = story({ name: 'Muted version', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'MutedVersion' } })) as never });
export const Small = story({ render: (() => ({ Component: ApiBadgeStory, props: { variant: 'Small' } })) as never });
export const Workflow = story({ name: 'Arazzo workflow', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'Workflow' } })) as never });
export const Proof = story({ render: (() => ({ Component: ApiBadgeStory, props: { variant: 'Proof' } })) as never });
export const PageHeader = story({ name: 'Page header sizes', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'PageHeader' } })) as never });
export const ProofValues = story({ name: 'Proof with several values', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'ProofValues' } })) as never });
export const Card = story({ name: 'Card (badge wall)', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'Card' } })) as never });
export const CompactAndMuted = story({ name: 'Compact rows, neutral and muted proofs', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'CompactAndMuted' } })) as never });
export const WorkflowHeader = story({ name: 'Workflow title and unfilled proofs', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'WorkflowHeader' } })) as never });
export const ProofIcons = story({ name: 'Proof icons, protocol fill, icon-only', render: (() => ({ Component: ApiBadgeStory, props: { variant: 'ProofIcons' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { protocol: 'REST', name: 'API Pastry', version: '2.0', arazzo: false, versionTone: undefined, size: 'md' }, argTypes: { protocol: { control: 'select', options: ['REST','SOAP','EVENT','gRPC','GRAPHQL','DIRECT','A2A'] }, versionTone: { control: 'inline-radio', options: [undefined,'muted','text'] }, size: { control: 'select', options: ['sm','compact','md','card','lg','xl'] }, status: { control: 'select', options: ['success','danger','warning','info','action','neutral','muted','text','plain','positive','protocol'] } } });
