<script>
  import Button from '$lib/components/Button.svelte';
  import ConjugationTable from './components/ConjugationTable.svelte';
	import { updateUrl } from '$lib/helpers/update-url';

  let { data } = $props();

  let wordIndex = $state(
		(() => {
			if (typeof window !== 'undefined') {
				const params = new URLSearchParams(window.location.search);
				const urlIndex = parseInt(params.get('verb') ?? '0') || 0;
				// Ensure index is within bounds
				return Math.min(Math.max(urlIndex-1, 0), (data?.words?.length ?? 1) - 1);
			}
			return 0;
		})()
	);

  let word = $derived(data.words[wordIndex]);
  function next() {
		wordIndex = wordIndex + 1;
		updateUrl('verb', (wordIndex+1).toString());
	}

	function previous() {
		wordIndex = wordIndex - 1;
		updateUrl('verb', (wordIndex+1).toString());
	}
</script>

<header class="mt-4 py-2">
  <div class="flex flex-row justify-between px-4 sm:px-16">
    <div class="w-fit">
      {#if wordIndex > 0}
        <Button onClick={previous} className="w-fit" type="submit">Previous Word</Button>
      {/if}
    </div>
    <div class="w-fit">
      {wordIndex + 1} / {data.words.length}
    </div>
    {#if wordIndex < data.words.length - 1}
      <div class="w-fit">
        <Button onClick={next} className="w-fit" type="submit">Next Word</Button>
      </div>
    {/if}
  </div>
</header>
<section class="px-4 sm:px-12">
  <ConjugationTable
    word={word}
  ></ConjugationTable>
</section>