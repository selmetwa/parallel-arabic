<script>
 export let data;
  const sections = data.data; 
</script>

<section class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-8">
  {#each sections as section}
      <a 
      class="p-4 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold"
      href={`write/${section.path}`} 
      >
        {section.name}
        <p class="font-light text-sm">{section.count} words</p>
      </a>
  {/each}
</section>