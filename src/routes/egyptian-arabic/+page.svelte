<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/egyptian-arabic/stories', { replaceState: true });
  });
</script>

<!-- Redirect to stories -->
<div class="flex items-center justify-center min-h-[50vh]">
  <p class="text-text-200">Redirecting to stories...</p>
</div>
