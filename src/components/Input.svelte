<script lang="ts">
  export let name: string;
  export let type: string;
</script>

<div class="flex flex-col">
  <label for={name}>{name}</label>
  <input  
    type={type}
    name={name}
    id={name}
    class="py-1 border border-tile-600 bg-tile-200 rounded-0 text-text-300 "
  />
</div>
