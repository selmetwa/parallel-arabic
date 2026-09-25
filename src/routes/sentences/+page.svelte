<script lang="ts">
	import SentenceBlock from '$lib/components/dialect-shared/sentences/SentenceBlock.svelte';
	import SentenceQuiz from '$lib/components/dialect-shared/sentences/SentenceQuiz.svelte';
	import { currentDialect } from '$lib/store/store';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import { updateUrl } from '$lib/helpers/update-url';
	import { type sentenceObjectItem, type Dialect } from '$lib/types/index';
	import { onMount } from 'svelte';
	import {
		showSentenceGenerationToast,
		showSentenceSuccessToast,
		showSentenceErrorToast
	} from '$lib/helpers/toast-helpers';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';
	import { sentencePractice as session } from '$lib/store/generated-content.svelte';
	import { trackEvent } from '$lib/analytics';

	let { data } = $props();

	let isLoading = $state(false);
	let isError = $state(false);
	let errorMessage = $state('');

	onMount(() => {
		currentDialect.set('');
	});

	// Sentences live in global state so they survive navigating away; only
	// read the index from the URL when there is no session to come back to.
	if (typeof window !== 'undefined' && session.sentences.length === 0) {
		const params = new URLSearchParams(window.location.search);
		const urlIndex = parseInt(params.get('sentence') ?? '0') || 0;
		session.index = urlIndex ? urlIndex - 1 : 0;
	}

	// Function to filter out incomplete sentences
	function filterValidSentences(sentences: any[]): sentenceObjectItem[] {
		return sentences.filter(
			(sentence) =>
				sentence &&
				typeof sentence.arabic === 'string' &&
				typeof sentence.english === 'string' &&
				typeof sentence.transliteration === 'string' &&
				sentence.arabic.trim() !== '' &&
				sentence.english.trim() !== '' &&
				sentence.transliteration.trim() !== ''
		);
	}

	let selectedDialect = $state(session.dialect || getDefaultDialect(data.user));

	let sentence = $derived(session.sentences[session.index]);
	$effect(() => {
		if (session.sentences.length > 0) {
			session.index = Math.min(session.index, session.sentences.length - 1);
		}
	});

	let option = $state('a1');
	let selectedLearningTopics = $state<string[]>([]);
	let vocabularyWords = $state('');
	let vocabularyInputMode = $state('text'); // 'text' or 'file'
	let vocabularyFile = $state<File | null>(null);
	let fileError = $state('');

	// Review words only mode
	let useReviewWordsOnly = $state(false);
	let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
	let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
	let isLoadingReviewWords = $state(false);
	let reviewWordsError = $state('');

	let mode = $state(
		(() => {
			if (typeof window !== 'undefined') {
				const params = new URLSearchParams(window.location.search);
				return params.get('mode') || 'write';
			}
		})()
	);

	let sentencesViewed = $state(data.sentencesViewed);

	function toggleLearningTopic(topicValue: string) {
		if (selectedLearningTopics.includes(topicValue)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topicValue);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topicValue];
		}
		trackEvent('sentences_learning_topic_toggled', {
			topic: topicValue,
			selected: selectedLearningTopics.includes(topicValue)
		});
	}

	async function loadReviewWords() {
		if (!data.user?.id) {
			reviewWordsError = 'User not found';
			return;
		}

		isLoadingReviewWords = true;
		reviewWordsError = '';

		try {
			const words = await fetchUserReviewWords(data.user.id, reviewWordsSource);
			reviewWords = words;

			if (words.length === 0) {
				reviewWordsError = `You don't have any ${
					reviewWordsSource === 'all' ? 'saved words' : 'words due for review'
				} yet. Add words to your review deck first.`;
			}
		} catch (error) {
			console.error('Error loading review words:', error);
			reviewWordsError = 'Failed to load review words. Please try again.';
		} finally {
			isLoadingReviewWords = false;
		}
	}

	// Watch for changes to review words source and toggle
	$effect(() => {
		if (useReviewWordsOnly && data.user?.id) {
			loadReviewWords();
		} else {
			reviewWords = [];
			reviewWordsError = '';
		}
	});

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		fileError = '';

		if (file) {
			// Check file size (150KB limit)
			const maxSize = 150 * 1024; // 150KB in bytes
			if (file.size > maxSize) {
				fileError = 'File size must be less than 150KB';
				vocabularyFile = null;
				return;
			}

			// Check file type
			const allowedTypes = ['text/plain', 'text/csv', 'application/csv'];
			const fileExtension = file.name.toLowerCase().split('.').pop();

			if (!allowedTypes.includes(file.type) && !['txt', 'csv'].includes(fileExtension || '')) {
				fileError = 'Only TXT and CSV files are allowed';
				vocabularyFile = null;
				return;
			}

			vocabularyFile = file;
			trackEvent('sentences_vocab_file_uploaded', { file_size_kb: Math.round(file.size / 1024) });
		} else {
			vocabularyFile = null;
		}
	}

	async function processVocabularyFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				if (text) {
					// Process CSV or TXT content
					let words: string[] = [];

					if (file.name.toLowerCase().endsWith('.csv')) {
						// Parse CSV - assume words are in first column or comma-separated
						const lines = text.split('\n');
						words = lines
							.flatMap((line: string) =>
								line.split(',').map((word: string) => word.trim().replace(/['"]/g, ''))
							)
							.filter((word: string) => word.length > 0);
					} else {
						// Parse TXT - assume words are separated by commas, newlines, or spaces
						words = text
							.split(/[,\n\s]+/)
							.map((word: string) => word.trim())
							.filter((word: string) => word.length > 0);
					}

					resolve(words.join(', '));
				} else {
					reject(new Error('Failed to read file'));
				}
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	async function generateSentence(option: string, copy: any) {
		isLoading = true;
		isError = false;
		errorMessage = '';
		trackEvent('sentences_generation_started', {
			difficulty: option,
			dialect: selectedDialect,
			vocabulary_source: useReviewWordsOnly ? 'review_words' : vocabularyInputMode,
			learning_topics: selectedLearningTopics
		});

		// Show processing toast
		const toastId = showSentenceGenerationToast(selectedDialect, 5);

		// Validate review words mode
		if (useReviewWordsOnly && reviewWords.length === 0) {
			showSentenceErrorToast(
				toastId,
				`You don't have any ${
					reviewWordsSource === 'all' ? 'saved words' : 'words due for review'
				} yet. Add words to your review deck first.`
			);
			isLoading = false;
			return;
		}

		let finalVocabularyWords = vocabularyWords;

		// If file mode is selected and a file is uploaded, process it
		if (!useReviewWordsOnly && vocabularyInputMode === 'file' && vocabularyFile) {
			try {
				finalVocabularyWords = await processVocabularyFile(vocabularyFile);
			} catch (error) {
				showSentenceErrorToast(toastId, 'Failed to process vocabulary file');
				fileError = 'Failed to process file';
				isLoading = false;
				return;
			}
		}

		try {
			// Determine which API endpoint to use based on dialect
			const endpoint =
				selectedDialect === 'egyptian-arabic'
					? '/api/generate-sentences-egyptian'
					: '/api/generate-sentences';

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: JSON.stringify({
					option,
					sentences: copy,
					dialect: selectedDialect,
					learningTopics: useReviewWordsOnly ? [] : selectedLearningTopics,
					vocabularyWords: useReviewWordsOnly ? '' : finalVocabularyWords,
					useReviewWordsOnly: useReviewWordsOnly || false,
					reviewWordsSource: reviewWordsSource || 'all',
					reviewWords: reviewWords || []
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
			let _sentences;
			try {
				_sentences = JSON.parse(jsonBlob);
			} catch (error) {
				console.error('Error parsing generated sentences JSON:', error);
				throw new Error('Failed to parse generated sentences');
			}
			const newSentences = filterValidSentences(_sentences.sentences || []);

			if (newSentences.length === 0) {
				throw new Error('No valid sentences were generated. Please try again.');
			}

			// Write to global state so the result survives navigating away,
			// even if generation finishes after this page is destroyed
			session.sentences = [...session.sentences, ...newSentences];
			session.dialect = selectedDialect;

			// Show success toast
			showSentenceSuccessToast(toastId, newSentences.length, selectedDialect);
			trackEvent('sentences_generation_completed', {
				sentence_count: newSentences.length,
				dialect: selectedDialect
			});
		} catch (error) {
			console.error('Error generating sentences:', error);
			const errorMsg =
				error instanceof Error
					? error.message
					: 'An unexpected error occurred while generating sentences. Please try again.';

			// Show error toast
			showSentenceErrorToast(toastId, errorMsg);

			isError = true;
			errorMessage = errorMsg;
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
		if (session.index === session.sentences.length - 1) {
			return;
		}

		updateSentencesViewed();
		session.index = session.index + 1;
		updateUrl('sentence', (session.index + 1).toString());
		trackEvent('sentences_navigated', { direction: 'next', index: session.index });
	}

	function previous() {
		if (session.index === 0) {
			return;
		}
		session.index = session.index - 1;
		updateUrl('sentence', (session.index + 1).toString());
		trackEvent('sentences_navigated', { direction: 'previous', index: session.index });
	}

	function generateSentences(event: any) {
		event.preventDefault();
		const copy = [...session.sentences];
		generateSentence(option, copy);
	}

	function loadMoreSentences() {
		trackEvent('sentences_load_more_requested', { dialect: selectedDialect, difficulty: option });
		generateSentence(option, [...session.sentences]);
	}

	function resetSentences() {
		trackEvent('sentences_reset', { dialect: selectedDialect });
		session.sentences = [];
		session.index = 0;
		updateUrl('sentence', '0');
	}

	let isLastSentence = $derived(session.index === session.sentences.length - 1);
	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 5);

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic', sub: 'Masri', flag: '🇪🇬' },
		{ value: 'fusha', label: 'Modern Standard Arabic', sub: 'Fusha', flag: '📖' },
		{ value: 'levantine', label: 'Levantine Arabic', sub: 'Shami', flag: '🇱🇧' },
		{ value: 'darija', label: 'Moroccan Darija', sub: 'Darija', flag: '🇲🇦' }
	];

	const learningTopicOptions = [
		{ label: 'Verb Conjugation', value: 'verb conjugation', emoji: '🔄' },
		{ label: 'Noun Plurals', value: 'noun plurals', emoji: '📝' },
		{ label: 'Past Tense', value: 'past tense', emoji: '⏪' },
		{ label: 'Present Tense', value: 'present tense', emoji: '▶️' },
		{ label: 'Infinitive', value: 'infinitive', emoji: '♾️' },
		{ label: 'Numbers', value: 'numbers', emoji: '🔢' },
		{ label: 'Future Tense', value: 'future tense', emoji: '⏩' },
		{ label: 'Possessive Suffixes', value: 'possessive suffixes', emoji: '🫱' }
	];

	// Cool → hot, so the level picker reads as a heat ramp at a glance.
	const difficultyOptions = [
		{ value: 'a1', label: 'A1', sublabel: 'Beginner', accent: '#22c55e' },
		{ value: 'a2', label: 'A2', sublabel: 'Elementary', accent: '#84cc16' },
		{ value: 'b1', label: 'B1', sublabel: 'Intermediate', accent: '#eab308' },
		{ value: 'b2', label: 'B2', sublabel: 'Upper Int.', accent: '#f97316' },
		{ value: 'c1', label: 'C1', sublabel: 'Advanced', accent: '#ef4444' },
		{ value: 'c2', label: 'C2', sublabel: 'Proficient', accent: '#dc2626' }
	];

	let activeDialect = $derived(dialectOptions.find((d) => d.value === selectedDialect));
	let activeLevel = $derived(difficultyOptions.find((d) => d.value === option));

	// A plain-English read-out of the setup, shown beside the generate button.
	let summaryLine = $derived(
		[
			`${activeDialect?.flag ?? ''} ${activeDialect?.sub ?? ''}`.trim(),
			activeLevel?.sublabel,
			useReviewWordsOnly
				? reviewWordsSource === 'all'
					? 'your saved words'
					: 'words due today'
				: mode === 'quiz'
					? 'quiz'
					: 'writing'
		]
			.filter(Boolean)
			.join('  ·  ')
	);
</script>

{#snippet stepHead(num: string, title: string, tag: string)}
	<div class="step-head">
		<span class="step-num">{num}</span>
		<h2>{title}</h2>
		<span class="step-tag">{tag}</span>
	</div>
{/snippet}

{#if hasReachedLimit && data.session}
	<div class="mx-auto max-w-lg px-5 py-16 text-center">
		<div class="msg-emoji">🔒</div>
		<h1 class="msg-title">You have reached your limit of 5 sentences.</h1>
		<p class="msg-body">To continue practicing, please subscribe.</p>
		<div class="mt-7 flex justify-center">
			<SubscribeButton
				className="!bg-emerald-500 !border-emerald-700 !text-white !px-8 !py-3.5 !text-base !rounded-2xl"
			/>
		</div>
	</div>
{/if}

{#if isError}
	<div class="mx-auto max-w-lg px-5 pt-12 text-center">
		<div class="msg-emoji">🙈</div>
		<h1 class="msg-title">Generation Failed</h1>
		<p class="msg-body">{errorMessage}</p>
		<button
			onclick={() => {
				isError = false;
				errorMessage = '';
			}}
			class="press mt-6 px-8 py-3.5"
			style="--accent:#0ea5e9; --deep:#0369a1;"
		>
			Try Again
		</button>
	</div>
{/if}

{#if !isLoading && session.sentences.length === 0 && !hasReachedLimit}
	<!-- Setup -->
	<div class="mx-auto max-w-3xl px-5 pb-36 pt-8">
		<header class="mb-9">
			<h1 class="hero-title">Sentence Practice</h1>
			<p class="hero-sub">
				Drill grammar patterns and vocabulary in context with unlimited custom practice sentences.
			</p>
		</header>

		<form onsubmit={generateSentences}>
			<!-- Source -->
			<section class="block">
				<label class="toggle-card {useReviewWordsOnly ? 'is-on' : ''}">
					<span class="toggle-emoji" aria-hidden="true">🗂️</span>
					<span class="min-w-0 flex-1">
						<span class="toggle-title">Use Your Review Words</span>
						<span class="toggle-note">Generate sentences from your saved vocabulary deck.</span>
					</span>
					<span class="relative inline-flex shrink-0 items-center">
						<input
							type="checkbox"
							bind:checked={useReviewWordsOnly}
							class="peer sr-only"
							aria-label="Use your review words"
						/>
						<span class="switch"></span>
					</span>
				</label>
			</section>

			{#if useReviewWordsOnly}
				<!-- Word Source -->
				<section class="block">
					{@render stepHead('1', 'Word Source', `${reviewWords.length} ready`)}
					<div class="grid gap-2.5 sm:grid-cols-2">
						<button
							type="button"
							onclick={() => (reviewWordsSource = 'all')}
							aria-pressed={reviewWordsSource === 'all'}
							class="pick {reviewWordsSource === 'all' ? 'is-on' : ''}"
							style="--accent:#0ea5e9; --deep:#0369a1;"
						>
							<span class="pick-flag" aria-hidden="true">📖</span>
							<span class="min-w-0 text-left">
								<span class="pick-name">All Saved Words</span>
								<span class="pick-sub">Everything in your deck</span>
							</span>
						</button>
						<button
							type="button"
							onclick={() => (reviewWordsSource = 'due-for-review')}
							aria-pressed={reviewWordsSource === 'due-for-review'}
							class="pick {reviewWordsSource === 'due-for-review' ? 'is-on' : ''}"
							style="--accent:#f59e0b; --deep:#b45309;"
						>
							<span class="pick-flag" aria-hidden="true">⏰</span>
							<span class="min-w-0 text-left">
								<span class="pick-name">Due for Review</span>
								<span class="pick-sub">Scheduled for today</span>
							</span>
						</button>
					</div>

					{#if isLoadingReviewWords}
						<p class="note">Loading your words...</p>
					{:else if reviewWordsError}
						<p class="note note--bad">{reviewWordsError}</p>
					{:else if reviewWords.length > 0}
						<p class="note note--good">
							{reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} ready for practice
						</p>
					{/if}
				</section>

				<!-- Difficulty -->
				<section class="block">
					{@render stepHead('2', 'Difficulty Level', activeLevel?.sublabel ?? '')}
					<div class="level-row">
						{#each difficultyOptions as diff (diff.value)}
							<button
								type="button"
								onclick={() => (option = diff.value)}
								aria-pressed={option === diff.value}
								class="level {option === diff.value ? 'is-on' : ''}"
								style="--accent:{diff.accent};"
							>
								<span class="level-bar"></span>
								<span class="level-label">{diff.label}</span>
							</button>
						{/each}
					</div>
					<p class="level-caption">{activeLevel?.label} — {activeLevel?.sublabel}</p>
				</section>
			{:else}
				<!-- Difficulty -->
				<section class="block">
					{@render stepHead('1', 'Difficulty Level', activeLevel?.sublabel ?? '')}
					<div class="level-row">
						{#each difficultyOptions as diff (diff.value)}
							<button
								type="button"
								onclick={() => (option = diff.value)}
								aria-pressed={option === diff.value}
								class="level {option === diff.value ? 'is-on' : ''}"
								style="--accent:{diff.accent};"
							>
								<span class="level-bar"></span>
								<span class="level-label">{diff.label}</span>
							</button>
						{/each}
					</div>
					<p class="level-caption">{activeLevel?.label} — {activeLevel?.sublabel}</p>
				</section>

				<!-- Focus Topics -->
				<section class="block">
					{@render stepHead(
						'2',
						'Focus Topics',
						selectedLearningTopics.length ? `${selectedLearningTopics.length} picked` : 'Optional'
					)}
					<div class="flex flex-wrap gap-2">
						{#each learningTopicOptions as topic (topic.value)}
							<button
								type="button"
								onclick={() => toggleLearningTopic(topic.value)}
								aria-pressed={selectedLearningTopics.includes(topic.value)}
								class="chip {selectedLearningTopics.includes(topic.value) ? 'is-on' : ''}"
							>
								<span aria-hidden="true">{topic.emoji}</span>
								{topic.label}
							</button>
						{/each}
					</div>
					{#if selectedLearningTopics.length > 0}
						<button type="button" onclick={() => (selectedLearningTopics = [])} class="clear-btn"
							>Clear all</button
						>
					{/if}
				</section>

				<!-- Custom Vocabulary -->
				<section class="block">
					{@render stepHead('3', 'Custom Vocabulary', 'Optional')}
					<div class="seg-wrap">
						<button
							type="button"
							onclick={() => {
								vocabularyInputMode = 'text';
								vocabularyFile = null;
								fileError = '';
							}}
							class="seg {vocabularyInputMode === 'text' ? 'is-on' : ''}">✍️ Text</button
						>
						<button
							type="button"
							onclick={() => {
								vocabularyInputMode = 'file';
								vocabularyWords = '';
							}}
							class="seg {vocabularyInputMode === 'file' ? 'is-on' : ''}">📂 File</button
						>
					</div>

					{#if vocabularyInputMode === 'text'}
						<textarea
							bind:value={vocabularyWords}
							rows="3"
							class="vocab-input"
							placeholder="Enter words separated by commas (e.g., بيت, مدرسة, طعام)"
						></textarea>
					{:else}
						<div class="drop">
							<input
								type="file"
								accept=".txt,.csv"
								onchange={handleFileChange}
								class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							/>
							<span class="drop-emoji" aria-hidden="true">📄</span>
							<p class="drop-title">Drop your file here</p>
							<p class="drop-note">or click to browse · TXT or CSV (max 150KB)</p>
						</div>
						{#if vocabularyFile}
							<p class="note note--good">
								{vocabularyFile.name}
								<span class="opacity-70">({Math.round(vocabularyFile.size / 1024)}KB)</span>
							</p>
						{/if}
						{#if fileError}
							<p class="note note--bad">{fileError}</p>
						{/if}
					{/if}
				</section>

				<!-- Practice Mode -->
				<section class="block">
					{@render stepHead('4', 'Practice Mode', mode === 'quiz' ? 'Quiz' : 'Writing')}
					<div class="grid gap-2.5 sm:grid-cols-2">
						<button
							type="button"
							onclick={() => (mode = 'write')}
							aria-pressed={mode === 'write'}
							class="pick {mode === 'write' ? 'is-on' : ''}"
							style="--accent:#0ea5e9; --deep:#0369a1;"
						>
							<span class="pick-flag" aria-hidden="true">✍️</span>
							<span class="min-w-0 text-left">
								<span class="pick-name">Practice Writing</span>
								<span class="pick-sub">Type it out yourself</span>
							</span>
						</button>
						<button
							type="button"
							onclick={() => (mode = 'quiz')}
							aria-pressed={mode === 'quiz'}
							class="pick {mode === 'quiz' ? 'is-on' : ''}"
							style="--accent:#8b5cf6; --deep:#6d28d9;"
						>
							<span class="pick-flag" aria-hidden="true">🧩</span>
							<span class="min-w-0 text-left">
								<span class="pick-name">Multiple Choice Quiz</span>
								<span class="pick-sub">Pick the right answer</span>
							</span>
						</button>
					</div>
				</section>
			{/if}

			<!-- Launch bar -->
			<div class="launch">
				<div class="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
					<p class="launch-summary">{summaryLine}</p>
					{#if !data.session}
						<Tooltip text="An account is required to access this feature">
							<button type="submit" disabled={true} class="press press--off w-full px-7 py-3.5">
								Generate Sentences
							</button>
						</Tooltip>
					{:else}
						<button
							type="submit"
							disabled={useReviewWordsOnly && (reviewWords.length === 0 || isLoadingReviewWords)}
							class="press w-full px-7 py-3.5 sm:w-auto"
							style="--accent:#22c55e; --deep:#15803d;"
						>
							<span aria-hidden="true">📝</span> Generate Sentences
						</button>
					{/if}
				</div>
				{#if !data.session}
					<p class="pb-3 text-center text-[0.82rem] text-text-200">
						<a href="/login" class="font-semibold text-brand underline underline-offset-4">Log in</a
						>
						or
						<a href="/signup" class="font-semibold text-brand underline underline-offset-4"
							>sign up</a
						> to start practicing
					</p>
				{/if}
			</div>
		</form>
	</div>
{/if}

{#if isLoading}
	<div
		class="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center"
	>
		<div class="bounce-emoji">✍️</div>
		<h1 class="msg-title">Generating Sentences...</h1>
		<p class="msg-body">
			Creating {activeDialect?.label} sentences tailored to your level.
			<span class="mt-1 block text-sm opacity-75">This may take up to a minute.</span>
		</p>
		<div class="mt-7 h-2.5 w-full overflow-hidden rounded-full bg-tile-400">
			<div class="loading-sweep h-full w-1/3 rounded-full bg-emerald-500"></div>
		</div>
		<div class="tip">
			<span class="tip-emoji" aria-hidden="true">💡</span>
			<span>
				<span class="tip-title">Pro Tip</span>
				<span class="tip-body">
					You can leave this page and continue using the app. We'll notify you when your sentences
					are ready!
				</span>
			</span>
		</div>
	</div>
{:else if session.sentences.length > 0 && session.index < session.sentences.length && !hasReachedLimit}
	<div class="flex min-h-screen flex-col">
		<header class="practice-bar">
			<div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
				<div class="w-24">
					{#if session.index > 0}
						<button onclick={previous} type="button" class="nav-btn">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Previous
						</button>
					{/if}
				</div>

				<div class="flex flex-col items-center gap-1.5">
					<div class="progress-dots" aria-hidden="true">
						{#each session.sentences as _, i (i)}
							<span class="dot {i <= session.index ? 'is-done' : ''}"></span>
						{/each}
					</div>
					<span class="progress-label">
						{activeDialect?.flag}
						Sentence {session.index + 1} of {session.sentences.length}
					</span>
				</div>

				<div class="flex w-24 justify-end gap-2">
					{#if session.index < session.sentences.length - 1}
						<button onclick={next} type="button" class="nav-btn">
							Next
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					{/if}
					{#if isLastSentence && !isLoading}
						{#if !data.session}
							<Tooltip text="An account is required to access this feature">
								<button type="button" disabled={true} class="nav-btn nav-btn--off">More</button>
							</Tooltip>
						{:else}
							<button onclick={loadMoreSentences} type="button" class="nav-btn nav-btn--go">
								More
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</button>
						{/if}
					{/if}
				</div>
			</div>
		</header>

		<main class="flex-grow bg-tile-300">
			{#if mode === 'write'}
				<section class="mx-auto max-w-7xl px-4 py-8 sm:px-8">
					<SentenceBlock {sentence} {resetSentences} dialect={selectedDialect as Dialect} {next} />
				</section>
			{/if}

			{#if mode === 'quiz'}
				<section class="mx-auto max-w-7xl px-4 py-8 sm:px-8">
					<SentenceQuiz
						sentences={session.sentences}
						index={session.index}
						{resetSentences}
						{next}
					/>
				</section>
			{/if}
		</main>
	</div>
{/if}

<style>
	/* Hero */
	.hero-title {
		font-size: clamp(2.2rem, 7vw, 3.2rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		color: var(--text1);
	}

	.hero-sub {
		margin-top: 0.85rem;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 46ch;
	}

	/* Blocks + step headings */
	.block {
		margin-top: 2rem;
		animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.block:nth-of-type(2) {
		animation-delay: 60ms;
	}
	.block:nth-of-type(3) {
		animation-delay: 120ms;
	}
	.block:nth-of-type(4) {
		animation-delay: 180ms;
	}
	.block:nth-of-type(5) {
		animation-delay: 240ms;
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
		margin-bottom: 0.9rem;
	}

	.step-num {
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: var(--brand);
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.step-head h2 {
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.step-tag {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border-radius: 100px;
		padding: 0.22rem 0.65rem;
	}

	/* Toggle card */
	.toggle-card {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem 1.1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.toggle-card.is-on {
		border-color: #0ea5e9;
		background: color-mix(in srgb, #0ea5e9 10%, var(--tile3));
	}

	.toggle-emoji {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.toggle-title {
		display: block;
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--text1);
	}

	.toggle-note {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.83rem;
		line-height: 1.45;
		color: var(--text2);
	}

	.switch {
		display: block;
		width: 2.9rem;
		height: 1.65rem;
		border-radius: 100px;
		background: var(--tile5);
		transition: background 0.2s ease;
	}
	.switch::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.peer:checked ~ .switch {
		background: #0ea5e9;
	}
	.peer:checked ~ .switch::after {
		transform: translateX(1.25rem);
	}
	.peer:focus-visible ~ .switch {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}

	/* Pickable cards */
	.pick {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.95rem 1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background 0.18s ease;
	}

	.pick:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}

	.pick:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.pick.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--tile3));
		box-shadow: 0 4px 0 var(--deep);
	}

	.pick-flag {
		font-size: 1.6rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.22s ease-out;
	}

	.pick:hover .pick-flag,
	.pick.is-on .pick-flag {
		transform: rotate(-3deg) scale(1.05);
	}

	.pick-name {
		display: block;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text1);
	}

	.pick-sub {
		display: block;
		font-size: 0.78rem;
		font-style: italic;
		color: var(--text2);
	}

	/* Level ramp */
	.level-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4rem;
		align-items: end;
	}

	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding-bottom: 0.2rem;
		background: none;
		cursor: pointer;
	}

	/* Bars grow across the ramp, so difficulty is legible before you read a word */
	.level-bar {
		display: block;
		width: 100%;
		border-radius: 0.5rem 0.5rem 0.2rem 0.2rem;
		background: var(--tile5);
		transition:
			background 0.2s ease,
			transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.level:nth-child(1) .level-bar {
		height: 1.1rem;
	}
	.level:nth-child(2) .level-bar {
		height: 1.55rem;
	}
	.level:nth-child(3) .level-bar {
		height: 2rem;
	}
	.level:nth-child(4) .level-bar {
		height: 2.45rem;
	}
	.level:nth-child(5) .level-bar {
		height: 2.9rem;
	}
	.level:nth-child(6) .level-bar {
		height: 3.35rem;
	}

	.level:hover .level-bar {
		background: color-mix(in srgb, var(--accent) 55%, var(--tile5));
	}

	.level.is-on .level-bar {
		background: var(--accent);
		transform: scaleY(1.06);
	}

	.level-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		transition: color 0.2s ease;
	}

	.level.is-on .level-label {
		color: var(--text1);
	}

	.level-caption {
		margin-top: 0.7rem;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		text-align: center;
	}

	/* Chips */
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0.9rem;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.18s ease,
			border-color 0.18s ease,
			color 0.18s ease;
	}

	.chip:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}

	.chip.is-on {
		background: #0ea5e9;
		border-color: #0369a1;
		color: #fff;
	}

	.clear-btn {
		margin-top: 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.clear-btn:hover {
		color: var(--text1);
	}

	/* Segmented control */
	.seg-wrap {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 100px;
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}

	.seg {
		padding: 0.45rem 1rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.seg.is-on {
		background: var(--tile5);
		color: var(--text1);
	}

	.vocab-input {
		margin-top: 0.75rem;
		width: 100%;
		resize: none;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.85rem 1rem;
		font-size: 0.95rem;
		color: var(--text1);
		transition: border-color 0.2s ease;
	}
	.vocab-input:focus {
		outline: none;
		border-color: #0ea5e9;
	}
	.vocab-input::placeholder {
		color: var(--text2);
		opacity: 0.65;
	}

	.drop {
		position: relative;
		margin-top: 0.75rem;
		border-radius: 1.1rem;
		border: 2px dashed var(--tile5);
		padding: 1.75rem 1.25rem;
		text-align: center;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}
	.drop:hover {
		border-color: #0ea5e9;
		background: var(--tile3);
	}

	.drop-emoji {
		font-size: 2rem;
		line-height: 1;
		display: block;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.drop:hover .drop-emoji {
		transform: translateY(-2px) scale(1.04);
	}

	.drop-title {
		margin-top: 0.55rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}

	.drop-note {
		margin-top: 0.2rem;
		font-size: 0.8rem;
		color: var(--text2);
	}

	/* Notes — tint carries the meaning, text stays on the theme's own ink */
	.note {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.5;
		font-weight: 500;
		color: var(--text2);
		border-radius: 0.8rem;
		background: var(--tile3);
		padding: 0.6rem 0.85rem;
	}
	.note--good {
		color: var(--text1);
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #10b981;
	}
	.note--bad {
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #f43f5e;
	}

	/* Pressable button */
	.press {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}

	.press:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	.press:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--deep);
	}

	.press:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.press--off {
		background: var(--tile5);
		color: var(--text2);
		box-shadow: 0 4px 0 var(--tile6);
	}

	/* Launch bar */
	.launch {
		position: sticky;
		bottom: 0;
		z-index: 20;
		margin: 2rem -1.25rem 0;
		border-top: 2px solid var(--tile5);
		background: color-mix(in srgb, var(--tile2) 93%, transparent);
		backdrop-filter: blur(8px);
	}

	.launch-summary {
		display: none;
		flex: 1;
		min-width: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (min-width: 640px) {
		.launch-summary {
			display: block;
		}
	}

	/* Message states */
	.msg-emoji {
		font-size: 3.5rem;
		line-height: 1;
		margin-bottom: 1rem;
	}

	.bounce-emoji {
		font-size: 3.5rem;
		line-height: 1;
		margin-bottom: 1rem;
		animation: bob 1.3s ease-in-out infinite;
	}

	.msg-title {
		font-size: 1.7rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
	}

	.msg-body {
		margin-top: 0.6rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text2);
	}

	.tip {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		margin-top: 1.75rem;
		width: 100%;
		text-align: left;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.9rem 1rem;
	}

	.tip-emoji {
		font-size: 1.25rem;
		line-height: 1.2;
		flex-shrink: 0;
	}

	.tip-title {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
	}

	.tip-body {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.83rem;
		line-height: 1.5;
		color: var(--text2);
	}

	/* Practice header */
	.practice-bar {
		position: sticky;
		top: 0;
		z-index: 20;
		border-bottom: 2px solid var(--tile5);
		background: color-mix(in srgb, var(--tile3) 95%, transparent);
		backdrop-filter: blur(8px);
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.45rem 0.85rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile4);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.2s ease,
			color 0.2s ease;
	}
	.nav-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		color: var(--text1);
		background: var(--tile5);
	}
	.nav-btn svg {
		width: 0.85rem;
		height: 0.85rem;
	}
	.nav-btn--go {
		background: #0ea5e9;
		color: #fff;
	}
	.nav-btn--go:hover {
		background: #0284c7;
		color: #fff;
	}
	.nav-btn--off {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.progress-dots {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		max-width: 11rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.dot {
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: var(--tile5);
		transition: background 0.3s ease;
	}
	.dot.is-done {
		background: #22c55e;
	}

	.progress-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
	}

	.loading-sweep {
		animation: sweep 1.3s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	}

	@keyframes sweep {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(400%);
		}
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0) rotate(-4deg);
		}
		50% {
			transform: translateY(-10px) rotate(4deg);
		}
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.block {
			animation: none;
		}
		.bounce-emoji {
			animation: none;
		}
		.loading-sweep {
			animation: none;
			width: 100%;
		}
		.pick,
		.chip,
		.press,
		.nav-btn,
		.pick-flag,
		.drop-emoji,
		.level-bar,
		.switch::after {
			transition: none;
		}
		.pick:hover,
		.chip:hover,
		.nav-btn:hover {
			transform: none;
		}
	}
</style>
