<script lang="ts">
  import SentenceBlock from '$lib/components/dialect-shared/sentences/SentenceBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
  import SentenceQuiz from '$lib/components/dialect-shared/sentences/SentenceQuiz.svelte';
	import { iraqiSentencesInStore, currentDialect } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
  import { updateUrl } from '$lib/helpers/update-url';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type sentenceObjectItem } from '$lib/types/index';
  import { onMount } from 'svelte';
	let { data } = $props();

	let isLoading = $state(false);
	let isError = $state(false);
	let errorMessage = $state('');

  onMount(() => {
    currentDialect.set('iraqi');
  });

  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('sentence_iraqi') ?? '0') || 0;
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
      const savedSentences = localStorage.getItem('sentences_iraqi');
      if (savedSentences) {
        const parsed = JSON.parse(savedSentences);
        return filterValidSentences(parsed);
      }
    }
    const storeSentences = Array.isArray($iraqiSentencesInStore) ? $iraqiSentencesInStore : [];
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
		isError = false;
		errorMessage = '';
    
    try {
      const res = await fetch('/api/generate-sentences', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          option,
          sentences: copy,
          dialect: 'iraqi'
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const chatgptres = await res.json();
      
      if (!chatgptres.message?.message?.content) {
        throw new Error('Invalid response format from server');
      }
      
      const jsonBlob = chatgptres.message.message.content;
      const _sentences = JSON.parse(jsonBlob);
      const newSentences = filterValidSentences(_sentences.sentences || []);
      
      if (newSentences.length === 0) {
        throw new Error('No valid sentences were generated. Please try again.');
      }
      
      const updatedSentences = [...sentences, ...newSentences];
      sentences = updatedSentences;
      iraqiSentencesInStore.set(updatedSentences as any);
      localStorage.setItem('sentences_iraqi', JSON.stringify(updatedSentences));
    } catch (error) {
      console.error('Error generating sentences:', error);
      isError = true;
      errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
    } finally {
      isLoading = false;
    }
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
    updateUrl('sentence_iraqi', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('sentence_iraqi', (index+1).toString());
	}

	function setMode(event: any) {
		const newMode = event.target.value || 'write';
		mode = newMode;
    updateUrl('mode', newMode);
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
    localStorage.removeItem('sentences_iraqi');
    updateUrl('sentence_iraqi', '0');
  }

	let isLastSentence = $derived(index === sentences.length - 1);

	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 5);
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

{#if isError}
	<div class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-tile-600 bg-tile-400 p-6 text-text-200 shadow-lg">
			<div class="text-center">
				<p class="text-2xl text-text-300 font-bold mb-1">
					Generation Failed
				</p>
				<p class="text-text-300 mb-4">
					{errorMessage}
				</p>
				<button
					onclick={() => { isError = false; errorMessage = ''; }}
					class="px-4 py-2 bg-tile-500 text-text-300 rounded border border-tile-600 hover:bg-tile-600 hover:border-tile-500 transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit && data.session}
	<section class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
			<form class="flex flex-col gap-4 p-6" onsubmit={generateSentences}>
				<div class="text-left mb-4">
					<h1 class="text-xl sm:text-2xl text-text-300 font-bold mb-2 tracking-tight">
						Practice your iraqi skills with generated sentences.
					</h1>
					<p class="text-text-200 text-lg leading-snug">Select your preferred difficulty and practice mode.</p>
				</div>
				
				<div class="flex flex-col gap-3">
					<h2 class="text-lg font-bold text-text-300">Select difficulty</h2>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setOption}
							selectableFor="beginner"
							isSelected={option === 'beginner'}
							value="beginner"
							text="Beginner"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setOption}
							selectableFor="intermediate"
							isSelected={option === 'intermediate'}
							text="Intermediate"
							value="intermediate"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setOption}
							selectableFor="advanced"
							isSelected={option === 'advanced'}
							text="Advanced"
							value="advanced"
						/>
					</div>
				</div>
				
				<div class="border-t border-tile-600 pt-4">
					<h2 class="text-lg font-bold text-text-300 mb-3">Select practice mode</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setMode}
							selectableFor="write"
							isSelected={mode === 'write'}
							value="write"
							text="Practice Writing"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setMode}
							selectableFor="quiz"
							isSelected={mode === 'quiz'}
							value="quiz"
							text="Multiple Choice Quiz"
						/>
					</div>
				</div>
				
				<div class="pt-2">
					<Button type="submit">Generate Sentences</Button>
				</div>
			</form>
		</div>
	</section>
{/if}

{#if isLoading}
	<div class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-tile-600 bg-tile-400 p-6 text-text-200 shadow-lg">
			<AlphabetCycle />
			<div class="text-center">
				<p class="text-2xl text-text-300 font-bold mb-1">
					Generating your sentences
				</p>
				<p class="text-text-200">
					This usually takes a few seconds.
				</p>
			</div>
		</div>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit && data.session}
	<header class="px-3 sm:px-8 max-w-6xl mx-auto border-b border-tile-600 bg-tile-400 py-4 shadow-lg">
		<div class="flex w-full items-center justify-between">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {sentences.length}</h1>
			</div>
			<div class="w-max flex gap-2">
				{#if index < sentences.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
				{#if isLastSentence && !isLoading}
					<Button onClick={loadMoreSentences} type="button">Load More</Button>
				{/if}
			</div>
		</div>
	</header>

	{#if mode === 'write'}
		<section class="px-3 sm:px-8 max-w-6xl mx-auto py-4">
			<SentenceBlock {sentence} {resetSentences} dialect="iraqi" />
		</section>
	{/if}

	{#if mode === 'quiz'}
		<section class="px-3 sm:px-8 max-w-6xl mx-auto">
			<SentenceQuiz {sentences} {index} {resetSentences} />
		</section>
	{/if}
{/if}
