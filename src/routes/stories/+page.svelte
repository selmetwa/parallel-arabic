<script lang="ts">
	import { goto } from '$app/navigation';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import CreateStoryModal from '$lib/components/dialect-shared/story/components/CreateStoryModal.svelte';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';
	import { START_HERE_TOPICS, ALL_TOPICS } from '$lib/constants/story-topics';
	import type { StoryTopic } from '$lib/constants/story-topics';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

	let { data } = $props();

	// ── Modal / paywall state ────────────────────────────────────────────────
	let isModalOpen = $state(false);
	let isGeneratingModalOpen = $state(false);
	let generatingTopicName = $state('');

	// ── Topic card state ─────────────────────────────────────────────────────
	let selectedDialect = $derived(getDefaultDialect(data.user));
	let completedStoryIds = $derived(new Set<string>(data.completedStoryIds ?? []));
	let generatingTopicId = $state<string | null>(null);
	let topicStoryMap = $state<Record<string, string>>(data.topicStoryMap ?? {});
	let generationError = $state<string | null>(null);
	let allTopicsExpanded = $state(false);

	// ── Lazy-loaded stories ──────────────────────────────────────────────────
	let allLoadedStories = $state<any[]>([]);
	let nextCursor = $state<string | null>(null);
	let hasMore = $state(false);
	let isLoadingStories = $state(false);
	let storiesInitialized = $state(false);
	let storiesSectionEl = $state<HTMLElement | null>(null);
	let loadMoreTrigger = $state<HTMLElement | null>(null);

	// ── Story filters ────────────────────────────────────────────────────────
	let filterDialect = $state('all');
	let filterDifficulty = $state('all');
	let filterByMe = $state(false);

	const dialectName: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic',
		'darija': 'Moroccan Darija',
		'levantine': 'Levantine Arabic',
		'fusha': 'Modern Standard Arabic',
	};

	// Keep topicStoryMap in sync if server data changes (e.g. after navigation)
	$effect(() => {
		if (data.topicStoryMap) topicStoryMap = { ...data.topicStoryMap };
	});

	// ── IntersectionObserver: lazy-load stories section ──────────────────────
	$effect(() => {
		const el = storiesSectionEl;
		if (!el) return;
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadInitialStories();
					obs.disconnect();
				}
			},
			{ rootMargin: '400px' }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});

	// ── IntersectionObserver: infinite scroll ────────────────────────────────
	$effect(() => {
		const el = loadMoreTrigger;
		if (!el) return;
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingStories) {
					loadMoreStories();
				}
			},
			{ rootMargin: '200px' }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});

	// ── Story loading functions ──────────────────────────────────────────────
	function buildStoryParams(extra?: Record<string, string>): URLSearchParams {
		const params = new URLSearchParams({ pageSize: '12' });
		if (filterDialect !== 'all') params.set('dialect', filterDialect);
		if (filterDifficulty !== 'all') params.set('difficulty', filterDifficulty);
		if (filterByMe && data.user?.id) params.set('userId', data.user.id);
		if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
		return params;
	}

	async function loadInitialStories() {
		if (storiesInitialized || isLoadingStories) return;
		storiesInitialized = true;
		isLoadingStories = true;
		try {
			const res = await fetch(`/api/stories?${buildStoryParams()}`);
			const result = await res.json();
			if (result.stories) {
				allLoadedStories = result.stories;
				nextCursor = result.nextCursor;
				hasMore = result.hasMore;
			}
		} catch {
			// silently fail — stories section just stays empty
		} finally {
			isLoadingStories = false;
		}
	}

	async function loadMoreStories() {
		if (isLoadingStories || !hasMore || !nextCursor) return;
		isLoadingStories = true;
		try {
			const res = await fetch(`/api/stories?${buildStoryParams({ cursor: nextCursor })}`);
			const result = await res.json();
			if (result.stories) {
				allLoadedStories = [...allLoadedStories, ...result.stories];
				nextCursor = result.nextCursor;
				hasMore = result.hasMore;
			}
		} catch {
			// silently fail
		} finally {
			isLoadingStories = false;
		}
	}

	async function resetStories() {
		allLoadedStories = [];
		nextCursor = null;
		hasMore = false;
		storiesInitialized = false;
		isLoadingStories = false;
		// Re-initialize immediately if section is already visible
		await loadInitialStories();
	}

	// ── Helpers ──────────────────────────────────────────────────────────────
	function mapProficiencyToDifficulty(level: string | null | undefined): string {
		if (!level) return 'A2';
		const map: Record<string, string> = { beginner: 'A2', intermediate: 'B1', advanced: 'B2' };
		return map[level.toLowerCase()] ?? level ?? 'A2';
	}

	function getSentenceCount(level: string | null | undefined): number {
		if (!level) return 5;
		const l = level.toLowerCase();
		if (l === 'a1' || l === 'a2' || l === 'beginner') return 5;
		if (l === 'b1' || l === 'b2' || l === 'intermediate') return 10;
		if (l === 'c1' || l === 'c2' || l === 'advanced') return 15;
		return 5;
	}

	function getApiUrl(dialect: string): string {
		if (dialect === 'egyptian-arabic') return '/api/create-story-egyptian';
		if (dialect === 'darija') return '/api/create-story-darija';
		return '/api/create-story';
	}

	async function generateTopicStory(topic: StoryTopic) {
		generatingTopicId = topic.id;
		generatingTopicName = topic.name;
		isGeneratingModalOpen = true;
		generationError = null;
		try {
			const reviewWords = await fetchUserReviewWords(data.user.id, 'due-for-review');
			const vocabularyWords = reviewWords
				.slice(0, 15)
				.map((w: { arabic: string; english: string }) => `${w.arabic} (${w.english})`)
				.join(', ');

			const dialect = data.user?.target_dialect ?? 'egyptian-arabic';
			const difficulty = mapProficiencyToDifficulty(data.user?.proficiency_level);
			const apiUrl = getApiUrl(dialect);

			const res = await fetch(apiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', accept: 'application/json' },
				body: JSON.stringify({
					description: topic.promptTemplate,
					dialect,
					difficulty,
					option: difficulty, // Egyptian Arabic endpoint reads `option` for difficulty
					sentenceCount: getSentenceCount(data.user?.proficiency_level),
					storyType: 'story',
					vocabularyWords: vocabularyWords || undefined,
					useReviewWordsOnly: false,
					learningTopics: [],
					reviewWords: []
				})
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Failed to generate story');

			const storyId: string = result.storyId;
			topicStoryMap = { ...topicStoryMap, [topic.id]: storyId };
			// Persist mapping in DB (fire-and-forget — navigation happens immediately)
			fetch('/api/topic-story', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topicId: topic.id, storyId })
			}).catch(() => {});
			isGeneratingModalOpen = false;
			await goto(`/generated_story/${storyId}`);
		} catch (err) {
			isGeneratingModalOpen = false;
			generationError = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
		} finally {
			generatingTopicId = null;
		}
	}

	function isTopicLocked(topic: StoryTopic): boolean {
		return topic.id !== START_HERE_TOPICS[0]?.id && !data.hasActiveSubscription;
	}

	function handleCardClick(topic: StoryTopic) {
		if (!data.user) {
			goto('/login');
			return;
		}
		if (isTopicLocked(topic)) {
			isModalOpen = true;
			return;
		}
		const existingStoryId = topicStoryMap[topic.id];
		if (existingStoryId) {
			goto(`/generated_story/${existingStoryId}`);
		} else {
			generateTopicStory(topic);
		}
	}

	function handleCloseModal() { isModalOpen = false; }

	function getTopicState(topic: StoryTopic): 'completed' | 'in-progress' | 'generating' | 'default' {
		if (generatingTopicId === topic.id) return 'generating';
		const storyId = topicStoryMap[topic.id];
		if (!storyId) return 'default';
		if (completedStoryIds.has(storyId)) return 'completed';
		return 'in-progress';
	}

	function getDialectBadgeColor(dialect: string) {
		const colors: Record<string, string> = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect] || 'bg-gray-100 text-gray-800';
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal} />

<!-- Generating Story Modal -->
<Modal isOpen={isGeneratingModalOpen} handleCloseModal={() => {}} width="700px" height="fit-content">
	<div class="p-6">
		<div class="mx-auto my-8 flex flex-col items-center text-center gap-6 max-w-md">
			<AlphabetCycle />
			<div class="flex flex-col gap-3">
				<h2 class="text-2xl font-bold text-text-300">
					Generating {dialectName[data.user?.target_dialect ?? ''] ?? 'Arabic'} Story...
				</h2>
				<p class="text-text-200 text-lg">
					Creating a story about <span class="font-semibold text-text-300">{generatingTopicName}</span> just for you.
					<span class="block mt-2 text-sm opacity-75">This usually takes about 1–2 minutes.</span>
				</p>
			</div>
			<div class="bg-tile-300 border border-tile-500 rounded-xl p-4 text-left w-full mt-2">
				<div class="flex items-start gap-3">
					<span class="text-2xl">💡</span>
					<div>
						<p class="font-bold text-text-300 text-sm mb-1">Pro Tip</p>
						<p class="text-text-200 text-sm">
							You can close this modal and continue using the app. We'll notify you when your story is ready!
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</Modal>

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="text-left mb-6">
		<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
			<div>
				<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
					What would you like to read about?
				</h1>
				<p class="text-text-200 text-lg leading-snug max-w-2xl">
					Pick a topic and we'll generate a short story in your dialect, weaving in words you're learning.
				</p>
			</div>
			<div class="shrink-0">
				<CreateStoryModal dialect={selectedDialect as any} data={data} />
			</div>
		</div>
	</div>

	<!-- Error Banner -->
	{#if generationError}
		<div class="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
			<span class="shrink-0 text-base">⚠️</span>
			<div>
				<p class="font-medium">Couldn't generate story</p>
				<p class="mt-0.5 opacity-80">{generationError}</p>
			</div>
			<button onclick={() => (generationError = null)} class="ml-auto shrink-0 text-red-400 hover:text-red-600">✕</button>
		</div>
	{/if}

	<!-- Stats Bar -->
	{#if data.user}
		<div class="mb-6 grid grid-cols-3 gap-px bg-tile-500 border border-tile-500 rounded-xl overflow-hidden">
			<div class="bg-tile-400 px-4 py-3 flex flex-col gap-1">
				<span class="text-[11px] uppercase tracking-wider text-text-200 font-semibold">Stories done</span>
				<span class="text-xl font-bold text-text-300 leading-none">{data.completedStoryIds?.length ?? 0}</span>
			</div>
			<div class="bg-tile-400 px-4 py-3 flex flex-col gap-1">
				<span class="text-[11px] uppercase tracking-wider text-text-200 font-semibold">Day streak</span>
				<span class="text-xl font-bold text-text-300 leading-none">{data.user.current_streak ?? 0}</span>
			</div>
			<div class="bg-tile-400 px-4 py-3 flex flex-col gap-1">
				<span class="text-[11px] uppercase tracking-wider text-text-200 font-semibold">Level</span>
				<span class="text-xl font-bold text-text-300 leading-none">{data.user.current_level ?? 1}</span>
			</div>
		</div>
	{/if}

	<!-- Continue Reading -->
	{#if data.resumeStory}
		<div class="mb-6">
			<a
				href={`/generated_story/${data.resumeStory.id}`}
				class="group flex items-center justify-between bg-tile-500 border border-amber-400/50 rounded-xl p-4 sm:p-5 shadow-sm hover:bg-tile-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
			>
				<div class="flex flex-col gap-1 min-w-0">
					<span class="text-xs font-semibold uppercase tracking-widest text-text-200">Continue Reading</span>
					<span class="text-xl sm:text-2xl font-bold text-text-300 group-hover:text-text-200 transition-colors leading-tight truncate">
						{data.resumeStory.title}
					</span>
				</div>
				<div class="shrink-0 ml-6 flex items-center gap-2 text-text-200 group-hover:text-text-300 transition-colors font-medium text-sm">
					<span>Resume</span>
					<span class="text-lg">→</span>
				</div>
			</a>
		</div>
	{/if}

	{#snippet topicCard(topic: StoryTopic)}
		{@const state = getTopicState(topic)}
		{@const locked = isTopicLocked(topic)}
		<button
			onclick={() => handleCardClick(topic)}
			disabled={generatingTopicId !== null}
			title={topic.name}
			class="group/card relative flex items-center gap-2.5 rounded-lg border border-tile-500 px-2.5 py-2 transition-all duration-200 w-full text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 motion-reduce:hover:translate-y-0
				{locked
					? 'bg-tile-400/60 hover:bg-tile-400 hover:shadow-md'
					: state === 'completed'
						? 'bg-tile-400 border-green-500/40 hover:shadow-md hover:-translate-y-0.5'
						: state === 'in-progress'
							? 'bg-tile-400 border-tile-600 hover:shadow-md hover:-translate-y-0.5'
							: state === 'generating'
								? 'bg-tile-500 border-tile-500 cursor-not-allowed'
								: generatingTopicId !== null
									? 'bg-tile-400 opacity-50 cursor-not-allowed'
									: 'bg-tile-400 hover:bg-tile-500 hover:shadow-md hover:border-tile-600 hover:-translate-y-0.5'}"
		>
			<!-- Generating overlay -->
			{#if state === 'generating'}
				<div class="absolute inset-0 rounded-lg bg-tile-400/95 flex items-center justify-center z-10">
					<svg class="animate-spin h-4 w-4 text-text-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
			{/if}

			<!-- Emoji -->
			<span class="text-lg sm:text-xl leading-none shrink-0 {locked ? 'grayscale' : ''}">{topic.emoji}</span>

			<!-- Label -->
			<span class="min-w-0 flex-1 text-xs sm:text-sm font-semibold text-text-300 leading-tight truncate {locked ? 'opacity-60' : ''}">{topic.name}</span>

			<!-- Status -->
			{#if locked}
				<span class="shrink-0 text-xs opacity-70" aria-hidden="true">🔒</span>
			{:else if state === 'completed'}
				<span class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 border border-green-500/40">
					<svg class="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
					</svg>
				</span>
			{:else if state === 'in-progress'}
				<span class="shrink-0 text-text-200 text-sm font-bold" aria-hidden="true">→</span>
			{/if}
		</button>
	{/snippet}

	<!-- Start Here -->
	<div class="mb-8">
		<div class="flex items-center gap-3 sm:gap-4 mb-3">
			<h2 class="text-lg sm:text-xl text-text-300 font-bold tracking-tight whitespace-nowrap">Start Here</h2>
			<div class="h-px bg-tile-500 flex-1"></div>
		</div>
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
			{#each START_HERE_TOPICS as topic (topic.id)}
				{@render topicCard(topic)}
			{/each}
		</div>
	</div>

	<!-- All Topics (collapsed by default) -->
	<div class="mb-8">
		<div class="flex items-center gap-3 sm:gap-4 mb-3">
			<h2 class="text-lg sm:text-xl text-text-300 font-bold tracking-tight whitespace-nowrap">All Topics</h2>
			<div class="h-px bg-tile-500 flex-1"></div>
			<button
				onclick={() => (allTopicsExpanded = !allTopicsExpanded)}
				class="shrink-0 flex items-center gap-1.5 text-sm font-medium text-text-200 hover:text-text-300 transition-colors px-3 py-1.5 rounded-lg border border-tile-500 hover:border-tile-600 bg-tile-400 hover:bg-tile-500"
			>
				{#if allTopicsExpanded}
					Show Less <span>↑</span>
				{:else}
					Show All <span>↓</span>
				{/if}
			</button>
		</div>
		{#if allTopicsExpanded}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
				{#each ALL_TOPICS as topic (topic.id)}
					{@render topicCard(topic)}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Create Your Own -->
	<div class="mb-8">
		<div class="flex items-center gap-3 sm:gap-4 mb-3">
			<h2 class="text-lg sm:text-xl text-text-300 font-bold tracking-tight whitespace-nowrap">Create Your Own</h2>
			<div class="h-px bg-tile-500 flex-1"></div>
		</div>
		<div class="rounded-xl border border-dashed border-tile-500 bg-tile-300 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
			<div>
				<p class="text-text-300 font-semibold text-lg mb-1">Write your own story</p>
				<p class="text-text-200 text-sm max-w-md">Choose your dialect, difficulty, grammar focus, and vocabulary</p>
			</div>
			<div class="shrink-0">
				<CreateStoryModal dialect={selectedDialect as any} data={data} />
			</div>
		</div>
	</div>

	<!-- Stories (lazy-loaded when scrolled into view) -->
	<div bind:this={storiesSectionEl} class="mb-12">
		<div class="flex items-center gap-3 sm:gap-4 mb-3">
			<h2 class="text-lg sm:text-xl text-text-300 font-bold tracking-tight whitespace-nowrap">Stories</h2>
			<div class="h-px bg-tile-500 flex-1"></div>
		</div>

		<!-- Filters -->
		<div class="flex flex-wrap items-end gap-3 mb-4">
			<div class="flex-1 min-w-[140px]">
				<label for="stories-dialect" class="block text-xs font-medium text-text-200 mb-1">Dialect</label>
				<select
					id="stories-dialect"
					bind:value={filterDialect}
					onchange={() => resetStories()}
					class="w-full px-3 py-2 text-sm border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600"
				>
					<option value="all">All Dialects</option>
					<option value="egyptian-arabic">Egyptian Arabic</option>
					<option value="fusha">Modern Standard Arabic</option>
					<option value="levantine">Levantine Arabic</option>
					<option value="darija">Moroccan Darija</option>
				</select>
			</div>
			<div class="flex-1 min-w-[140px]">
				<label for="stories-difficulty" class="block text-xs font-medium text-text-200 mb-1">Difficulty</label>
				<select
					id="stories-difficulty"
					bind:value={filterDifficulty}
					onchange={() => resetStories()}
					class="w-full px-3 py-2 text-sm border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600"
				>
					<option value="all">All Levels</option>
					<option value="a1">A1</option>
					<option value="a2">A2</option>
					<option value="b1">B1</option>
					<option value="b2">B2</option>
					<option value="c1">C1</option>
					<option value="c2">C2</option>
				</select>
			</div>
			{#if data.user}
				<button
					onclick={() => { filterByMe = !filterByMe; resetStories(); }}
					class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors
						{filterByMe
							? 'bg-tile-600 border-tile-600 text-text-300'
							: 'bg-tile-300 border-tile-500 text-text-200 hover:bg-tile-400 hover:border-tile-600'}"
				>
					By Me
				</button>
			{/if}
		</div>

		{#if !storiesInitialized}
			<!-- Placeholder height so IntersectionObserver fires when user scrolls near -->
			<div class="h-32 flex items-center justify-center">
				<span class="text-text-200 text-sm opacity-50">Scroll to load stories</span>
			</div>
		{:else if isLoadingStories && allLoadedStories.length === 0}
			<div class="flex justify-center py-16">
				<svg class="animate-spin h-6 w-6 text-text-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
		{:else if allLoadedStories.length === 0}
			<div class="text-center py-16 bg-tile-400/30 border-2 border-dashed border-tile-500 rounded-xl">
				<div class="text-6xl mb-4 opacity-50">✍️</div>
				<p class="text-text-200 text-xl mb-2">No stories yet</p>
				<p class="text-text-200 text-base opacity-70">Be the first to create one!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each allLoadedStories as story (story.id)}
					{@const isCompleted = completedStoryIds.has(story.id)}
					{@const canReadFull = data.hasActiveSubscription}
					<a
						href={`/generated_story/${story.id}`}
						class="group relative flex flex-col bg-tile-400 border rounded-xl p-4 shadow-sm hover:bg-tile-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 {isCompleted ? 'border-green-500/50 hover:border-green-500/80' : 'border-tile-500 hover:border-tile-500'}"
					>
						{#if isCompleted}
							<div class="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600">
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
								Done
							</div>
						{/if}
						<div class="flex justify-between items-start mb-3">
							<div class="text-3xl">{canReadFull ? '✨' : '🔒'}</div>
							<div class="flex flex-col gap-1 items-end">
								<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full {getDialectBadgeColor(story.dialect)}">
									{story.dialectName}
								</span>
								{#if story.difficulty}
									<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-300 text-text-200 border border-tile-500">
										{story.difficulty.toUpperCase()}
									</span>
								{/if}
							</div>
						</div>
						<h3 class="text-base sm:text-lg font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors leading-tight line-clamp-2">
							{story.title}
						</h3>
						<div class="flex-grow"></div>
						<div class="flex items-center gap-4 pt-3 border-t border-tile-500/50 mt-3 text-sm text-text-200 font-medium opacity-80">
							<div class="flex items-center gap-1.5">
								<span>📝</span>
								<span>{story.length} Sentences</span>
							</div>
						</div>
					</a>
				{/each}
			</div>

			<!-- Infinite scroll trigger -->
			<div bind:this={loadMoreTrigger} class="py-8 flex justify-center">
				{#if isLoadingStories}
					<div class="flex items-center gap-3 text-text-200">
						<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Loading more stories...</span>
					</div>
				{:else if !hasMore}
					<p class="text-text-200 text-sm">You've reached the end</p>
				{/if}
			</div>
		{/if}
	</div>
</section>
