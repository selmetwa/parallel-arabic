<script lang="ts">
  export let type: "button" | "submit";
  export let onClick: () => void;
</script>

<button 
  class="border border-raison color-black bg-gray-100 hover:bg-gray-200 py-1 font-semibold px-3 w-full text-raison" 
  type={type}
  on:click={onClick}
>
  <slot />
</button>
