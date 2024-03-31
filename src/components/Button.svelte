<script lang="ts">
  export let type: "button" | "submit";
  export let onClick: () => void | undefined;
</script>

<button 
  class="border border-tile-600 text-text-300 bg-tile-500 hover:bg-tile-600 py-1 font-semibold px-3 w-full whitespace-nowrap text-text-300"
  type={type}
  on:click={onClick}
>
  <slot />
</button>
