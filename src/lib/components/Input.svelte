<script lang="ts">
  interface Props {
    name: string;
    type: string;
  }

  let { name, type }: Props = $props();
</script>

<div class="flex flex-col">
  <label for={name} class="text-text-200">{name}</label>
  <input  
    type={type}
    name={name}
    id={name}
    class="py-2 border border-tile-600 bg-tile-200 rounded-0 text-text-300 "
  />
</div>
