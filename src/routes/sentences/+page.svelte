<script lang="ts">
	import SentenceBlock from './components/SentenceBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import SentenceQuiz from './components/SentenceQuiz.svelte';
	import { sentencesInStore, sentenceIndexInStore } from '$lib/store/store';
	import { PUBLIC_TEST_PRICE_ID } from '$env/static/public';
  import { goto } from '$app/navigation';

	export let data;

	$: isLoading = false;
	$: sentences = $sentencesInStore || [];

	$: index = $sentenceIndexInStore || 0;
	$: sentence = sentences[index];
	$: option = 'beginner';
	$: mode = 'write';
	$: sentencesViewed = data.sentencesViewed;

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
		sentences = [...sentences, ..._sentences.sentences];
		sentencesInStore.set(sentences);
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
		sentenceIndexInStore.set(index);
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		sentenceIndexInStore.set(index);
	}

	$: if (index) {
		sentence = sentences[index];
	}

	function setMode(event: any) {
		mode = event.target.value;
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

	$: isLastSentence = index === sentences.length - 1;

	$: hasReachedLimit = !data.isSubscribed && sentencesViewed >= 20;
</script>
{#if !data.session}
<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
  <h1 class="text-2xl font-bold text-text-300">You must have an account to access this content.</h1>
  <div class="mx-auto mt-4 w-fit">
    <Button type="button" onClick={() => goto('/signup')}>
      Create Account
    </Button>
  </div>
</div>
{/if}

{#if hasReachedLimit && data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 20 sentences.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<!-- Modify this value using your own Stripe price_id -->
			<input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />

			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit && data.session}
	<section class="mx-auto mt-12 w-full border border-tile-500 bg-tile-300 sm:w-1/2">
		<form class="flex flex-col gap-3 p-5" on:submit={generateSentences}>
			<p class="text-3xl text-text-300 font-bold">
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
				Beginner
			</RadioButton>
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setOption}
				selectableFor="intermediate"
				isSelected={option === 'intermediate'}
				text="Intermediate"
				value="intermediate">Intermediate</RadioButton
			>

			<p class="text-md text-text-300">Select learning mode.</p>
			<RadioButton
				className="!text-xl"
				wrapperClass="!p-2"
				onClick={setMode}
				selectableFor="write"
				isSelected={mode === 'write'}
				value="write"
				text="Practice Writing"
			>
				Beginner
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
				Beginner
			</RadioButton>
			<Button type="submit">Generate Sentences</Button>
		</form>
	</section>
{/if}

{#if isLoading}
	<div
		class="mx-auto my-12 flex w-fit flex-col items-center gap-3 border border-tile-600 bg-tile-400 p-4 text-text-200 sm:flex-row"
	>
		<div role="status">
			<svg
				aria-hidden="true"
				class="my-3 h-10 w-10 animate-spin fill-tile-500 text-text-200 dark:text-text-200"
				viewBox="0 0 100 101"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
					fill="currentColor"
				/>
				<path
					d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
					fill="currentFill"
				/>
			</svg>
			<span class="sr-only">Loading...</span>
		</div>
		<p class="text-text-300 text-2xl">
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
		<SentenceBlock {sentence} />
  </section>
	{/if}

	{#if mode === 'quiz'}
		<SentenceQuiz {sentences} {index} />
	{/if}
{/if}
