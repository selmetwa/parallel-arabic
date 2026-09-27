<script lang="ts">
	import { resolve } from '$app/paths';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import CreateLessonModal from '$lib/components/dialect-shared/lesson/components/CreateLessonModal.svelte';
	import { trackEvent } from '$lib/analytics';

	let { data } = $props();
	let isModalOpen = $state(false);
	let isAuthModalOpen = $state(false);
	let selectedDialect = $state('egyptian-arabic');

	function handleLessonClick(e: MouseEvent, lessonId: string) {
		// Check authentication before navigating
		if (!data.session || !data.user) {
			e.preventDefault();
			trackEvent('lessons_auth_required', { lesson_id: lessonId });
			isAuthModalOpen = true;
			return false;
		}
		trackEvent('lessons_custom_accessed', { lesson_id: lessonId, view: activeView });
		return true;
	}

	// View toggle: 'all' shows public lessons, 'mine' shows user's private lessons
	let activeView = $state<'all' | 'mine'>('all');

	// Search and filter state
	let searchQuery = $state('');
	let filterDialect = $state<string>('all');
	let filterLevel = $state<string>('all');
	let sortBy = $state<'newest' | 'oldest' | 'level' | 'title'>('newest');

	function mapLesson(lesson: object) {
		const lessonData = lesson as {
			id: string;
			title?: string;
			title_arabic?: string;
			description?: string;
			level: string;
			dialect: string;
			dialect_name?: string;
			created_at: string;
			sub_lesson_count?: number;
			estimated_duration?: number;
			lesson_body?: {
				title?: { english?: string; arabic?: string };
				description?: { english?: string };
				subLessons?: unknown[];
				estimatedDuration?: number;
				level?: string;
			};
		};
		const lessonBody = lessonData.lesson_body;
		const subLessonCount = lessonData.sub_lesson_count ?? lessonBody?.subLessons?.length ?? 0;
		const estimatedDuration = lessonData.estimated_duration ?? lessonBody?.estimatedDuration ?? null;
		return {
			id: lessonData.id,
			title: lessonBody?.title?.english || lessonData.title || '',
			description: lessonData.description || lessonBody?.description?.english || '',
			createdAt: lessonData.created_at,
			level: lessonData.level || lessonBody?.level || 'beginner',
			dialect: lessonData.dialect,
			dialectName: lessonData.dialect_name,
			subLessonCount,
			estimatedDuration
		};
	}

	let userGeneratedLessons = $derived(data.user_generated_lessons.map(mapLesson));

	let privateLessons = $derived(data.private_lessons.map(mapLesson));

	function openPaywallModal() {
		isModalOpen = true;
	}

	function handleCloseModal() {
		isModalOpen = false;
	}

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic' },
		{ value: 'fusha', label: 'Modern Standard Arabic' },
		{ value: 'levantine', label: 'Levantine Arabic' },
		{ value: 'darija', label: 'Moroccan Darija' },
	];

	const filterDialectOptions = [
		{ value: 'all', label: 'All Dialects' },
		...dialectOptions
	];

	const levelOptions = [
		{ value: 'all', label: 'All Levels' },
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
	];

	// Level order for sorting
	const levelOrder: Record<string, number> = {
		'beginner': 1,
		'intermediate': 2,
		'advanced': 3,
	};

	// The active lesson list depends on the view
	const activeLessons = $derived(activeView === 'mine' ? privateLessons : userGeneratedLessons);

	// Filter and sort lessons
	const filteredAndSortedLessons = $derived.by(() => {
		let filtered = [...activeLessons];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(lesson =>
				lesson.title?.toLowerCase().includes(query) ||
				lesson.description?.toLowerCase().includes(query)
			);
		}

		// Filter by dialect
		if (filterDialect !== 'all') {
			filtered = filtered.filter(lesson => lesson.dialect === filterDialect);
		}

		// Filter by level
		if (filterLevel !== 'all') {
			filtered = filtered.filter(lesson => 
				lesson.level?.toLowerCase() === filterLevel.toLowerCase()
			);
		}

		// Sort
		if (sortBy === 'newest') {
			filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === 'oldest') {
			filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		} else if (sortBy === 'level') {
			filtered.sort((a, b) => {
				const aLevel = levelOrder[a.level?.toLowerCase() || 'beginner'] || 0;
				const bLevel = levelOrder[b.level?.toLowerCase() || 'beginner'] || 0;
				return aLevel - bLevel;
			});
		} else if (sortBy === 'title') {
			filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
		}

		return filtered;
	});

	// One accent pair per dialect, shared with /lessons/structured and /speak.
	const DIALECT_STYLE: Record<string, { flag: string; short: string; sub: string; accent: string; deep: string }> = {
		'egyptian-arabic': { flag: '🇪🇬', short: 'Egyptian', sub: 'Masri', accent: '#f59e0b', deep: '#b45309' },
		levantine: { flag: '🇱🇧', short: 'Levantine', sub: 'Shami', accent: '#10b981', deep: '#047857' },
		darija: { flag: '🇲🇦', short: 'Darija', sub: 'Moroccan', accent: '#f43f5e', deep: '#9f1239' },
		fusha: { flag: '📖', short: 'MSA', sub: 'Fusha', accent: '#8b5cf6', deep: '#6d28d9' }
	};
	const FALLBACK_STYLE = { flag: '🌍', short: 'Arabic', sub: '', accent: '#0ea5e9', deep: '#0369a1' };

	function dialectStyle(dialect: string) {
		return DIALECT_STYLE[dialect] ?? FALLBACK_STYLE;
	}

	const sortOptions: { value: typeof sortBy; label: string }[] = [
		{ value: 'newest', label: 'Newest' },
		{ value: 'oldest', label: 'Oldest' },
		{ value: 'level', label: 'Level' },
		{ value: 'title', label: 'A–Z' }
	];

	function setView(view: 'all' | 'mine') {
		activeView = view;
		trackEvent('lessons_custom_view_toggled', {
			view,
			lessons_count: view === 'all' ? userGeneratedLessons.length : privateLessons.length
		});
	}

	function setDialectFilter(value: string) {
		filterDialect = value;
		trackEvent('lessons_custom_filter_changed', {
			filter_type: 'dialect',
			value,
			results_count: filteredAndSortedLessons.length
		});
	}

	function setLevelFilter(value: string) {
		filterLevel = value;
		trackEvent('lessons_custom_filter_changed', {
			filter_type: 'level',
			value,
			results_count: filteredAndSortedLessons.length
		});
	}

	function setSort(value: typeof sortBy) {
		sortBy = value;
		trackEvent('lessons_custom_sorted', { sort_by: value });
	}

	function capitalizeFirst(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>
<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
<AuthModal isOpen={isAuthModalOpen} handleCloseModal={() => (isAuthModalOpen = false)}></AuthModal>

<section class="page">
	<div class="inner">
		<a href={resolve('/lessons')} class="back">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
			</svg>
			Lessons
		</a>

		<header class="hero">
			<h1>Custom lessons</h1>
			<p>Create a lesson on any topic in your dialect, or browse the ones other learners made.</p>
		</header>

		<!-- Step 1: create -->
		<div class="step-head">
			<span class="step-num">1</span>
			<h2>Create a lesson</h2>
			<span class="step-tag">Pick a dialect</span>
		</div>

		<div class="picks">
			{#each dialectOptions as option (option.value)}
				{@const d = dialectStyle(option.value)}
				<button
					type="button"
					class="pick"
					class:is-on={selectedDialect === option.value}
					style="--accent:{d.accent}; --deep:{d.deep};"
					aria-pressed={selectedDialect === option.value}
					onclick={() => (selectedDialect = option.value)}
				>
					<span class="pick-flag" aria-hidden="true">{d.flag}</span>
					<span class="min-w-0">
						<span class="pick-name">{option.label}</span>
						<span class="pick-sub">{d.sub}</span>
					</span>
					{#if selectedDialect === option.value}
						<span class="pick-check" aria-hidden="true">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
							</svg>
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="create">
			<CreateLessonModal dialect={selectedDialect as any} {data}></CreateLessonModal>
		</div>

		<!-- Step 2: browse -->
		<div class="step-head step-head--spaced">
			<span class="step-num">2</span>
			<h2>Browse lessons</h2>
			<span class="step-tag">{activeLessons.length} lessons</span>
		</div>

		{#if data.session && data.user}
			<div class="seg-wrap" role="group" aria-label="Which lessons">
				<button type="button" class="seg" class:is-on={activeView === 'all'} onclick={() => setView('all')}>
					All lessons
				</button>
				<button type="button" class="seg" class:is-on={activeView === 'mine'} onclick={() => setView('mine')}>
					🔒 My private lessons
					{#if privateLessons.length > 0}
						<span class="seg-count">{privateLessons.length}</span>
					{/if}
				</button>
			</div>
		{/if}

		<div class="filters">
			<label class="search">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<span class="sr-only">Search lessons</span>
				<input
					type="text"
					placeholder="Search by title or description"
					bind:value={searchQuery}
					onchange={() =>
						searchQuery.trim() &&
						trackEvent('lessons_custom_searched', {
							query: searchQuery,
							results_count: filteredAndSortedLessons.length
						})}
				/>
			</label>

			<div class="filter-row">
				<span class="filter-label">Dialect</span>
				<div class="chips">
					{#each filterDialectOptions as option (option.value)}
						<button
							type="button"
							class="chip"
							class:is-on={filterDialect === option.value}
							onclick={() => setDialectFilter(option.value)}
						>
							{option.value === 'all' ? 'All' : dialectStyle(option.value).short}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-row">
				<span class="filter-label">Level</span>
				<div class="chips">
					{#each levelOptions as option (option.value)}
						<button
							type="button"
							class="chip"
							class:is-on={filterLevel === option.value}
							onclick={() => setLevelFilter(option.value)}
						>
							{option.value === 'all' ? 'All' : option.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-row">
				<span class="filter-label">Sort</span>
				<div class="chips">
					{#each sortOptions as option (option.value)}
						<button
							type="button"
							class="chip"
							class:is-on={sortBy === option.value}
							onclick={() => setSort(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>

			<p class="count">Showing {filteredAndSortedLessons.length} of {activeLessons.length} lessons</p>
		</div>

		{#if activeView === 'mine' && privateLessons.length === 0}
			<div class="empty">
				<div class="msg-emoji">🔒</div>
				<p class="msg-title">No private lessons yet</p>
				<p class="msg-body">
					Turn on “Private lesson” when you create one, and it will only be visible to you.
				</p>
				<div class="mt-6 flex justify-center">
					<CreateLessonModal dialect={selectedDialect as any} {data}></CreateLessonModal>
				</div>
			</div>
		{:else if activeLessons.length === 0}
			<div class="empty">
				<div class="msg-emoji">📚</div>
				<p class="msg-title">No lessons yet</p>
				<p class="msg-body">Create the first one above.</p>
			</div>
		{:else if filteredAndSortedLessons.length === 0}
			<div class="empty">
				<div class="msg-emoji">🔍</div>
				<p class="msg-title">No lessons match</p>
				<p class="msg-body">Try a different search, or clear a filter.</p>
			</div>
		{:else}
			<div class="grid">
				{#each filteredAndSortedLessons as lesson, i (lesson.id)}
					{@const d = dialectStyle(lesson.dialect)}
					<a
						href={resolve(`/lessons/${lesson.id}`)}
						onclick={(e) => handleLessonClick(e, lesson.id)}
						class="card"
						style="--accent:{d.accent}; --deep:{d.deep}; --delay:{Math.min(i, 12) * 40}ms"
					>
						<span class="card-pills">
							<span class="pill pill--dialect">{d.flag} {d.short}</span>
							<span class="pill">{capitalizeFirst(lesson.level)}</span>
						</span>
						<span class="card-title">{lesson.title}</span>
						<span class="card-meta">
							<span>📄 {lesson.subLessonCount} {lesson.subLessonCount === 1 ? 'part' : 'parts'}</span>
							{#if lesson.estimatedDuration}
								<span>⏱ ~{lesson.estimatedDuration} min</span>
							{/if}
						</span>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.page {
		min-height: 100vh;
		padding: 1.5rem 1.25rem 5rem;
	}

	.inner {
		max-width: 960px;
		margin: 0 auto;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		transition:
			transform 0.2s ease,
			color 0.2s ease;
	}
	.back:hover {
		color: var(--text1);
		transform: translateX(-3px);
	}
	.back svg {
		width: 1rem;
		height: 1rem;
	}

	/* Hero */
	.hero {
		margin: 2rem 0 2.5rem;
	}
	.hero h1 {
		font-size: clamp(2.2rem, 6.5vw, 3.2rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		color: var(--text1);
	}
	.hero p {
		margin-top: 0.85rem;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 46ch;
	}

	/* Step headings */
	.step-head {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
		margin-bottom: 0.9rem;
	}
	.step-head--spaced {
		margin-top: 3rem;
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

	/* Dialect picks, as on /speak */
	.picks {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}
	.pick {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.95rem 1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		text-align: left;
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
	.pick-check {
		margin-left: auto;
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		flex-shrink: 0;
		animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.pick-check svg {
		width: 0.8rem;
		height: 0.8rem;
	}

	.create {
		margin-top: 1rem;
	}

	/* Segmented control, as on /speak */
	.seg-wrap {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.25rem;
		margin-bottom: 1.25rem;
		border-radius: 100px;
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}
	.seg {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
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
		background: var(--brand);
		color: #fff;
	}
	.seg-count {
		font-size: 0.7rem;
		border-radius: 100px;
		padding: 0.05rem 0.45rem;
		background: color-mix(in srgb, currentColor 18%, transparent);
	}

	/* Filters */
	.filters {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.search {
		position: relative;
		display: block;
	}
	.search svg {
		position: absolute;
		left: 0.9rem;
		top: 50%;
		width: 1.1rem;
		height: 1.1rem;
		transform: translateY(-50%);
		color: var(--text2);
		pointer-events: none;
	}
	.search input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.6rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.92rem;
		color: var(--text1);
		transition: border-color 0.18s ease;
	}
	.search input::placeholder {
		color: var(--text2);
	}
	.search input:focus {
		outline: none;
		border-color: var(--brand);
	}
	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.filter-label {
		width: 3.5rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text2);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.chip {
		padding: 0.4rem 0.85rem;
		border-radius: 100px;
		font-size: 0.82rem;
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
	.count {
		font-size: 0.82rem;
		color: var(--text2);
	}

	/* Lesson cards: pressable, in the lesson's dialect colour */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 0.9rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 1.1rem;
		border-radius: 1.1rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		box-shadow: 0 4px 0 var(--tile5);
		animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: var(--delay, 0ms);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	.card:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 7px 0 var(--deep);
	}
	.card:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}
	.card:focus-visible,
	.pick:focus-visible,
	.chip:focus-visible,
	.seg:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}
	.card-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.pill {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile4);
		border-radius: 100px;
		padding: 0.18rem 0.55rem;
	}
	.pill--dialect {
		color: var(--text1);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
	}
	.card-title {
		flex: 1;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text1);
	}
	.card-meta {
		display: flex;
		gap: 0.9rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--tile5);
		font-size: 0.78rem;
		color: var(--text2);
	}

	/* Empty states, as on /speak */
	.empty {
		padding: 3rem 1.5rem;
		text-align: center;
		border-radius: 1.25rem;
		border: 2px dashed var(--tile5);
	}
	.msg-emoji {
		font-size: 3rem;
		line-height: 1;
		margin-bottom: 0.9rem;
	}
	.msg-title {
		font-size: 1.4rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
	}
	.msg-body {
		margin: 0.5rem auto 0;
		max-width: 38ch;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text2);
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 620px) {
		.picks {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.pick-check {
			animation: none;
		}
		.back,
		.pick,
		.chip,
		.card {
			transition: none;
		}
		.pick:hover,
		.chip:hover,
		.card:hover {
			transform: none;
		}
	}
</style>
