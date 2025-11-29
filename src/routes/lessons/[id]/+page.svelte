<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import InteractiveExercise from '$lib/components/dialect-shared/lesson/InteractiveExercise.svelte';
	import ReviewCarousel from '$lib/components/dialect-shared/lesson/ReviewCarousel.svelte';
	import PronunciationTestModal from '$lib/components/dialect-shared/lesson/PronunciationTestModal.svelte';
	import LessonPlayer from '$lib/components/LessonPlayer.svelte';
	import type { Dialect } from '$lib/types/index';
	import type { GeneratedLesson } from '$lib/schemas/curriculum-schema';

	let { data } = $props<{ data: PageData }>();
	
	let lesson = $state(data.lesson);
	let loading = $state(false);
	let error = $state<string | null>(data.error || null);
	
	// Check if this is a step-based lesson (new format) or subLessons-based (old format)
	const lessonBody = lesson?.lesson_body || lesson;
	const isStepBasedLesson = $derived(lessonBody?.steps && Array.isArray(lessonBody.steps) && lessonBody.steps.length > 0);
	
	// For step-based lessons, show LessonPlayer
	let showLessonPlayer = $state(false);
	
	// Sub-lesson navigation state (for old format)
	let currentSubLessonIndex = $state(0);
	let showSubLessonIndex = $state(true);
	
	// Pronunciation test modal state
	let pronunciationModalOpen = $state(false);
	let pronunciationText = $state('');
	let pronunciationTransliteration = $state('');
	let pronunciationEnglish = $state('');
	
	// Auto-show LessonPlayer for step-based lessons
	$effect(() => {
		if (isStepBasedLesson && !showLessonPlayer) {
			showLessonPlayer = true;
		}
	});

	function openPronunciationTest(text: string, transliteration?: string, english?: string) {
		pronunciationText = text;
		pronunciationTransliteration = transliteration || '';
		pronunciationEnglish = english || '';
		pronunciationModalOpen = true;
	}

	function closePronunciationModal() {
		pronunciationModalOpen = false;
		pronunciationText = '';
		pronunciationTransliteration = '';
		pronunciationEnglish = '';
	}

	// Note: Lessons are now stored in database, so we don't need sessionStorage fallback
	// But keeping the check for backward compatibility with any old lessons in sessionStorage
	onMount(() => {
		if (data.checkSessionStorage && !lesson) {
			// Lesson not found in database - show error
			error = data.error || 'Lesson not found.';
		}
		
		// Only set wider width for old format lessons
		if (!isStepBasedLesson) {
			const root = document.documentElement;
			const originalWidth = getComputedStyle(root).getPropertyValue('--layout-width');
			root.style.setProperty('--layout-width', '1600px');
			
			// Restore original width on unmount
			return () => {
				root.style.setProperty('--layout-width', originalWidth);
			};
		}
	});
	
	// Handle closing the LessonPlayer
	function handleLessonPlayerClose() {
		showLessonPlayer = false;
		goto('/lessons');
	}
	
	// Handle lesson completion
	async function handleLessonComplete() {
		// For user-generated lessons, just close and go back to lessons list
		goto('/lessons');
	}
	
	// Convert lesson body to GeneratedLesson format for LessonPlayer
	function getStepBasedLesson(): GeneratedLesson | null {
		if (!lessonBody || !lessonBody.steps) return null;
		return {
			topicId: lessonBody.topicId || lesson?.id || '',
			title: lessonBody.title || lesson?.title || 'Lesson',
			dialect: lessonBody.dialect || lesson?.dialect || 'egyptian-arabic',
			steps: lessonBody.steps
		};
	}
	
	// Get dialect for audio (convert database dialect to Dialect type)
	const dialect = (lesson?.dialect || lessonBody?.dialect || 'egyptian-arabic') as Dialect;

	// Helper functions
	function getLevelBadgeColor(level: string) {
		const colors = {
			beginner: 'bg-green-100 text-green-800',
			intermediate: 'bg-yellow-100 text-yellow-800',
			advanced: 'bg-red-100 text-red-800',
		};
		return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	function capitalizeFirst(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
	
	// Helper function to count exercises in a sub-lesson
	function countExercises(subLesson: any): number {
		return subLesson?.exercises?.length || 0;
	}
	
	// Navigation functions
	function goToSubLesson(index: number) {
		if (lessonBody?.subLessons && index >= 0 && index < lessonBody.subLessons.length) {
			currentSubLessonIndex = index;
			// Scroll to top of sub-lesson area
			const subLessonElement = document.getElementById(`sub-lesson-${index}`);
			if (subLessonElement) {
				subLessonElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}
	
	function goToNextSubLesson() {
		if (lessonBody?.subLessons && currentSubLessonIndex < lessonBody.subLessons.length - 1) {
			goToSubLesson(currentSubLessonIndex + 1);
		}
	}
	
	function goToPreviousSubLesson() {
		if (currentSubLessonIndex > 0) {
			goToSubLesson(currentSubLessonIndex - 1);
		}
	}
	
	// Check if we're on the last sub-lesson
	const isLastSubLesson = $derived.by(() => {
		return lessonBody?.subLessons ? currentSubLessonIndex === lessonBody.subLessons.length - 1 : false;
	});
	
	// Check if we're on the first sub-lesson
	const isFirstSubLesson = $derived.by(() => {
		return currentSubLessonIndex === 0;
	});
</script>

<svelte:head>
	<title>
		{isStepBasedLesson ? (lessonBody?.title || 'Lesson') : (lessonBody?.title?.english || 'Lesson')} - Parallel Arabic
	</title>
</svelte:head>

<!-- Step-based Lesson Player (new format) -->
{#if isStepBasedLesson && showLessonPlayer}
	{@const stepLesson = getStepBasedLesson()}
	{#if stepLesson}
		<LessonPlayer 
			lesson={stepLesson}
			onClose={handleLessonPlayerClose}
			onLessonComplete={handleLessonComplete}
		/>
	{/if}
{:else}
<!-- Old format lesson UI -->
<div class="min-h-screen bg-tile-100">
	{#if error}
		<div class="px-3 py-12 sm:px-8 mx-auto" style="max-width: var(--layout-width, 1600px);">
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<h1 class="text-2xl font-bold text-red-800 mb-2">Lesson Not Found</h1>
				<p class="text-red-600">{error}</p>
				<a href="/lessons" class="mt-4 inline-block text-blue-600 hover:text-blue-800 underline">
					← Back to Lessons
				</a>
			</div>
		</div>
	{:else if !lessonBody}
		<div class="px-3 py-12 sm:px-8 mx-auto" style="max-width: var(--layout-width, 1600px);">
			<div class="text-center">
				<p class="text-text-200 text-lg">Loading lesson...</p>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="bg-tile-200 border-b border-tile-600">
			<div class="px-3 py-6 sm:px-8 mx-auto" style="max-width: var(--layout-width, 1600px);">
				<a href="/lessons" class="inline-flex items-center text-text-300 hover:text-text-200 mb-4 transition-colors">
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Lessons
				</a>
				
				<div class="flex flex-wrap gap-2 mb-4">
					{#if lessonBody.dialect || lesson?.dialect}
						<span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full {getDialectBadgeColor(lessonBody.dialect || lesson?.dialect)}">
							{lesson?.dialect_name || capitalizeFirst((lessonBody.dialect || lesson?.dialect || '').replace('-', ' '))}
						</span>
					{/if}
					{#if lessonBody.level}
						<span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full {getLevelBadgeColor(lessonBody.level)}">
							{capitalizeFirst(lessonBody.level)}
						</span>
					{/if}
					{#if lessonBody.estimatedDuration}
						<span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
							~{lessonBody.estimatedDuration} min
						</span>
					{/if}
				</div>

				<h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-2">
					{lessonBody.title?.english || 'Untitled Lesson'}
				</h1>
				{#if lessonBody.title?.arabic}
					<div class="flex items-center gap-2 mb-2">
						<h2 class="text-2xl sm:text-3xl text-text-200" dir="rtl">
							{lessonBody.title.arabic}
						</h2>
						<InlineAudioButton text={lessonBody.title.arabic} {dialect} />
					</div>
				{/if}
				{#if lessonBody.title?.transliteration}
					<p class="text-lg text-text-200 italic">
						{lessonBody.title.transliteration}
					</p>
				{/if}

				{#if lessonBody.description}
					<div class="mt-4 text-text-200">
						{#if lessonBody.description.english}
							<p class="text-lg mb-2">{lessonBody.description.english}</p>
						{/if}
						{#if lessonBody.description.arabic}
							<p class="text-lg" dir="rtl">{lessonBody.description.arabic}</p>
						{/if}
					</div>
				{/if}

				{#if lessonBody.learningObjectives && lessonBody.learningObjectives.length > 0}
					<div class="mt-6">
						<h3 class="text-xl font-semibold text-text-300 mb-2">Learning Objectives</h3>
						<ul class="list-disc list-inside space-y-1 text-text-200">
							{#each lessonBody.learningObjectives as objective}
								<li>{objective}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>

		<!-- Main Content -->
		<div class="px-3 py-8 sm:px-8 mx-auto" style="max-width: var(--layout-width, 1600px);">
			<!-- Sub-Lessons -->
			{#if lessonBody.subLessons && lessonBody.subLessons.length > 0}
				<div class="flex gap-6 mb-12">
					<!-- Sub-Lesson Index Sidebar -->
					<div class="hidden lg:block w-64 flex-shrink-0">
						<div class="sticky top-6 bg-tile-400 border-2 border-tile-600 rounded-lg p-4 shadow-lg">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-bold text-text-300">Sub-Lessons</h3>
								<button
									type="button"
									onclick={() => showSubLessonIndex = !showSubLessonIndex}
									class="p-1 hover:bg-tile-500 rounded transition-colors"
									title={showSubLessonIndex ? 'Hide index' : 'Show index'}
									aria-label={showSubLessonIndex ? 'Hide sub-lesson index' : 'Show sub-lesson index'}
								>
									<svg class="w-5 h-5 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={showSubLessonIndex ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
									</svg>
								</button>
							</div>
							{#if showSubLessonIndex}
								<nav class="space-y-2">
									{#each lessonBody.subLessons as subLesson, index}
										<button
											type="button"
											onclick={() => goToSubLesson(index)}
											class="w-full text-left p-3 rounded-lg border-2 transition-all {currentSubLessonIndex === index ? 'bg-tile-500 border-tile-600 text-text-300' : 'bg-tile-300 border-tile-500 text-text-200 hover:bg-tile-400 hover:border-tile-600'}"
										>
											<div class="flex items-start justify-between gap-2">
												<div class="flex-1 min-w-0">
													<div class="font-semibold text-sm mb-1 truncate">
														{index + 1}. {subLesson.title?.english || `Sub-lesson ${index + 1}`}
													</div>
													{#if subLesson.exercises && subLesson.exercises.length > 0}
														<div class="text-xs opacity-75 flex items-center gap-1">
															<span>📝</span>
															<span>{subLesson.exercises.length} {subLesson.exercises.length === 1 ? 'exercise' : 'exercises'}</span>
														</div>
													{:else}
														<div class="text-xs opacity-50">No exercises</div>
													{/if}
												</div>
												{#if currentSubLessonIndex === index}
													<div class="w-2 h-2 bg-tile-600 rounded-full flex-shrink-0 mt-1.5"></div>
												{/if}
											</div>
										</button>
									{/each}
								</nav>
							{/if}
						</div>
					</div>
					
					<!-- Sub-Lesson Content Area -->
					<div class="flex-1 min-w-0">
						<!-- Mobile Index Toggle -->
						<div class="lg:hidden mb-4">
							<button
								type="button"
								onclick={() => showSubLessonIndex = !showSubLessonIndex}
								class="w-full bg-tile-400 border-2 border-tile-600 rounded-lg p-4 flex items-center justify-between"
							>
								<span class="font-bold text-text-300">
									Sub-lesson {currentSubLessonIndex + 1} of {lessonBody.subLessons.length}
								</span>
								<svg class="w-5 h-5 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={showSubLessonIndex ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
								</svg>
							</button>
							{#if showSubLessonIndex}
								<div class="mt-2 bg-tile-400 border-2 border-tile-600 rounded-lg p-4">
									<nav class="space-y-2">
										{#each lessonBody.subLessons as subLesson, index}
											<button
												type="button"
												onclick={() => { goToSubLesson(index); showSubLessonIndex = false; }}
												class="w-full text-left p-3 rounded-lg border-2 transition-all {currentSubLessonIndex === index ? 'bg-tile-500 border-tile-600 text-text-300' : 'bg-tile-300 border-tile-500 text-text-200 hover:bg-tile-400'}"
											>
												<div class="flex items-start justify-between gap-2">
													<div class="flex-1 min-w-0">
														<div class="font-semibold text-sm mb-1 truncate">
															{index + 1}. {subLesson.title?.english || `Sub-lesson ${index + 1}`}
														</div>
														{#if subLesson.exercises && subLesson.exercises.length > 0}
															<div class="text-xs opacity-75 flex items-center gap-1">
																<span>📝</span>
																<span>{subLesson.exercises.length} {subLesson.exercises.length === 1 ? 'exercise' : 'exercises'}</span>
															</div>
														{:else}
															<div class="text-xs opacity-50">No exercises</div>
														{/if}
													</div>
												</div>
											</button>
										{/each}
									</nav>
								</div>
							{/if}
						</div>
						
						<!-- Current Sub-Lesson Display -->
						<div class="relative">
					{#each lessonBody.subLessons as subLesson, index}
								{#if index === currentSubLessonIndex}
									<div id="sub-lesson-{index}" class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
							<div class="mb-4">
								<span class="inline-block bg-tile-500 text-text-300 px-3 py-1 rounded-full text-sm font-semibold mb-2">
									Sub-lesson {index + 1}
								</span>
								<h2 class="text-2xl font-bold text-text-300 mt-2">
									{subLesson.title?.english || 'Untitled Sub-lesson'}
								</h2>
								{#if subLesson.title?.arabic}
									<div class="flex items-center gap-2 mt-1">
										<h3 class="text-xl text-text-200" dir="rtl">
											{subLesson.title.arabic}
										</h3>
										<InlineAudioButton text={subLesson.title.arabic} {dialect} />
									</div>
								{/if}
								{#if subLesson.title?.transliteration}
									<p class="text-text-200 italic mt-1">
										{subLesson.title.transliteration}
									</p>
								{/if}
							</div>

							<!-- Content Section -->
							{#if subLesson.content}
								<div class="mb-6">
									{#if subLesson.content.title}
										<h3 class="text-xl font-semibold text-text-300 mb-3">
											{subLesson.content.title.english || subLesson.content.title.arabic}
										</h3>
									{/if}

									<!-- Phrases/Vocabulary -->
									{#if subLesson.content.phrases && subLesson.content.phrases.length > 0}
										<div class="mb-6">
											<h4 class="text-lg font-semibold text-text-300 mb-3">Vocabulary & Phrases</h4>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
												{#each subLesson.content.phrases as phrase}
													<div class="bg-tile-300 p-4 rounded border border-tile-600">
														<div class="flex items-start justify-between gap-2">
															<div class="flex-1">
																<div class="flex items-center gap-2 mb-1">
																	<p class="text-xl font-semibold text-text-300" dir="rtl">
																		{phrase.arabic}
																	</p>
																	<InlineAudioButton text={phrase.arabic} {dialect} />
																</div>
																<p class="text-text-200 font-medium">{phrase.english}</p>
																<p class="text-text-200 italic text-sm mt-1">{phrase.transliteration}</p>
															</div>
															<button
																type="button"
																onclick={() => openPronunciationTest(phrase.arabic, phrase.transliteration, phrase.english)}
																class="px-3 py-1 text-xs bg-tile-500 text-text-300 rounded hover:bg-tile-600 transition-colors whitespace-nowrap"
																title="Test pronunciation"
															>
																🎤 Test
															</button>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}

									<!-- Explanations -->
									{#if subLesson.content.explanations && subLesson.content.explanations.length > 0}
										<div class="mb-6">
											<h4 class="text-lg font-semibold text-text-300 mb-3">Explanations</h4>
											<div class="space-y-2">
												{#each subLesson.content.explanations as explanation}
													<div class="bg-tile-300 p-4 rounded border border-tile-600">
														<p class="text-text-200">{explanation.english}</p>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Exercises -->
							{#if subLesson.exercises && subLesson.exercises.length > 0}
								<div class="mt-6 pt-6 border-t border-tile-600">
									<h4 class="text-lg font-semibold text-text-300 mb-4">
										Exercises ({subLesson.exercises.length})
									</h4>
									<div class="space-y-6">
										{#each subLesson.exercises as exercise}
											<InteractiveExercise {exercise} {dialect} />
										{/each}
									</div>
								</div>
							{/if}
							
							<!-- Navigation Buttons -->
							<div class="mt-8 pt-6 border-t border-tile-600 flex items-center justify-between">
								<button
									type="button"
									onclick={goToPreviousSubLesson}
									disabled={isFirstSubLesson}
									class="px-6 py-3 bg-tile-500 text-text-300 rounded-lg font-semibold hover:bg-tile-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
									</svg>
									Previous
								</button>
								
								<div class="text-text-200 text-sm font-medium">
									{currentSubLessonIndex + 1} of {lessonBody.subLessons.length}
								</div>
								
								{#if isLastSubLesson}
									<button
										type="button"
										onclick={() => {
											const reviewSection = document.getElementById('review-section');
											if (reviewSection) {
												reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
											}
										}}
										class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
									>
										Continue to Review
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								{:else}
									<button
										type="button"
										onclick={goToNextSubLesson}
										class="px-6 py-3 bg-tile-500 text-text-300 rounded-lg font-semibold hover:bg-tile-600 transition-colors flex items-center gap-2"
									>
										Next
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								{/if}
							</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Review Section -->
			{#if lessonBody.review}
				<div id="review-section" class="mb-8 space-y-6">
					<!-- Review Words -->
					{#if lessonBody.review.words && lessonBody.review.words.length > 0}
						<ReviewCarousel items={lessonBody.review.words} {dialect} title="Key Vocabulary" />
					{/if}

					<!-- Review Sentences -->
					{#if lessonBody.review.sentences && lessonBody.review.sentences.length > 0}
						<ReviewCarousel items={lessonBody.review.sentences} {dialect} title="Practice Sentences" />
					{/if}
				</div>
			{/if}

			<!-- Additional Sections -->
			<div class="space-y-6">
				<!-- Grammar Focus -->
				{#if lessonBody.grammarFocus && lessonBody.grammarFocus.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Grammar Focus</h2>
						<div class="space-y-4">
							{#each lessonBody.grammarFocus as grammar}
								<div class="bg-tile-300 p-4 rounded border border-tile-600">
									<h3 class="text-lg font-semibold text-text-300 mb-2">{grammar.title}</h3>
									<p class="text-text-200 mb-2">{grammar.english}</p>
									{#if grammar.arabic}
										<p class="text-text-200 mb-2" dir="rtl">{grammar.arabic}</p>
									{/if}
									{#if grammar.examples && grammar.examples.length > 0}
										<div class="mt-3 space-y-2">
											{#each grammar.examples as example}
												<div class="pl-4 border-l-2 border-tile-500">
													<div class="flex items-center gap-2 justify-between">
														<div class="flex items-center gap-2 flex-1">
															<p class="text-text-300 font-semibold" dir="rtl">{example.arabic}</p>
															<InlineAudioButton text={example.arabic} {dialect} />
														</div>
														<button
															type="button"
															onclick={() => openPronunciationTest(example.arabic, example.transliteration, example.english)}
															class="px-2 py-1 text-xs bg-tile-500 text-text-300 rounded hover:bg-tile-600 transition-colors whitespace-nowrap"
															title="Test pronunciation"
														>
															🎤 Test
														</button>
													</div>
													<p class="text-text-200">{example.english}</p>
													<p class="text-text-200 italic text-sm">{example.transliteration}</p>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Cultural Notes -->
				{#if lessonBody.culturalNotes && lessonBody.culturalNotes.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Cultural Notes</h2>
						<div class="space-y-4">
							{#each lessonBody.culturalNotes as note}
								<div class="bg-tile-300 p-4 rounded border border-tile-600">
									{#if note.title}
										<h3 class="text-lg font-semibold text-text-300 mb-2">{note.title}</h3>
									{/if}
									<p class="text-text-200">{note.english}</p>
									{#if note.arabic}
										<p class="text-text-200 mt-2" dir="rtl">{note.arabic}</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Pronunciation Tips -->
				{#if lessonBody.pronunciationTips && lessonBody.pronunciationTips.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Pronunciation Tips</h2>
						<div class="space-y-4">
							{#each lessonBody.pronunciationTips as tip}
								<div class="bg-tile-300 p-4 rounded border border-tile-600">
									<h3 class="text-lg font-semibold text-text-300 mb-2">
										Sound: {tip.sound}
										{#if tip.transliteration}
											<span class="text-text-200 font-normal">({tip.transliteration})</span>
										{/if}
									</h3>
									<p class="text-text-200 mb-2">{tip.description}</p>
									{#if tip.examples && tip.examples.length > 0}
										<div class="mt-3 space-y-2">
											{#each tip.examples as example}
												<div class="pl-4 border-l-2 border-tile-500">
													<div class="flex items-center gap-2 justify-between">
														<div class="flex items-center gap-2 flex-1">
															<p class="text-text-300 font-semibold" dir="rtl">{example.arabic}</p>
															<InlineAudioButton text={example.arabic} {dialect} />
														</div>
														<button
															type="button"
															onclick={() => openPronunciationTest(example.arabic, example.transliteration, example.english)}
															class="px-2 py-1 text-xs bg-tile-500 text-text-300 rounded hover:bg-tile-600 transition-colors whitespace-nowrap"
															title="Test pronunciation"
														>
															🎤 Test
														</button>
													</div>
													<p class="text-text-200">{example.english}</p>
													<p class="text-text-200 italic text-sm">{example.transliteration}</p>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Common Mistakes -->
				{#if lessonBody.commonMistakes && lessonBody.commonMistakes.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Common Mistakes</h2>
						<div class="space-y-4">
							{#each lessonBody.commonMistakes as mistake}
								<div class="bg-tile-300 p-4 rounded border border-tile-600">
									<h3 class="text-lg font-semibold text-text-300 mb-2">{mistake.mistake}</h3>
									<p class="text-text-200 mb-2">
										<strong>Correct:</strong> {mistake.correct}
									</p>
									<p class="text-text-200">{mistake.explanation}</p>
									{#if mistake.examples && mistake.examples.length > 0}
										<div class="mt-4 space-y-3">
											{#each mistake.examples as example}
												<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
													<div class="p-3 bg-red-50 border border-red-200 rounded">
														<p class="text-sm font-semibold text-red-800 mb-1">Incorrect</p>
														<div class="flex items-center gap-2 mb-1">
															<p class="text-text-300 font-semibold" dir="rtl">{example.incorrect.arabic}</p>
															<InlineAudioButton text={example.incorrect.arabic} {dialect} />
														</div>
														<p class="text-text-200 text-sm">{example.incorrect.english}</p>
													</div>
													<div class="p-3 bg-green-50 border border-green-200 rounded">
														<div class="flex items-center justify-between mb-1">
															<p class="text-sm font-semibold text-green-800">Correct</p>
															<button
																type="button"
																onclick={() => openPronunciationTest(example.correct.arabic, example.correct.transliteration, example.correct.english)}
																class="px-2 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300 transition-colors whitespace-nowrap"
																title="Test pronunciation"
															>
																🎤 Test
															</button>
														</div>
														<div class="flex items-center gap-2 mb-1">
															<p class="text-text-300 font-semibold" dir="rtl">{example.correct.arabic}</p>
															<InlineAudioButton text={example.correct.arabic} {dialect} />
														</div>
														<p class="text-text-200 text-sm">{example.correct.english}</p>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Summary -->
				{#if lessonBody.summary}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Summary</h2>
						{#if lessonBody.summary.english}
							<p class="text-text-200 text-lg mb-2">{lessonBody.summary.english}</p>
						{/if}
						{#if lessonBody.summary.arabic}
							<p class="text-text-200 text-lg" dir="rtl">{lessonBody.summary.arabic}</p>
						{/if}
					</div>
				{/if}

				<!-- Key Takeaways -->
				{#if lessonBody.keyTakeaways && lessonBody.keyTakeaways.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-4">Key Takeaways</h2>
						<ul class="list-disc list-inside space-y-2 text-text-200">
							{#each lessonBody.keyTakeaways as takeaway}
								<li>{takeaway}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Quiz Section -->
				{#if lessonBody.quiz && lessonBody.quiz.questions && lessonBody.quiz.questions.length > 0}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<h2 class="text-2xl font-bold text-text-300 mb-2">Lesson Quiz</h2>
						{#if lessonBody.quiz.title}
							<h3 class="text-xl font-semibold text-text-300 mb-2">{lessonBody.quiz.title}</h3>
						{/if}
						{#if lessonBody.quiz.description}
							<p class="text-text-200 mb-6">{lessonBody.quiz.description}</p>
						{/if}
						<div class="space-y-6">
							{#each lessonBody.quiz.questions as question, index}
								<div>
									<p class="text-sm text-text-200 mb-2">Question {index + 1} of {lessonBody.quiz.questions.length}</p>
									<InteractiveExercise exercise={question} {dialect} />
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Create Your Own Lesson CTA -->
				<div class="mt-12 mb-8 bg-gradient-to-r from-tile-500 to-tile-600 border-2 border-tile-600 rounded-xl p-8 shadow-xl">
					<div class="text-center">
						<h2 class="text-3xl font-bold text-text-300 mb-3">Ready to Create Your Own Lesson?</h2>
						<p class="text-text-200 text-lg mb-6 max-w-2xl mx-auto">
							You've completed this lesson! Now create a personalized lesson tailored to your specific learning goals and interests.
						</p>
						<a 
							href="/lessons" 
							class="inline-block px-8 py-4 bg-tile-300 hover:bg-tile-200 text-text-300 font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform border-2 border-tile-400"
						>
							Create Your Own Lesson →
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Pronunciation Test Modal -->
<PronunciationTestModal
	isOpen={pronunciationModalOpen}
	closeModal={closePronunciationModal}
	text={pronunciationText}
	transliteration={pronunciationTransliteration}
	english={pronunciationEnglish}
	{dialect}
/>
{/if}
