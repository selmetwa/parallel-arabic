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
				title: `${lessonBody?.title?.english || lessonData.title || ''} / ${lessonBody?.title?.arabic || lessonData.title_arabic || ''}`,
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

	function capitalizeFirst(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
	<div class="text-left mb-6">
		<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Lessons</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-snug">Learn Arabic with comprehensive AI-generated lessons from all dialects</p>
		
		<!-- Dialect Selection for Lesson Creation -->
		<div class="mt-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
			<div class="flex flex-col gap-2">
				<label for="dialect-select" class="text-sm text-text-300 font-medium">Choose dialect for new lesson:</label>
				<select 
					id="dialect-select"
					bind:value={selectedDialect}
					class="px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 rounded focus:outline-none focus:border-tile-500"
				>
					{#each dialectOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div class="mt-2 sm:mt-6">
				<CreateLessonModal dialect={selectedDialect as any} data={data}></CreateLessonModal>
			</div>
		</div>
	</div>
</section>

<section class="px-3 mt-8 sm:px-8 max-w-5xl mx-auto pb-12 sm:pb-0">
	<div class="text-left mb-6">
		<h2 class="text-2xl text-text-300 font-bold mb-1">Generated Lessons</h2>
		<p class="text-text-200 text-lg leading-snug">
			Comprehensive lessons created by Parallel Arabic learners from all dialects.
		</p>
	</div>
	
	{#if userGeneratedLessons.length === 0}
		<div class="text-center py-12">
			<p class="text-text-200 text-lg mb-4">No lessons yet. Create your first lesson to get started!</p>
		</div>
	{:else}
		<ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
			{#each userGeneratedLessons as lesson}
				<li class="flex">
					<a href={`/lessons/${lesson.id}`} class="flex w-full">
						<article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
							<div class="flex flex-col gap-2">
								<p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
									{lesson.title}
								</p>
								<div class="flex flex-wrap gap-2">
									<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {getDialectBadgeColor(lesson.dialect)}">
										{lesson.dialectName}
									</span>
									<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {getLevelBadgeColor(lesson.level)}">
										{capitalizeFirst(lesson.level)}
									</span>
								</div>
							</div>
							<div class="flex flex-col gap-0 mt-2">
								<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
									{lesson.subLessonCount} {lesson.subLessonCount === 1 ? 'Sub-lesson' : 'Sub-lessons'}
								</p>
								{#if lesson.estimatedDuration}
									<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
										~{lesson.estimatedDuration} minutes
									</p>
								{/if}
								{#if lesson.description}
									<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
										{lesson.description}
									</p>
								{/if}
							</div>
						</article>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

