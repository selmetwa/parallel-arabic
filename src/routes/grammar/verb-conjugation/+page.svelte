<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConjugationWrapper from '../components/ConjugationWrapper.svelte';
	import { PUBLIC_TEST_PRICE_ID } from '$env/static/public';
  import { verbToConjugateIndexInStore } from '$lib/store/store'
	export let data;

	$: wordIndex = $verbToConjugateIndexInStore || 0;
	$: verbToConjugate = data.words[wordIndex];
  $: tensesViewed = data.tensesViewed || 0;

  async function updateTensesViewed() {
		await fetch('/api/increment_tenses_viewed', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({})
		}).then((res) => res.json()).then((json) => {
      tensesViewed = json.tensesViewed;
    });
	}

  function next() {
    wordIndex = wordIndex + 1;
    verbToConjugateIndexInStore.set(wordIndex);
  }

  function previous() {
    wordIndex = wordIndex - 1;
    verbToConjugateIndexInStore.set(wordIndex);
  }
</script>

{#if !data.hasActiveSubscription && tensesViewed >= 31}
<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
  <h1 class="text-2xl font-bold text-text-300">You have reached your limit of 30 Verb conjugations.</h1>
  <p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
  <form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
    <input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />
    <Button type="submit">Subscribe</Button>
  </form>
</div>
  {:else}
  <header class="py-2 mt-4">
    <div class="flex flex-row justify-between px-4 sm:px-16">
      <div class="w-fit">
        {#if wordIndex > 0}
          <Button onClick={previous} className="w-fit" type="submit">
            Previous Word
          </Button>
        {/if}
      </div>
      {#if wordIndex < data.words.length - 1}
        <div class="w-fit">
          <Button onClick={next} className="w-fit" type="submit">Next Word</Button>
        </div>
      {/if}
    </div>
  </header>
  <section class="px-4 sm:px-16">
    <ConjugationWrapper 
    {wordIndex} 
    {verbToConjugate}
    {updateTensesViewed}
    >
  </ConjugationWrapper>
  </section>
  
{/if}
