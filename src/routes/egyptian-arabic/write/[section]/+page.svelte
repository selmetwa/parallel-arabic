<script>
	// import WordBlock from './components/WordBlock.svelte';
  import WriteWordBlock from '$lib/components/dialect-shared/vocab/WriteWordBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import { sections } from '$lib/constants/sections';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
  import { updateUrl } from '$lib/helpers/update-url';
  let { data } = $props();
  $inspect(data);
  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('word') ?? '0') || 0;
      // Ensure index is within bounds
      return Math.min(Math.max(urlIndex-1, 0), (data?.words?.length ?? 1) - 1);
    }
    return 0;
  })());

  let mode = $state('keyboard');
  $inspect(data);
  let word = $derived.by(() => {
    if (data && data.words && data.words.length > 0) {
      const currentWord = data.words[index];
      return {
        english: currentWord.english || '',
        arabic: currentWord.arabic || '',
        transliteration: currentWord.transliteration || '',
        audioUrl: currentWord.audioUrl || undefined
      };
    }

    return {
      english: '',
      arabic: '',
      transliteration: '',
      audioUrl: undefined
    }
  })

	function next() {
		if (index === data.words.length - 1) {
			return;
		}
		index = index + 1;
    updateUrl('word', (index+1) .toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
    updateUrl('word', (index+1).toString());
	}

  function handleSwitchMode() {
    mode = mode === 'draw' ? 'keyboard' : 'draw';
    updateUrl('mode', mode);
  }

  const isPaywalled = sections.find(section => section.path === data.section)?.isPaywalled ?? false;
</script>

{#if isPaywalled && !data.isSubscribed}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">You are not subscribed.</h1>
			<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
			<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
				<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
				<Button type="submit">Subscribe</Button>
			</form>
		</div>
	</div>
{:else}
	<header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center sm:px-8">
		<div class="flex w-full items-center justify-between max-w-5xl mx-auto">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {data.words.length} words</h1>
			</div>
			<div class="w-max">
				{#if index < data.words.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
			</div>
		</div>
	</header>

	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		{#if word.english}
			<WriteWordBlock {word} {mode} switchMode={handleSwitchMode} dialect="egyptian-arabic" />
		{/if}
	</div>
{/if}  
