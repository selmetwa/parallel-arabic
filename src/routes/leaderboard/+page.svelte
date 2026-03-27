<script lang="ts">
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="px-3 mt-6 sm:px-8 max-w-2xl mx-auto">
  <Leaderboard top10={data.top10} currentUser={data.currentUser} compact={false} />
</section>
