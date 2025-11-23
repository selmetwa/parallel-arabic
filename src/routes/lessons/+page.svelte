<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import CreateLessonModal from '$lib/components/dialect-shared/lesson/components/CreateLessonModal.svelte';

	let { data } = $props();
	let isModalOpen = $state(false);
	let selectedDialect = $state('egyptian-arabic');

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

<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
	<div class="text-left mb-12">
		<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Lessons</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">Learn Arabic with comprehensive AI-generated lessons from all dialects.</p>
		
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
		
		{#if userGeneratedLessons.length === 0}
			<div class="text-center py-16 bg-tile-400/30 border-2 border-dashed border-tile-500 rounded-xl">
				<div class="text-6xl mb-4 opacity-50">📚</div>
				<p class="text-text-200 text-xl mb-2">No lessons yet</p>
				<p class="text-text-200 text-base opacity-70">Create your first lesson to get started!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each userGeneratedLessons as lesson}
					<a href={`/lessons/${lesson.id}`} class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-xl p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
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