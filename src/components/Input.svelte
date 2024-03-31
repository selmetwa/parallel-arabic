<script lang="ts">
  export let placeholder: string;
  export let name: string;
  export let type: string;
</script>

<div class="flex flex-col">
  <label for={name}>{name}</label>
  <input  
    type={type}
    name={name}
    placeholder={placeholder}
    id={name}
    class="py-2 border border-tile-500 rounded-0 text-text-300"
  />
</div>
