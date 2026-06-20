<script lang="ts">
  import { goto } from '$app/navigation';
  import ImportWordsModal from '$lib/components/review/ImportWordsModal.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let open = $state(true);

  function handleClose() {
    open = false;
    goto('/review');
  }
</script>

<div class="min-h-screen bg-tile-300">
  <ImportWordsModal bind:open user={data.user} onClose={handleClose} />
</div>
