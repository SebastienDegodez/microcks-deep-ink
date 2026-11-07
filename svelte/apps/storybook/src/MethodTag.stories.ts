import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { MethodTag } from '@microcks/deep-ink';

const meta = {
  title: 'Presentational/MethodTag',
  component: MethodTag,
  args: { method: 'GET', protocol: 'REST', size: 'md' },
  argTypes: {
    protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'] },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
  },
} satisfies Meta<typeof MethodTag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const REST: Story = {};
export const RESTWrite: Story = { args: { method: 'POST' } };
export const RESTDelete: Story = { args: { method: 'DELETE' } };
export const SOAP: Story = { args: { protocol: 'SOAP', method: 'GetWeather' } };
export const Event: Story = { args: { protocol: 'EVENT', method: 'SUBSCRIBE' } };
export const GRPC: Story = { args: { protocol: 'gRPC', method: 'SayHello' } };
export const GraphQL: Story = { args: { protocol: 'GRAPHQL', method: 'QUERY' } };
export const Direct: Story = { args: { protocol: 'DIRECT', method: 'CALL' } };
export const A2A: Story = { args: { protocol: 'A2A', method: 'SEND' } };
export const Small: Story = { args: { size: 'sm' } };
export const ExtraSmall: Story = { args: { size: 'xs' } };
export const AlignedWidth: Story = { args: { minWidth: 52 } };
