<script lang="ts">
  import cn from "classnames";
  export let className = ""
  export let type: "button" | "submit";
  export let onClick: (() => void) | undefined = undefined;
</script>

<button 
  class={cn("border border-tile-600 text-text-300 bg-tile-500 hover:bg-tile-600 duration-300 py-1 font-semibold px-3 w-full whitespace-nowrap text-text-300", className)}
  type={type}
  on:click={onClick}
>
  <slot />
</button>
