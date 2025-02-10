<script>
	import WordBlock from './components/WordBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import { sections } from '$lib/constants/sections';
	import { PUBLIC_PRICE_ID } from '$env/static/public';

  let { data } = $props();

	let index = $state(0);
  let mode = $state('keyboard');
  let word = $derived.by(() => {
    if (data && data.words) {
      return data?.words?.slice(1)[index];
    }

    return {}
  })

	function next() {
		if (index === data.words.length - 1) {
			return;
		}
		index = index + 1;
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
	}

  function handleSwitchMode() {
    mode = mode === 'draw' ? 'keyboard' : 'draw';
  }

  const isPaywalled = sections.find(section => section.path === data.section).isPaywalled ?? false;
</script>

{#if isPaywalled && !data.isSubscribed}
<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
  <h1 class="text-2xl font-bold text-text-300">You are not subscribed.</h1>
  <p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
  <form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
    <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />

    <Button type="submit">Subscribe</Button>
  </form>
</div>
{:else}
<header class="px-4 sm:px-16 bg-tile-400 py-8 text-center border-b border-tile-600">
  <div class="flex w-full justify-between items-center">
    <div class="w-max">
      {#if index > 0}
        <Button onClick={previous} type="button">Previous</Button>
      {/if}
    </div>
    <div>
      <h1 class="text-lg font-bold text-text-300">{index + 1} / {data.words.length}</h1>
    </div>
    <div class="w-max">
      {#if index < data.words.length - 1}
        <Button onClick={next} type="button">Next</Button>
      {/if}
    </div>
  </div>
</header>

<section class="px-4 sm:px-16">
<WordBlock {word} {mode} switchMode={handleSwitchMode} />
</section>
{/if}  
