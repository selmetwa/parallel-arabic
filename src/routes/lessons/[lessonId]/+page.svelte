<script lang="ts">
	import type { PageData } from './$types';
	import LessonDisplay from '$lib/components/lessons/LessonDisplay.svelte';
	import type { Dialect } from '$lib/types';

	let { data }: { data: PageData } = $props();
	const lesson = data.lesson;
	const dialect: Dialect = 'egyptian-arabic'; // Default to Egyptian Arabic for lessons
</script>

<svelte:head>
	<title>{lesson?.title?.english || 'Lesson'} - Parallel Arabic</title>
</svelte:head>

{#if lesson}
	<LessonDisplay {lesson} {dialect} />
{:else}
	<div class="min-h-screen bg-tile-200 py-8">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				<p class="font-semibold">Error:</p>
				<p>Lesson not found. Please visit /lessons/generate to create it.</p>
			</div>
		</div>
	</div>
{/if}
