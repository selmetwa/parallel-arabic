<script lang="ts">
  export let type: "button" | "submit";
  export let onClick: () => void;
</script>

<button 
  class="border border-raison color-text-300 bg-gray-100 hover:bg-gray-200 py-1 font-semibold px-3 w-full whitespace-nowrap text-raison" 
  type={type}
  on:click={onClick}
>
  <slot />
</button>
