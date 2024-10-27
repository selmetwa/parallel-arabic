<script lang="ts">
  import cn from "classnames";
  type Props = {
    className?: string;
    type: "button" | "submit";
    onClick?: (() => void) | undefined;
    children?: import('svelte').Snippet;
  }

  let {
    className = "",
    type,
    onClick = undefined,
    children
  }: Props = $props();
  </script>

  <button 
    class={cn("border border-tile-600 text-text-300 bg-tile-500 hover:bg-tile-600 duration-300 py-1 font-semibold px-3 w-full whitespace-nowrap text-text-300", className)}
    type={type}
    onclick={onClick}
  >
  <slot></slot>
    <!-- {@render children?.()} -->
</button>

