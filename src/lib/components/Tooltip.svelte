<script lang="ts">
  import { fade } from 'svelte/transition';

  interface Props {
    text: string;
    children: import('svelte').Snippet;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }

  let { text, children, position = 'top' }: Props = $props();

  let isVisible = $state(false);

  function showTooltip() {
    isVisible = true;
  }

  function hideTooltip() {
    isVisible = false;
  }

  // Position classes based on position prop
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-tile-600 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-tile-600 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-tile-600 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-tile-600 border-t-transparent border-b-transparent border-l-transparent'
  };
</script>

<div 
  class="relative inline-block"
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocusin={showTooltip}
  onfocusout={hideTooltip}
>
  {@render children()}
  
  {#if isVisible && text}
    <div
      class="absolute z-50 px-3 py-2 text-sm text-text-300 bg-tile-600 rounded shadow-lg whitespace-nowrap pointer-events-none {positionClasses[position]}"
      role="tooltip"
      transition:fade|local={{ duration: 150 }}
    >
      {text}
      <div 
        class="absolute w-0 h-0 border-4 {arrowClasses[position]}"
      ></div>
    </div>
  {/if}
</div>


