<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let lessonData = $state<any>(null);
	let progressMessages = $state<string[]>([]);
	let currentProgress = $state('');

	async function generateLesson() {
		isLoading = true;
		error = '';
		success = false;
		lessonData = null;
		progressMessages = [];
		currentProgress = '';

		try {
			const response = await fetch('/api/generate-lesson-stream', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to generate lesson: ${response.statusText}`);
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const data = JSON.parse(line.slice(6));
							
							if (data.type === 'progress') {
								currentProgress = data.message;
								progressMessages = [...progressMessages, data.message];
							} else if (data.type === 'complete') {
								lessonData = data.lesson;
								success = true;
								currentProgress = '✅ Complete!';
							} else if (data.type === 'error') {
								throw new Error(data.message);
							}
						} catch (e) {
							// Skip invalid JSON
						}
					}
				}
			}
		} catch (e: any) {
			error = e.message || 'Failed to generate lesson';
			console.error('Error:', e);
		} finally {
			isLoading = false;
		}
	}

	function downloadLesson() {
		if (!lessonData) return;

		const lessonFile = `// Types are defined in index.ts to avoid circular dependencies
// This file only exports the lesson data
export const lesson1 = ${JSON.stringify(lessonData, null, 2)};
`;

		const blob = new Blob([lessonFile], { type: 'text/typescript' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'lesson-1.ts';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		if (!lessonData) return;

		const lessonFile = `// Types are defined in index.ts to avoid circular dependencies
// This file only exports the lesson data
export const lesson1 = ${JSON.stringify(lessonData, null, 2)};
`;

		navigator.clipboard.writeText(lessonFile).then(() => {
			alert('Lesson code copied to clipboard!');
		});
	}
</script>

<svelte:head>
	<title>Generate Lesson - Parallel Arabic</title>
</svelte:head>

<div class="min-h-screen bg-tile-200 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<header class="mb-8">
			<h1 class="text-4xl font-bold text-text-300 mb-4">Generate Lesson 1</h1>
			<p class="text-text-200 text-lg">
				Generate Lesson 1 using ChatGPT + NileChat4 for accurate Egyptian Arabic
			</p>
			<p class="text-text-200 text-sm mt-2">
				The lesson follows the template structure and validates all Arabic text through NileChat4 to ensure authentic Egyptian dialect.
				Includes interactive exercises: speaking practice, writing practice, and sentence practice.
			</p>
		</header>

		<div class="bg-tile-400 border border-tile-600 p-6 rounded-lg shadow-lg mb-6">
			<div class="flex flex-col gap-4">
				<Button type="button" onClick={generateLesson} disabled={isLoading}>
					{#if isLoading}
						Generating Lesson...
					{:else}
						Generate Lesson with ChatGPT + NileChat4
					{/if}
				</Button>

				{#if isLoading}
					<div class="bg-tile-500 border border-tile-600 p-4 rounded-lg">
						<div class="flex items-center gap-2 mb-2">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-text-300"></div>
							<p class="text-text-200 font-semibold">Generation in progress...</p>
						</div>
						{#if currentProgress}
							<p class="text-text-300 text-sm mb-2">{currentProgress}</p>
						{/if}
						<div class="max-h-64 overflow-y-auto space-y-1">
							{#each progressMessages as message}
								<p class="text-text-200 text-xs">{message}</p>
							{/each}
						</div>
					</div>
				{/if}

				{#if error}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						<p class="font-semibold">Error:</p>
						<p>{error}</p>
					</div>
				{/if}

				{#if success && lessonData}
					<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
						<p class="font-semibold mb-2">✅ Lesson generated successfully!</p>
						<div class="flex flex-wrap gap-2">
							<Button type="button" onClick={downloadLesson}>
								Download lesson-1.ts
							</Button>
							<Button type="button" onClick={copyToClipboard}>
								Copy to Clipboard
							</Button>
							<a href="/lessons/lesson-1">
								<Button type="button">
									View Lesson
								</Button>
							</a>
						</div>
						<p class="text-sm mt-2">
							💡 Save the downloaded file as <code class="bg-green-200 px-1 rounded">src/lib/constants/lessons/lesson-1.ts</code> to make it available for viewing.
						</p>
					</div>
				{/if}

				{#if lessonData}
					<div class="mt-4">
						<h2 class="text-2xl font-bold text-text-300 mb-2">Preview</h2>
						<div class="bg-tile-500 p-4 rounded">
							<p class="text-text-200">
								<strong>Title:</strong> {lessonData.title?.english || 'N/A'}
							</p>
							<p class="text-text-200">
								<strong>Sub-lessons:</strong> {lessonData.subLessons?.length || 0}
							</p>
							{#if lessonData.subLessons && lessonData.subLessons.length > 0}
								<ul class="list-disc list-inside mt-2 text-text-200">
									{#each lessonData.subLessons as subLesson}
										<li>
											{subLesson.title?.english || subLesson.id}
											{#if subLesson.exercises}
												<span class="text-text-300 text-sm">
													({subLesson.exercises.length} exercises)
												</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
