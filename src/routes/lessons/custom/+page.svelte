<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import CreateLessonModal from '$lib/components/dialect-shared/lesson/components/CreateLessonModal.svelte';

	let { data } = $props();
	let isModalOpen = $state(false);
	let isAuthModalOpen = $state(false);
	let selectedDialect = $state('egyptian-arabic');

	function handleLessonClick(e: MouseEvent, lessonId: string) {
		// Check authentication before navigating
		if (!data.session || !data.user) {
			e.preventDefault();
			isAuthModalOpen = true;
			return false;
		}
		return true;
	}

	// Search and filter state
	let searchQuery = $state('');
	let filterDialect = $state<string>('all');
	let filterLevel = $state<string>('all');
	let sortBy = $state<'newest' | 'oldest' | 'level' | 'title'>('newest');

	let userGeneratedLessons = $derived.by(() => {
		const output = [];

		for (const lesson of data.user_generated_lessons) {
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

			// Use database metadata first (faster), fall back to lesson_body JSON if needed
			const subLessonCount = lessonData.sub_lesson_count ?? lessonBody?.subLessons?.length ?? 0;
			const estimatedDuration = lessonData.estimated_duration ?? lessonBody?.estimatedDuration ?? null;

			output.push({
				id: lessonData.id,
				title: lessonBody?.title?.english || lessonData.title || '',
				description: lessonData.description || lessonBody?.description?.english || '',
				createdAt: lessonData.created_at,
				level: lessonData.level || lessonBody?.level || 'beginner',
				dialect: lessonData.dialect,
				dialectName: lessonData.dialect_name,
				subLessonCount: subLessonCount,
				estimatedDuration: estimatedDuration
			});
		}
		return output;
	});

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

	// Filter and sort lessons
	const filteredAndSortedLessons = $derived.by(() => {
		let filtered = [...userGeneratedLessons];

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

	// Get dialect badge color
	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	// Get level badge color
	function getLevelBadgeColor(level: string) {
		const colors = {
			beginner: 'bg-green-100 text-green-800',
			intermediate: 'bg-yellow-100 text-yellow-800',
			advanced: 'bg-red-100 text-red-800',
		};
		return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	function getDialectLabel(dialect: string, originalName?: string) {
		if (dialect === 'fusha') return 'MSA';
		return originalName || dialect;
	}

	function capitalizeFirst(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
<AuthModal isOpen={isAuthModalOpen} handleCloseModal={() => isAuthModalOpen = false}></AuthModal>

<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
	<div class="text-left mb-12">
		<div class="mb-4">
			<a href="/lessons" class="text-tile-600 hover:text-tile-700 text-sm font-medium flex items-center gap-2 mb-4">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Lessons
			</a>
		</div>
		<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Customizable Lessons</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">Create and explore custom AI-generated lessons from all dialects.</p>
		
		<!-- Dialect Selection for Lesson Creation -->
		<div class="mt-8 p-6 bg-tile-400/50 border border-tile-500 rounded-xl inline-block">
			<h3 class="text-lg font-bold text-text-300 mb-4">Create a New Lesson</h3>
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
				<div class="flex flex-col gap-2">
					<label for="dialect-select" class="text-sm text-text-200 font-medium">Choose dialect:</label>
					<div class="relative">
						<select 
							id="dialect-select"
							bind:value={selectedDialect}
							class="appearance-none pl-4 pr-10 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 min-w-[200px] cursor-pointer"
						>
							{#each dialectOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-300">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</div>
					</div>
				</div>
				<div class="flex-shrink-0">
					<CreateLessonModal dialect={selectedDialect as any} data={data}></CreateLessonModal>
				</div>
			</div>
		</div>
	</div>

	<div>
		<div class="flex items-center gap-4 mb-8">
			<h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Generated Lessons</h2>
			<div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
		</div>

		<!-- Search and Filter Controls -->
		<div class="mb-6 space-y-4">
			<!-- Search Bar -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search lessons by title or description..."
					bind:value={searchQuery}
					class="w-full pl-10 pr-4 py-3 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600"
				/>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
			</div>

			<!-- Filters and Sort -->
			<div class="flex flex-col sm:flex-row gap-4">
				<!-- Dialect Filter -->
				<div class="flex-1">
					<label for="dialect-filter-lessons" class="block text-sm font-medium text-text-200 mb-2">Filter by Dialect</label>
					<select
						id="dialect-filter-lessons"
						bind:value={filterDialect}
						class="w-full px-4 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 cursor-pointer"
					>
						{#each filterDialectOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Level Filter -->
				<div class="flex-1">
					<label for="level-filter-lessons" class="block text-sm font-medium text-text-200 mb-2">Filter by Level</label>
					<select
						id="level-filter-lessons"
						bind:value={filterLevel}
						class="w-full px-4 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 cursor-pointer"
					>
						{#each levelOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Sort -->
				<div class="flex-1">
					<label for="sort-filter-lessons" class="block text-sm font-medium text-text-200 mb-2">Sort By</label>
					<select
						id="sort-filter-lessons"
						bind:value={sortBy}
						class="w-full px-4 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 cursor-pointer"
					>
						<option value="newest">Newest First</option>
						<option value="oldest">Oldest First</option>
						<option value="level">Level (Beginner → Advanced)</option>
						<option value="title">Title (A-Z)</option>
					</select>
				</div>
			</div>

			<!-- Results Count -->
			<div class="text-sm text-text-200">
				Showing {filteredAndSortedLessons.length} of {userGeneratedLessons.length} lessons
			</div>
		</div>
		
		{#if userGeneratedLessons.length === 0}
			<div class="text-center py-16 bg-tile-400/30 border-2 border-dashed border-tile-500 rounded-xl">
				<div class="text-6xl mb-4 opacity-50">📚</div>
				<p class="text-text-200 text-xl mb-2">No lessons yet</p>
				<p class="text-text-200 text-base opacity-70">Create your first lesson to get started!</p>
			</div>
		{:else if filteredAndSortedLessons.length === 0}
			<div class="text-center py-12">
				<p class="text-xl text-text-200">No lessons found matching your criteria.</p>
				<p class="text-text-200 mt-2">Try adjusting your search or filters.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredAndSortedLessons as lesson}
					<a 
						href={`/lessons/${lesson.id}`} 
						onclick={(e) => handleLessonClick(e, lesson.id)}
						class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-xl p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1"
					>
						<div class="flex justify-between items-start mb-4">
							<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full {getDialectBadgeColor(lesson.dialect)}">
								{getDialectLabel(lesson.dialect, lesson.dialectName)}
							</span>
							<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full {getLevelBadgeColor(lesson.level)}">
								{capitalizeFirst(lesson.level)}
							</span>
						</div>
						
						<h3 class="text-2xl font-bold text-text-300 mb-3 group-hover:text-text-200 transition-colors leading-tight flex-grow">
							{lesson.title}
						</h3>
						
						<div class="flex items-center gap-4 pt-4 border-t border-tile-500/50 mt-auto text-sm text-text-200 font-medium opacity-80">
							<div class="flex items-center gap-1.5">
								<span>📄</span>
								<span>{lesson.subLessonCount} {lesson.subLessonCount === 1 ? 'Sub-lesson' : 'Sub-lessons'}</span>
							</div>
							{#if lesson.estimatedDuration}
								<div class="flex items-center gap-1.5">
									<span>⏱️</span>
									<span>~{lesson.estimatedDuration}m</span>
								</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

