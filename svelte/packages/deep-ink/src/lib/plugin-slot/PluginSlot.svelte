<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ExtensionPointId, SlotContext, PluginSlotElement } from './plugin-slot.js';
  import '../internal/elements/plugin-slot.js';
  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & { point: ExtensionPointId; context?: SlotContext; outlined?: boolean; children?: Snippet; element?: PluginSlotElement };
  let { point, context = { theme: 'dark' }, outlined, children, element = $bindable(), ...rest }: Props = $props();
  $effect(() => { if (element) { element.point = point; element.context = context; if (outlined !== undefined) element.outlined = outlined; } });
</script>
<plugin-slot bind:this={element} {...rest}>{@render children?.()}</plugin-slot>
