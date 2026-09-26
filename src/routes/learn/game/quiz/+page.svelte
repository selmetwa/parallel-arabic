<script lang="ts">
	import { goto } from '$app/navigation';
	import { GAME_MODE_INFO, QUIZ_FAQS } from '$lib/constants/game-content';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import type { Dialect } from '$lib/types/index';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
	import { createRoundGate, freeRoundsStatus } from '$lib/games/free-rounds.svelte';

	let { data } = $props();

	// Two free quizzes, then the sign-up prompt (signed out) or the paywall.
	const gate = createRoundGate('quiz', () => ({
		isSubscribed: !!data.isSubscribed,
		userId: data.user?.id ?? null
	}));
	const freeStatus = $derived(freeRoundsStatus(gate, 'quizzes'));
	// In-progress games
	let inProgressGames = $state(data.inProgressGames || []);
	let deletingGameId = $state<string | null>(null);

	function formatLastPlayed(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return new Date(timestamp).toLocaleDateString();
	}

	function getDialectEmoji(dialect: string): string {
		const emojis: { [key: string]: string } = {
			'egyptian-arabic': '🇪🇬',
			levantine: '🇱🇧',
			darija: '🇲🇦',
			fusha: '📖'
		};
		return emojis[dialect] || '🌍';
	}

	function getCategoryName(dialect: string, category: string): string {
		return data.categoryNameLookup?.[dialect]?.[category] || category;
	}

	function continueGame(game: (typeof inProgressGames)[0]) {
		const params = new URLSearchParams();
		params.set('dialect', game.dialect);
		params.set('mode', game.game_mode);
		params.set('category', game.category);
		params.set('resumeId', game.id);

		// Store the game state in sessionStorage for resuming
		sessionStorage.setItem(
			'resumeGame',
			JSON.stringify({
				id: game.id,
				currentIndex: game.current_index,
				score: game.score,
				wordsToReview: game.words_to_review,
				questionOrder: game.question_order,
				totalQuestions: game.total_questions
			})
		);

		goto(`/learn/game/play?${params.toString()}`);
	}

	async function deleteGame(gameId: string) {
		deletingGameId = gameId;
		try {
			const response = await fetch('/api/game-progress', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: gameId })
			});

			if (response.ok) {
				inProgressGames = inProgressGames.filter((g) => g.id !== gameId);
			}
		} catch (error) {
			console.error('Error deleting game:', error);
		} finally {
			deletingGameId = null;
		}
	}

	// Game setup state
	let selectedDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
	let selectedCategory = $state('verbs');
	let selectedMode = $state<'multiple-choice' | 'listening' | 'speaking'>('multiple-choice');
	let useCustomWords = $state(true);
	let customTopic = $state('');
	let difficulty = $state('a1');
	let questionCount = $state(10);
	let contentType = $state<'words' | 'sentences'>('sentences'); // Default to sentences for better context learning

	// Learning topics for sentences (multiselect)
	const learningTopics = [
		{ id: 'verb-conjugation', label: 'Verb Conjugation', icon: '🔄' },
		{ id: 'noun-plurals', label: 'Noun Plurals', icon: '📝' },
		{ id: 'past-tense', label: 'Past Tense', icon: '⏪' },
		{ id: 'present-tense', label: 'Present Tense', icon: '▶️' },
		{ id: 'future-tense', label: 'Future Tense', icon: '⏩' },
		{ id: 'numbers', label: 'Numbers', icon: '🔢' },
		{ id: 'possessives', label: 'Possessive Suffixes', icon: '🫱' },
		{ id: 'questions', label: 'Questions', icon: '❓' }
	];
	let selectedLearningTopics = $state<string[]>([]);

	// Cool → hot, so the level picker reads as a heat ramp at a glance.
	const difficultyOptions = [
		{ value: 'a1', label: 'A1', sublabel: 'Beginner', accent: '#22c55e' },
		{ value: 'a2', label: 'A2', sublabel: 'Elementary', accent: '#84cc16' },
		{ value: 'b1', label: 'B1', sublabel: 'Intermediate', accent: '#eab308' },
		{ value: 'b2', label: 'B2', sublabel: 'Upper Intermediate', accent: '#f97316' },
		{ value: 'c1', label: 'C1', sublabel: 'Advanced', accent: '#ef4444' },
		{ value: 'c2', label: 'C2', sublabel: 'Proficient', accent: '#dc2626' }
	];

	const modeAccents: Record<string, { accent: string; deep: string }> = {
		'multiple-choice': { accent: '#0ea5e9', deep: '#0369a1' },
		listening: { accent: '#8b5cf6', deep: '#6d28d9' },
		speaking: { accent: '#f43f5e', deep: '#9f1239' }
	};

	// Review words seeding
	let useReviewWords = $state(false);
	let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
	let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
	let isLoadingReviewWords = $state(false);
	let reviewWordsError = $state('');

	function toggleLearningTopic(topicId: string) {
		if (selectedLearningTopics.includes(topicId)) {
			selectedLearningTopics = selectedLearningTopics.filter((t) => t !== topicId);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topicId];
		}
	}

	async function loadReviewWords() {
		if (!data.user?.id) return;

		isLoadingReviewWords = true;
		reviewWordsError = '';

		try {
			const words = await fetchUserReviewWords(data.user.id, reviewWordsSource);
			reviewWords = words;

			if (words.length === 0) {
				reviewWordsError = `You don't have any ${
					reviewWordsSource === 'all' ? 'saved words' : 'words due for review'
				} yet.`;
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
		if (useReviewWords && data.user?.id && contentType === 'sentences') {
			loadReviewWords();
		} else {
			reviewWords = [];
			reviewWordsError = '';
		}
	});

	// Get available categories based on selected dialect
	let availableCategories = $derived.by(() => {
		return data.categories[selectedDialect as keyof typeof data.categories] || [];
	});

	// Reset category when dialect changes
	let previousDialect = $state<Dialect | undefined>(undefined);
	$effect(() => {
		if (previousDialect !== undefined && selectedDialect !== previousDialect) {
			const cats = data.categories[selectedDialect as keyof typeof data.categories] || [];
			if (cats.length > 0) {
				selectedCategory = cats[0].path;
			}
		}
		previousDialect = selectedDialect;
	});

	function getDialectLabel(dialect: string): string {
		const labels: { [key: string]: string } = {
			'egyptian-arabic': 'Egyptian Arabic',
			levantine: 'Levantine Arabic',
			darija: 'Moroccan Darija',
			fusha: 'Modern Standard Arabic (Fusha)'
		};
		return labels[dialect] || dialect;
	}

	function getModeIcon(mode: string): string {
		switch (mode) {
			case 'multiple-choice':
				return '📝';
			case 'listening':
				return '🎧';
			case 'speaking':
				return '🎤';
			default:
				return '🎮';
		}
	}

	function getModeDescription(mode: string): string {
		switch (mode) {
			case 'multiple-choice':
				return 'See a word and select the correct translation from multiple options';
			case 'listening':
				return 'Hear a full sentence and choose what it means';
			case 'speaking':
				return 'See a word and practice pronouncing it correctly';
			default:
				return '';
		}
	}

	let activeLevel = $derived(difficultyOptions.find((d) => d.value === difficulty));

	// A plain-English read-out of the setup, shown beside the start button.
	let summaryLine = $derived(
		[
			`${getDialectEmoji(selectedDialect)} ${getDialectLabel(selectedDialect)}`,
			selectedMode.replace('-', ' '),
			useCustomWords
				? `${questionCount} ${contentType}`
				: getCategoryName(selectedDialect, selectedCategory),
			activeLevel?.sublabel
		]
			.filter(Boolean)
			.join('  ·  ')
	);

	function startGame() {
		if (!gate.tryStartRound()) return;

		const params = new URLSearchParams();
		params.set('dialect', selectedDialect);
		params.set('mode', selectedMode);
		params.set('difficulty', difficulty);
		params.set('contentType', contentType);

		if (useCustomWords) {
			params.set('custom', 'true');
			params.set('count', questionCount.toString());
			if (customTopic) {
				params.set('topic', customTopic);
			}
			// For sentences, include learning topics
			if (contentType === 'sentences' && selectedLearningTopics.length > 0) {
				params.set('learningTopics', selectedLearningTopics.join(','));
			}
			// If using review words for sentences
			if (contentType === 'sentences' && useReviewWords && reviewWords.length > 0) {
				params.set('useReviewWords', 'true');
				// Store review words in sessionStorage since they can be large
				sessionStorage.setItem('gameReviewWords', JSON.stringify(reviewWords));
			}
		} else {
			// For category mode, we use all words from the category
			params.set('category', selectedCategory);
		}

		goto(`/learn/game/play?${params.toString()}`);
	}
</script>

{#snippet stepHead(num: string, title: string, tag: string)}
	<div class="step-head">
		<span class="step-num">{num}</span>
		<h2>{title}</h2>
		<span class="step-tag">{tag}</span>
	</div>
{/snippet}

<section class="mx-auto max-w-3xl px-5 pb-36 pt-8">
	<header class="mb-9">
		<a href="/learn/game" class="back-link">← All games</a>
		<h1 class="hero-title">Arabic Vocabulary Quiz</h1>
		<p class="hero-sub">
			A quiz built fresh each time, in your dialect and at your level. Choose words or sentences,
			add a topic if you like, then answer by reading, listening or speaking.
		</p>
		{#if freeStatus}
			<p class="free-status">{freeStatus}</p>
		{/if}
	</header>

	<!-- In-Progress Games -->
	{#if inProgressGames.length > 0}
		<section class="block">
			<div class="step-head">
				<span class="step-emoji" aria-hidden="true">🎮</span>
				<h2>Continue Playing</h2>
				<span class="step-tag">{inProgressGames.length} saved</span>
			</div>
			<div class="space-y-2.5">
				{#each inProgressGames as game (game.id)}
					<div class="resume" style="--accent:#0ea5e9; --deep:#0369a1;">
						<span class="resume-flag" aria-hidden="true">{getDialectEmoji(game.dialect)}</span>
						<div class="min-w-0 flex-1">
							<p class="resume-name">{getCategoryName(game.dialect, game.category)}</p>
							<p class="resume-meta">
								{getDialectLabel(game.dialect)} ·
								<span class="capitalize">{game.game_mode.replace('-', ' ')}</span>
								· {formatLastPlayed(game.last_played_at)}
							</p>
							<div class="resume-track" aria-hidden="true">
								<div
									class="resume-fill"
									style="width:{Math.round((game.current_index / game.total_questions) * 100)}%"
								></div>
							</div>
							<p class="resume-stats">
								<span>{game.current_index}/{game.total_questions}</span>
								<span class="resume-score">★ {game.score}</span>
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-1.5">
							<button onclick={() => continueGame(game)} class="resume-go">Continue</button>
							<button
								onclick={() => deleteGame(game.id)}
								disabled={deletingGameId === game.id}
								class="resume-del"
								title="Delete game"
								aria-label="Delete game"
							>
								{#if deletingGameId === game.id}
									<div class="spinner"></div>
								{:else}
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 1. Word Source -->
	<section class="block">
		{@render stepHead('1', 'Word Source', useCustomWords ? contentType : 'Category')}

		{#if !useCustomWords}
			<label for="category" class="field-label">Category</label>
			<select id="category" bind:value={selectedCategory} class="field">
				{#each availableCategories as category (category.path)}
					<option value={category.path}>{category.name} ({category.count} words)</option>
				{/each}
			</select>
			<p class="field-hint">You'll practice all words in this category</p>
		{:else}
			<!-- Content type -->
			<div class="grid gap-2.5 sm:grid-cols-2">
				<button
					type="button"
					onclick={() => (contentType = 'words')}
					aria-pressed={contentType === 'words'}
					class="pick {contentType === 'words' ? 'is-on' : ''}"
					style="--accent:#0ea5e9; --deep:#0369a1;"
				>
					<span class="pick-flag" aria-hidden="true">🔤</span>
					<span class="min-w-0 text-left">
						<span class="pick-name">Words</span>
						<span class="pick-sub">Practice individual vocabulary</span>
					</span>
				</button>
				<button
					type="button"
					onclick={() => (contentType = 'sentences')}
					aria-pressed={contentType === 'sentences'}
					class="pick {contentType === 'sentences' ? 'is-on' : ''}"
					style="--accent:#10b981; --deep:#047857;"
				>
					<span class="pick-flag" aria-hidden="true">💬</span>
					<span class="min-w-0 text-left">
						<span class="pick-name">Sentences <span class="rec">Recommended</span></span>
						<span class="pick-sub">Words in real context</span>
					</span>
				</button>
			</div>

			{#if contentType === 'sentences'}
				<p class="note note--good">
					Sentences help with context-based learning — you'll understand how words are used in real
					conversations!
				</p>

				<!-- Review words -->
				{#if data.user}
					<label class="toggle-card mt-3 {useReviewWords ? 'is-on' : ''}">
						<span class="toggle-emoji" aria-hidden="true">🗂️</span>
						<span class="min-w-0 flex-1">
							<span class="toggle-title">Use Your Review Words</span>
							<span class="toggle-note">
								Generate sentences using words from your saved vocabulary
							</span>
						</span>
						<span class="relative inline-flex shrink-0 items-center">
							<input
								type="checkbox"
								bind:checked={useReviewWords}
								class="peer sr-only"
								aria-label="Use your review words"
							/>
							<span class="switch"></span>
						</span>
					</label>

					{#if useReviewWords}
						<div class="seg-wrap mt-3">
							<button
								type="button"
								onclick={() => (reviewWordsSource = 'all')}
								class="seg {reviewWordsSource === 'all' ? 'is-on' : ''}">All Saved Words</button
							>
							<button
								type="button"
								onclick={() => (reviewWordsSource = 'due-for-review')}
								class="seg {reviewWordsSource === 'due-for-review' ? 'is-on' : ''}"
								>Due for Review</button
							>
						</div>

						{#if isLoadingReviewWords}
							<p class="note">Loading words...</p>
						{:else if reviewWordsError}
							<p class="note note--bad">{reviewWordsError}</p>
						{:else if reviewWords.length > 0}
							<p class="note note--good">
								{reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} ready to use
							</p>
						{/if}
					{/if}
				{:else}
					<p class="note">
						<a href="/login" class="font-semibold text-brand underline underline-offset-4">Log in</a
						>
						to use your saved vocabulary words in sentences
					</p>
				{/if}

				<!-- Focus topics -->
				<p class="field-label mt-5">Focus Topics <span class="opt">(optional)</span></p>
				<div class="flex flex-wrap gap-2">
					{#each learningTopics as topic (topic.id)}
						<button
							type="button"
							onclick={() => toggleLearningTopic(topic.id)}
							aria-pressed={selectedLearningTopics.includes(topic.id)}
							class="chip {selectedLearningTopics.includes(topic.id) ? 'is-on' : ''}"
						>
							<span aria-hidden="true">{topic.icon}</span>
							{topic.label}
						</button>
					{/each}
				</div>
				{#if selectedLearningTopics.length > 0}
					<button type="button" onclick={() => (selectedLearningTopics = [])} class="clear-btn"
						>Clear all</button
					>
				{/if}
			{/if}

			<!-- Topic -->
			<label for="customTopic" class="field-label mt-5">
				Topic or Theme <span class="opt">(optional)</span>
			</label>
			<input
				id="customTopic"
				type="text"
				bind:value={customTopic}
				placeholder={contentType === 'words'
					? 'e.g., cooking, travel, emotions...'
					: 'e.g., greetings, shopping, at the restaurant...'}
				class="field"
			/>
			<p class="field-hint">Leave empty for random {contentType}</p>

			<!-- Difficulty -->
			<p class="field-label mt-5">Difficulty Level</p>
			<div class="level-row">
				{#each difficultyOptions as diff (diff.value)}
					<button
						type="button"
						onclick={() => (difficulty = diff.value)}
						aria-pressed={difficulty === diff.value}
						class="level {difficulty === diff.value ? 'is-on' : ''}"
						style="--accent:{diff.accent};"
					>
						<span class="level-bar"></span>
						<span class="level-label">{diff.label}</span>
					</button>
				{/each}
			</div>
			<p class="level-caption">{activeLevel?.label} — {activeLevel?.sublabel}</p>

			<!-- Count -->
			<p class="field-label mt-5">
				How many {contentType === 'words' ? 'words' : 'sentences'}?
			</p>
			<div class="seg-wrap">
				{#each [5, 10, 15, 20] as count (count)}
					<button
						type="button"
						onclick={() => (questionCount = count)}
						aria-pressed={questionCount === count}
						class="seg {questionCount === count ? 'is-on' : ''}">{count}</button
					>
				{/each}
			</div>
		{/if}
	</section>

	<!-- 2. Game Mode -->
	<section class="block">
		{@render stepHead('2', 'Game Mode', selectedMode.replace('-', ' '))}
		<div class="grid gap-2.5 sm:grid-cols-3">
			{#each ['multiple-choice', 'listening', 'speaking'] as mode (mode)}
				<button
					type="button"
					onclick={() => (selectedMode = mode as typeof selectedMode)}
					aria-pressed={selectedMode === mode}
					class="mode {selectedMode === mode ? 'is-on' : ''}"
					style="--accent:{modeAccents[mode].accent}; --deep:{modeAccents[mode].deep};"
				>
					<span class="mode-icon" aria-hidden="true">{getModeIcon(mode)}</span>
					<span class="mode-name capitalize">{mode.replace('-', ' ')}</span>
					<span class="mode-desc">{getModeDescription(mode)}</span>
				</button>
			{/each}
		</div>
	</section>

	<!-- Launch bar -->
	<div class="launch">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
			<p class="launch-summary">{summaryLine}</p>
			<button
				onclick={startGame}
				class="press w-full px-7 py-3.5 sm:w-auto"
				style="--accent:#22c55e; --deep:#15803d;"
			>
				<span aria-hidden="true">🎮</span> Start Game
			</button>
		</div>
	</div>

	<!-- SEO content -->
	<section class="mt-14 block">
		<h2 class="section-title">The quiz modes</h2>
		<div class="grid gap-3 sm:grid-cols-3">
			{#each GAME_MODE_INFO as mode (mode.title)}
				<div class="info-card">
					<span class="info-emoji" aria-hidden="true">{mode.icon}</span>
					<h3>{mode.title}</h3>
					<p>{mode.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-12 block">
		<h2 class="section-title">Common questions</h2>
		<div class="space-y-2.5">
			{#each QUIZ_FAQS as faq (faq.question)}
				<div class="info-card">
					<h3>{faq.question}</h3>
					<p>{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>

	<nav class="footer-nav">
		<a href="/vocabulary">Browse the vocabulary</a>
		<span aria-hidden="true">·</span>
		<a href="/alphabet">Learn the alphabet</a>
		<span aria-hidden="true">·</span>
		<a href="/stories">Read a story</a>
	</nav>
</section>

<!-- Auth Modal for logged out users -->
<AuthModal isOpen={gate.modal === 'auth'} handleCloseModal={gate.closeModal} />

<PaywallModal isOpen={gate.modal === 'paywall'} handleCloseModal={gate.closeModal} />

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
		max-width: 60ch;
	}

	.free-status {
		display: inline-block;
		margin-top: 0.85rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, #22c55e 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.3rem 0.8rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		transition: color 0.2s ease;
	}
	.back-link:hover {
		color: var(--brand);
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

	.step-emoji {
		font-size: 1.35rem;
		line-height: 1;
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
		text-transform: capitalize;
	}

	/* Resume cards */
	.resume {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.95rem 1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.resume:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}

	.resume-flag {
		font-size: 1.6rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.resume-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.resume-meta {
		font-size: 0.76rem;
		color: var(--text2);
		margin-top: 0.1rem;
	}

	.resume-track {
		margin-top: 0.5rem;
		height: 0.4rem;
		border-radius: 100px;
		background: var(--tile5);
		overflow: hidden;
	}

	.resume-fill {
		height: 100%;
		border-radius: 100px;
		background: #22c55e;
		transition: width 0.4s ease;
	}

	.resume-stats {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.3rem;
		font-size: 0.74rem;
		font-weight: 600;
		color: var(--text2);
	}

	.resume-score {
		color: #f59e0b;
	}

	.resume-go {
		border-radius: 100px;
		background: var(--accent);
		color: #fff;
		font-size: 0.83rem;
		font-weight: 600;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			filter 0.2s ease;
	}
	.resume-go:hover {
		filter: brightness(1.08);
	}
	.resume-go:active {
		transform: scale(0.96);
	}

	.resume-del {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		color: var(--text2);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	.resume-del:hover:not(:disabled) {
		background: color-mix(in srgb, #f43f5e 18%, transparent);
		color: #f43f5e;
	}
	.resume-del:disabled {
		opacity: 0.5;
	}
	.resume-del svg {
		width: 1.05rem;
		height: 1.05rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 2px solid var(--text2);
		border-top-color: transparent;
		animation: spin 0.7s linear infinite;
	}

	/* Fields */
	.field-label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
	}

	.opt {
		font-weight: 400;
		color: var(--text2);
	}

	.field {
		width: 100%;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		color: var(--text1);
		transition: border-color 0.2s ease;
	}
	.field:focus {
		outline: none;
		border-color: #0ea5e9;
	}
	.field::placeholder {
		color: var(--text2);
		opacity: 0.65;
	}

	.field-hint {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		color: var(--text2);
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

	.rec {
		font-size: 0.6rem;
		font-weight: 600;
		font-style: normal;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #047857;
		background: color-mix(in srgb, #10b981 28%, transparent);
		border-radius: 100px;
		padding: 0.1rem 0.4rem;
		vertical-align: middle;
	}

	/* Game mode cards */
	.mode {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.4rem;
		padding: 1.1rem 0.9rem;
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

	.mode:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}

	.mode:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.mode.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--tile3));
		box-shadow: 0 4px 0 var(--deep);
	}

	.mode-icon {
		font-size: 1.9rem;
		line-height: 1;
		transition: transform 0.22s ease-out;
	}

	.mode:hover .mode-icon,
	.mode.is-on .mode-icon {
		transform: rotate(-3deg) scale(1.05);
	}

	.mode-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}

	.mode-desc {
		font-size: 0.76rem;
		line-height: 1.45;
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
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
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
		background: #10b981;
	}
	.peer:checked ~ .switch::after {
		transform: translateX(1.25rem);
	}
	.peer:focus-visible ~ .switch {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}

	/* Segmented control */
	.seg-wrap {
		display: inline-flex;
		flex-wrap: wrap;
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

	.press:hover {
		filter: brightness(1.06);
	}

	.press:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--deep);
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
		text-transform: capitalize;
	}

	@media (min-width: 640px) {
		.launch-summary {
			display: block;
		}
	}

	/* SEO sections */
	.section-title {
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
		margin-bottom: 1rem;
	}

	.info-card {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.1rem;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s ease;
	}
	.info-card:hover {
		transform: translateY(-3px);
		border-color: var(--tile6);
	}

	.info-emoji {
		font-size: 1.6rem;
		line-height: 1;
		display: block;
		margin-bottom: 0.5rem;
	}

	.info-card h3 {
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--text1);
	}

	.info-card p {
		margin-top: 0.35rem;
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--tile5);
		font-size: 0.85rem;
		color: var(--text2);
	}
	.footer-nav a {
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		transition: color 0.2s ease;
	}
	.footer-nav a:hover {
		color: var(--brand);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
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
		.spinner {
			animation: none;
		}
		.pick,
		.mode,
		.chip,
		.press,
		.resume,
		.info-card,
		.pick-flag,
		.mode-icon,
		.level-bar,
		.switch::after {
			transition: none;
		}
		.pick:hover,
		.mode:hover,
		.chip:hover,
		.resume:hover,
		.info-card:hover {
			transform: none;
		}
	}
</style>
