<script lang="ts">
  interface Props {
    class?: string;
  }
  let { class: className = '' }: Props = $props();
</script>

<div class="flex h-[175px] w-fit {className}">
  <img 
    src="/icons/icon.png" 
    alt="Parallel Arabic Logo" 
    class="h-full w-auto object-contain"
    width="175"
    height="175"
    fetchpriority="high"
  />
</div>
