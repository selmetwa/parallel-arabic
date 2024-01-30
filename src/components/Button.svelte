<script lang="ts">
  export let type: "button" | "submit";
</script>

<button 
  class="border border-raison color-black bg-gray-100 hover:bg-gray-200 py-2 font-semibold px-3 w-full text-raison" 
  type={type}
>
  <slot />
</button>
