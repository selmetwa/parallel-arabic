<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { egyptianSentencesInStore, currentDialect } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
  import { updateUrl } from '$lib/helpers/update-url';
  import SpeakSentence from './components/SpeakSentence.svelte';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type sentenceObjectItem } from '$lib/types/index';
  import { onMount } from 'svelte';
	let { data } = $props();

	let isLoading = $state(false);

  onMount(() => {
    currentDialect.set('egyptian-arabic');
  });

  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('speak_sentence_egyptian') ?? '0') || 0;
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
      const savedSentences = localStorage.getItem('speak_sentence_egyptian');
      if (savedSentences) {
        const parsed = JSON.parse(savedSentences);
        return filterValidSentences(parsed);
      }
    }
    const storeSentences = Array.isArray($egyptianSentencesInStore) ? $egyptianSentencesInStore : [];
    return filterValidSentences(storeSentences);
})());

  let sentence = $derived(sentences[index]);
  $effect(() => {
    if (sentences.length > 0) {
      index = Math.min(index, sentences.length - 1);
    }
  });

	let option = $state('beginner');

  // Remove mode state since it's not needed for speaking

	let sentencesViewed = $state(data.sentencesViewed);

	async function generateSentance(option: string, copy: any) {
		isLoading = true;
		const res = await fetch('/api/generate-sentences', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				option,
				sentences: copy,
				dialect: 'egyptian-arabic'
			})
		});

		const chatgptres = await res.json();
		const jsonBlob = chatgptres.message.message.content;
		const _sentences = JSON.parse(jsonBlob);
		const newSentences = filterValidSentences(_sentences.sentences || []);
		const updatedSentences = [...sentences, ...newSentences];
		sentences = updatedSentences;
		egyptianSentencesInStore.set(updatedSentences as any);
    localStorage.setItem('speak_sentence_egyptian', JSON.stringify(updatedSentences));
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
    updateUrl('speak_sentence_egyptian', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('speak_sentence_egyptian', (index+1).toString());
	}

	function setOption(event: any) {
		option = event.target.value;
	}

	// Remove setMode function since it's not needed

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
    localStorage.removeItem('speak_sentence_egyptian');
    updateUrl('speak_sentence_egyptian', '0');
  }

	let isLastSentence = $derived(index === sentences.length - 1);

	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 20);
</script>

{#if !data.session}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">
				You must have an account to access this content.
			</h1>
			<div class="mx-auto mt-4 w-fit">
				<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
			</div>
		</div>
	</div>
{/if}

{#if hasReachedLimit && data.session}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 20 sentences.</h1>
			<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
			<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
				<!-- Modify this value using your own Stripe price_id -->
				<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />

				<Button type="submit">Subscribe</Button>
			</form>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit && data.session}
	<section class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
			<form class="flex flex-col gap-4 p-6" onsubmit={generateSentences}>
				<div class="text-left mb-4">
					<h1 class="text-xl sm:text-2xl text-text-300 font-bold mb-2 tracking-tight">
						Practice your speaking with generated sentences.
					</h1>
					<p class="text-text-200 text-lg leading-snug">Select your preferred difficulty.</p>
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
	<header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center sm:px-8">
		<div class="flex w-full items-center justify-between max-w-5xl mx-auto">
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
					<Button onClick={loadMoreSentences} type="button">Load More Sentences</Button>
				{/if}
			</div>
		</div>
	</header>

	<SpeakSentence {sentence} {resetSentences} />
{/if}
