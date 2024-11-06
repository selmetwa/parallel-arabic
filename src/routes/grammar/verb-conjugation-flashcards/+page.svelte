<script>
  import Button from '$lib/components/Button.svelte';
  import ConjugationTable from './components/ConjugationTable.svelte';
  let { data } = $props();

  let wordIndex = $state(0);
  let word = $derived(data.words[wordIndex]);
  function next() {
		wordIndex = wordIndex + 1;
	}

	function previous() {
		wordIndex = wordIndex - 1;
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