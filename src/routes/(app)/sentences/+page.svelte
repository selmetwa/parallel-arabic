<script>
  import { onMount } from 'svelte';
  $: isLoading = false;
  $: sentences = [];

  onMount(async () => {
    isLoading = true;
    const res = await fetch('/api/generate-sentences', {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  const chatgptres = await res.json();
  const jsonBlob = chatgptres.message.message.content;
  const _sentences = JSON.parse(jsonBlob);
  sentences = _sentences.sentences;
  isLoading = false;
  console.log({ sentences })
  });
</script>

{#if isLoading}
  <p>Loading...</p>
{:else}
  {#each sentences as sentence}
    <p>{JSON.stringify(sentence)}</p>
  {/each}
{/if}