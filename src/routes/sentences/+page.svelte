<script lang="ts">
	import SentenceBlock from './components/SentenceBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import SentenceQuiz from './components/SentenceQuiz.svelte';
	import { sentencesInStore } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
  import { updateUrl } from '$lib/helpers/update-url';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type sentenceObjectItem } from '$lib/types/index';
	let { data } = $props();

	let isLoading = $state(false);

  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('sentence') ?? '0') || 0;
      return urlIndex ? urlIndex - 1 : 0;
    }
    return 0;
  })());

  // Function to filter out incomplete sentences
  function filterValidSentences(sentences: any[]): sentenceObjectItem[] {
    return sentences.filter(sentence => 
      sentence && 
      typeof sentence.arabic === 'string' && 
      typeof sentence.english === 'string' && 
      typeof sentence.transliteration === 'string' &&
      sentence.arabic.trim() !== '' &&
      sentence.english.trim() !== '' &&
      sentence.transliteration.trim() !== ''
    );
  }

  let sentences = $state((() => {
    if (typeof window !== 'undefined') {
      const savedSentences = localStorage.getItem('sentences');
      if (savedSentences) {
        const parsed = JSON.parse(savedSentences);
        return filterValidSentences(parsed);
      }
    }
    const storeSentences = Array.isArray($sentencesInStore) ? $sentencesInStore : [];
    return filterValidSentences(storeSentences);
})());

  let sentence = $derived(sentences[index]);
  $effect(() => {
    if (sentences.length > 0) {
      index = Math.min(index, sentences.length - 1);
    }
  });

	let option = $state('beginner');

  let mode = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') || 'write';
    }
  })());

	let sentencesViewed = $state(data.sentencesViewed);

	async function generateSentance(option: string, copy: any) {
		isLoading = true;
		const res = await fetch('/api/generate-sentences', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				option,
				sentences: copy
			})
		});

		const chatgptres = await res.json();
		const jsonBlob = chatgptres.message.message.content;
		const _sentences = JSON.parse(jsonBlob);
		const newSentences = filterValidSentences(_sentences.sentences || []);
		const updatedSentences = [...sentences, ...newSentences];
		sentences = updatedSentences;
		sentencesInStore.set(updatedSentences);
    localStorage.setItem('sentences', JSON.stringify(updatedSentences));
		isLoading = false;
	}

	async function updateSentencesViewed() {
		const res = await fetch('/api/increment-sentences', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({})
		});
		const json = await res.json();
		sentencesViewed = json.sentencesViewed;
	}
	function next() {
		if (index === sentences.length - 1) {
			return;
		}

		updateSentencesViewed();
		index = index + 1;
    updateUrl('sentence', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('sentence', (index+1).toString());
	}

	function setMode(event: any) {
		mode = event.target.value || 'write';
    updateUrl('mode', mode);
	}

	function setOption(event: any) {
		option = event.target.value;
	}

	function generateSentences(event: any) {
		event.preventDefault();
		const copy = [...sentences];
		generateSentance(option, copy);
	}

	function loadMoreSentences() {
		generateSentance(option, sentences);
	}

  function resetSentences() {
    sentences = [];
    index = 0;
    localStorage.removeItem('sentences');
    updateUrl('sentence', '0');
  }

	let isLastSentence = $derived(index === sentences.length - 1);

	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 20);
</script>

{#if !data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">
			You must have an account to access this content.
		</h1>
		<div class="mx-auto mt-4 w-fit">
			<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
		</div>
	</div>
{/if}

{#if hasReachedLimit && data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 20 sentences.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<!-- Modify this value using your own Stripe price_id -->
			<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />

			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit && data.session}
	<section class="mx-auto mt-12 w-full border border-tile-500 bg-tile-300 sm:w-1/2">
		<form class="flex flex-col gap-3 p-5" onsubmit={generateSentences}>
			<p class="text-3xl font-bold text-text-300">
				Practice your egyptian arabic skills with generated sentences.
			</p>
			<p class="text-md text-text-300">Select difficulty.</p>
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setOption}
				selectableFor="beginner"
				isSelected={option === 'beginner'}
				value="beginner"
				text="Beginner"
			>
			</RadioButton>
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setOption}
				selectableFor="intermediate"
				isSelected={option === 'intermediate'}
				text="Intermediate"
				value="intermediate"></RadioButton
			>
      <RadioButton
      className="!text-xl"
      wrapperClass="!p-2"
      onClick={setOption}
      selectableFor="advanced"
      isSelected={option === 'advanced'}
      text="Advanced"
      value="advanced"></RadioButton
    >
    <hr class="border border-tile-600 my-2">
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setMode}
				selectableFor="write"
				isSelected={mode === 'write'}
				value="write"
				text="Practice Writing"
			>
			</RadioButton>
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setMode}
				selectableFor="quiz"
				isSelected={mode === 'quiz'}
				value="quiz"
				text="Multiple Choice Quiz"
			>
			</RadioButton>
			<Button type="submit">Generate Sentences</Button>
		</form>
	</section>
{/if}

{#if isLoading}
	<div
		class="mx-auto my-12 flex w-fit flex-col items-center gap-3 border border-tile-600 bg-tile-400 p-4 text-text-200 sm:flex-row"
	>
  <AlphabetCycle />
		<p class="text-2xl text-text-300">
			Generating your sentences, hang tight. <br />
			this usually takes a few seconds.
		</p>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit && data.session}
	<header class="m-auto border-b border-tile-600 bg-tile-400 px-4 py-8 pb-4 text-center sm:px-16">
		<div class="flex w-full items-center justify-between">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {sentences.length}</h1>
			</div>
			<div class="w-max">
				{#if index < sentences.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
				{#if isLastSentence && !isLoading}
					<Button onClick={loadMoreSentences} type="button">Load More Sentences</Button>
				{/if}
			</div>
		</div>
	</header>

	{#if mode === 'write'}
		<section class="px-4 pb-4 sm:px-16">
			<SentenceBlock {sentence} {resetSentences} />
		</section>
	{/if}

	{#if mode === 'quiz'}
		<SentenceQuiz {sentences} {index} {resetSentences} />
	{/if}
{/if}
