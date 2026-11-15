<script lang="ts">
  import type { Component } from 'svelte';
  import NativeStory from './NativeStory.svelte';
  interface StoryTree { Component: Component<any>; props?: Record<string, unknown>; inner?: StoryTree }
  let { result }: { result: StoryTree } = $props();
</script>
{#if result.inner}
  <result.Component {...result.props}><NativeStory result={result.inner} /></result.Component>
{:else}
  <result.Component {...result.props} />
{/if}
