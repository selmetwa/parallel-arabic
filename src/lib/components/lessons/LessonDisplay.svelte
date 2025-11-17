<script lang="ts">
	import type { Lesson, SubLesson } from '$lib/constants/lessons';
	import ExerciseBlock from './ExerciseBlock.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { Dialect } from '$lib/types';

	interface Props {
		lesson: Lesson;
		dialect: Dialect;
	}

	let { lesson, dialect }: Props = $props();

	let currentSubLessonIndex = $state(0);
	let showTransliteration = $state(true);
	let showEnglish = $state(true);

	const currentSubLesson = $derived(lesson.subLessons[currentSubLessonIndex]);

	function nextSubLesson() {
		if (currentSubLessonIndex < lesson.subLessons.length - 1) {
			currentSubLessonIndex++;
		}
	}

	function previousSubLesson() {
		if (currentSubLessonIndex > 0) {
			currentSubLessonIndex--;
		}
	}

	function goToSubLesson(index: number) {
		currentSubLessonIndex = index;
	}
</script>

<div class="min-h-screen bg-tile-200 py-8">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Lesson Header -->
		<header class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
			<div class="flex flex-col gap-3">
				<h1 class="text-3xl sm:text-4xl font-bold text-text-300" dir="rtl">
					{lesson.title.arabic}
				</h1>
				<h2 class="text-xl sm:text-2xl text-text-200">
					{lesson.title.english}
				</h2>
				{#if lesson.title.transliteration}
					<p class="text-text-300 text-lg">
						{lesson.title.transliteration}
					</p>
				{/if}
				<div class="flex items-center gap-2 mt-2">
					<span
						class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
					>
						{lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
					</span>
				</div>
			</div>
		</header>

		<!-- Sub-lesson Navigation -->
		<div class="bg-tile-400 border border-tile-600 p-4 rounded-lg shadow-lg mb-6">
			<div class="flex flex-wrap gap-2 mb-4">
				{#each lesson.subLessons as subLesson, index}
					<button
						type="button"
						onclick={() => goToSubLesson(index)}
						class="px-4 py-2 rounded border transition-all duration-300 {currentSubLessonIndex === index
							? 'bg-tile-600 border-tile-600 text-text-100'
							: 'bg-tile-300 border-tile-600 text-text-300 hover:bg-tile-500'}"
					>
						{subLesson.title.english}
					</button>
				{/each}
			</div>
			<div class="flex justify-between items-center">
				<Button
					type="button"
					onClick={previousSubLesson}
					disabled={currentSubLessonIndex === 0}
				>
					Previous
				</Button>
				<span class="text-text-300 font-semibold">
					{currentSubLessonIndex + 1} / {lesson.subLessons.length}
				</span>
				<Button
					type="button"
					onClick={nextSubLesson}
					disabled={currentSubLessonIndex >= lesson.subLessons.length - 1}
				>
					Next
				</Button>
			</div>
		</div>

		<!-- Current Sub-lesson Content -->
		{#if currentSubLesson}
			<!-- Sub-lesson Header -->
			<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
				<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-2" dir="rtl">
					{currentSubLesson.title.arabic}
				</h2>
				<h3 class="text-xl sm:text-2xl text-text-200 mb-2">
					{currentSubLesson.title.english}
				</h3>
				{#if currentSubLesson.title.transliteration}
					<p class="text-text-300 text-lg mb-4">
						{currentSubLesson.title.transliteration}
					</p>
				{/if}
			</div>

			<!-- Content Section -->
			<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
				<div class="flex items-center gap-4 mb-4">
					<h3 class="text-xl font-bold text-text-300">Content</h3>
					<label class="flex items-center gap-2 text-text-200 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showEnglish}
							class="rounded"
						/>
						Show English
					</label>
					<label class="flex items-center gap-2 text-text-200 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showTransliteration}
							class="rounded"
						/>
						Show Transliteration
					</label>
				</div>

				<!-- Phrases List -->
				<div class="space-y-4">
					{#each currentSubLesson.content.phrases as phrase}
						<div
							class="bg-tile-500 border border-tile-600 p-4 rounded-lg hover:bg-tile-600 transition-colors"
						>
							<div class="flex items-start justify-between gap-4 flex-wrap">
								<div class="flex-1 min-w-[200px]">
									<p class="text-3xl text-text-300 mb-2" dir="rtl">
										{phrase.arabic}
									</p>
									{#if showTransliteration && phrase.transliteration}
										<p class="text-text-200 text-lg mb-1">
											{phrase.transliteration}
										</p>
									{/if}
									{#if showEnglish}
										<p class="text-text-200 font-semibold">
											{phrase.english}
										</p>
									{/if}
								</div>
								<div class="flex gap-2 flex-shrink-0">
									<AudioButton text={phrase.arabic} {dialect} audioUrl={phrase.audioUrl}>
										🔊
									</AudioButton>
									<SaveButton
										objectToSave={{
											arabic: phrase.arabic,
											english: phrase.english,
											transliterated: phrase.transliteration
										}}
										type="Word"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Explanations -->
				{#if currentSubLesson.content.explanations && currentSubLesson.content.explanations.length > 0}
					<div class="mt-6 pt-6 border-t border-tile-600">
						<h4 class="text-lg font-bold text-text-300 mb-3">Notes</h4>
						<ul class="space-y-2">
							{#each currentSubLesson.content.explanations as explanation}
								<li class="text-text-200 text-sm flex items-start gap-2">
									<span class="text-text-300 mt-1">•</span>
									<span>{explanation.english}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Exercises Section -->
			<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
				<h3 class="text-xl font-bold text-text-300 mb-4">
					Practice Exercises
				</h3>
				<div class="space-y-6">
					{#each currentSubLesson.exercises as exercise}
						<ExerciseBlock {exercise} {dialect} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

