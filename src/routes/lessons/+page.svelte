<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const lesson1 = data.lesson1;
</script>

<svelte:head>
	<title>Lessons - Parallel Arabic</title>
</svelte:head>

<div class="min-h-screen bg-tile-200 py-8">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<header class="mb-8">
			<h1 class="text-4xl font-bold text-text-300 mb-4">Arabic Lessons</h1>
			<p class="text-text-200 text-lg">
				Learn Arabic through structured lessons with interactive exercises
			</p>
		</header>

		{#if !lesson1}
			<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
				<div class="text-center">
					<p class="text-text-200 text-lg mb-4">
						No lessons have been generated yet.
					</p>
					<a href="/lessons/generate">
						<Button type="button">
							Generate Lesson 1
						</Button>
					</a>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Lesson 1 Card -->
				<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
					<div class="flex flex-col gap-4">
						<div>
							<h2 class="text-2xl font-bold text-text-300 mb-2" dir="rtl">
								{lesson1.title.arabic}
							</h2>
							<h3 class="text-xl text-text-200 mb-2">
								{lesson1.title.english}
							</h3>
							<span
								class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
							>
								{lesson1.level.charAt(0).toUpperCase() + lesson1.level.slice(1)}
							</span>
						</div>

						<div class="text-text-200 text-sm">
							<p class="mb-2">
								<strong>{lesson1.subLessons.length} sub-lessons:</strong>
							</p>
							<ul class="list-disc list-inside space-y-1">
								{#each lesson1.subLessons as subLesson}
									<li>{subLesson.title.english}</li>
								{/each}
							</ul>
						</div>

						<div class="mt-auto flex gap-2">
							<a href="/lessons/lesson-1" class="flex-1">
								<Button type="button" className="w-full">
									Start Lesson
								</Button>
							</a>
							<a href="/lessons/generate" class="flex-1">
								<Button type="button" className="w-full">
									Regenerate
								</Button>
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

