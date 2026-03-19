<script lang="ts">
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
</script>

<div class="flex flex-col items-center gap-4 py-6">
  <AlphabetCycle size={100} duration={1200} />

  <p class="text-text-300 text-sm text-center">
    <span class="inline-block animate-bounce mr-1">🌙</span>
    Baking your daily challenge...
  </p>
</div>
